import { Component, computed, inject, signal } from '@angular/core';
import { Proxmox } from '../proxmox';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly proxmox = inject(Proxmox);

  readonly status = this.proxmox.status;
  readonly isBusy = this.proxmox.isBusy;
  readonly errorMessage = signal<string | null>(null);

  readonly cpuPercent = computed(() => {
    const cpu = this.status().cpu;
    return cpu === undefined ? null : Math.round(cpu * 100);
  });

  readonly memPercent = computed(() => {
    const { memUsed, memTotal } = this.status();
    return memUsed === undefined || !memTotal ? null : Math.round((memUsed / memTotal) * 100);
  });

  readonly memLabel = computed(() => {
    const { memUsed, memTotal } = this.status();
    return memUsed === undefined || memTotal === undefined
      ? null
      : `${formatBytes(memUsed)} / ${formatBytes(memTotal)}`;
  });

  readonly diskPercent = computed(() => {
    const { diskUsed, diskTotal } = this.status();
    return diskUsed === undefined || !diskTotal ? null : Math.round((diskUsed / diskTotal) * 100);
  });

  readonly diskLabel = computed(() => {
    const { diskUsed, diskTotal } = this.status();
    return diskUsed === undefined || diskTotal === undefined
      ? null
      : `${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}`;
  });

  readonly uptimeLabel = computed(() => {
    const uptime = this.status().uptime;
    return uptime === undefined ? null : formatUptime(uptime);
  });

  readonly loadAvgLabel = computed(() => {
    const loadavg = this.status().loadavg;
    return loadavg?.length ? loadavg.map((n) => n.toFixed(2)).join(' / ') : null;
  });

  async wake(): Promise<void> {
    this.errorMessage.set(null);
    try {
      await this.proxmox.wake();
    } catch {
      this.errorMessage.set('Failed to send the wake-on-LAN packet.');
    }
  }

  async shutdown(): Promise<void> {
    if (!confirm('Shut down the Proxmox host now?')) {
      return;
    }
    this.errorMessage.set(null);
    try {
      await this.proxmox.shutdown();
    } catch {
      this.errorMessage.set('Failed to reach Proxmox to shut it down.');
    }
  }
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (days || hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}
