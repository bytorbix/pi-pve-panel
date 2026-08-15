import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, firstValueFrom, interval, of, startWith, switchMap } from 'rxjs';

export interface ProxmoxStatus {
  online: boolean;
  cpu?: number;
  memUsed?: number;
  memTotal?: number;
  diskUsed?: number;
  diskTotal?: number;
  uptime?: number;
  loadavg?: number[];
}

const POLL_INTERVAL_MS = 5000;
const OFFLINE_STATUS: ProxmoxStatus = { online: false };

@Service()
export class Proxmox {
  private readonly http = inject(HttpClient);

  private readonly busy = signal(false);
  readonly isBusy = this.busy.asReadonly();

  readonly status = toSignal(
    interval(POLL_INTERVAL_MS).pipe(
      startWith(0),
      switchMap(() =>
        this.http.get<ProxmoxStatus>('/server/status').pipe(catchError(() => of(OFFLINE_STATUS))),
      ),
    ),
    { initialValue: OFFLINE_STATUS },
  );

  async wake(): Promise<void> {
    this.busy.set(true);
    try {
      await firstValueFrom(this.http.post('/server/wake', {}));
    } finally {
      this.busy.set(false);
    }
  }

  async shutdown(): Promise<void> {
    this.busy.set(true);
    try {
      await firstValueFrom(this.http.post('/server/shutdown', {}));
    } finally {
      this.busy.set(false);
    }
  }
}
