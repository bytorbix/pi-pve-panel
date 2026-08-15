import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map, startWith } from 'rxjs';
import { Proxmox } from '../proxmox';
import { Meter } from '../meter/meter';

interface ActivityEntry {
  message: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [Meter],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly proxmox = inject(Proxmox);

  private readonly now = toSignal(
    interval(1000).pipe(
      startWith(0),
      map(() => Date.now()),
    ),
    { initialValue: Date.now() },
  );

  readonly status = this.proxmox.status;
  readonly isBusy = this.proxmox.isBusy;
  readonly errorMessage = signal<string | null>(null);
  readonly activity = signal<ActivityEntry[]>([]);

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

  readonly latencyLabel = computed(() => {
    const latencyMs = this.status().latencyMs;
    return latencyMs === undefined ? null : `${latencyMs} ms`;
  });

  readonly lastCheckedLabel = computed(() => {
    const last = this.proxmox.lastChecked();
    if (!last) return null;
    const seconds = Math.max(0, Math.floor((this.now() - last.getTime()) / 1000));
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  });

  async wake(): Promise<void> {
    this.errorMessage.set(null);
    this.logActivity('Wake-on-LAN packet requested');
    try {
      await this.proxmox.wake();
      this.logActivity('Wake-on-LAN packet sent');
    } catch {
      this.errorMessage.set('Failed to send the wake-on-LAN packet.');
      this.logActivity('Wake-on-LAN packet failed to send');
    }
  }

  async shutdown(): Promise<void> {
    if (!confirm('Shut down the Proxmox host now?')) {
      return;
    }
    this.errorMessage.set(null);
    this.logActivity('Shutdown requested');
    try {
      await this.proxmox.shutdown();
      this.logActivity('Shutdown command sent');
    } catch {
      this.errorMessage.set('Failed to reach Proxmox to shut it down.');
      this.logActivity('Shutdown command failed');
    }
  }

  private logActivity(message: string): void {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    this.activity.update((entries) => [{ message, time }, ...entries].slice(0, 5));
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
