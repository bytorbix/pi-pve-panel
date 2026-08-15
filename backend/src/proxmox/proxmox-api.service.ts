import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as https from 'node:https';
import { ProxmoxStatus } from './proxmox-status.interface';

interface ProxmoxNodeStatusResponse {
  data: {
    cpu: number;
    memory: { used: number; total: number };
    rootfs: { used: number; total: number };
    uptime: number;
    loadavg: string[];
  };
}

@Injectable()
export class ProxmoxApiService {
  private readonly logger = new Logger(ProxmoxApiService.name);
  private readonly client: AxiosInstance;
  private readonly node: string;

  constructor(config: ConfigService) {
    const host = config.getOrThrow<string>('PROXMOX_HOST');
    const port = config.get<string>('PROXMOX_PORT', '8006');
    const tokenId = config.getOrThrow<string>('PROXMOX_TOKEN_ID');
    const tokenSecret = config.getOrThrow<string>('PROXMOX_TOKEN_SECRET');
    const allowSelfSigned =
      config.get<string>('PROXMOX_ALLOW_SELF_SIGNED', 'true') === 'true';
    this.node = config.getOrThrow<string>('PROXMOX_NODE');

    this.client = axios.create({
      baseURL: `https://${host}:${port}/api2/json`,
      timeout: 4000,
      headers: { Authorization: `PVEAPIToken=${tokenId}=${tokenSecret}` },
      httpsAgent: new https.Agent({ rejectUnauthorized: !allowSelfSigned }),
    });
  }

  async getStatus(): Promise<ProxmoxStatus> {
    const startedAt = Date.now();
    try {
      const { data } = await this.client.get<ProxmoxNodeStatusResponse>(
        `/nodes/${this.node}/status`,
      );
      const d = data.data;
      return {
        online: true,
        cpu: d.cpu,
        memUsed: d.memory?.used,
        memTotal: d.memory?.total,
        diskUsed: d.rootfs?.used,
        diskTotal: d.rootfs?.total,
        uptime: d.uptime,
        loadavg: d.loadavg?.map(Number),
        latencyMs: Date.now() - startedAt,
      };
    } catch (err) {
      this.logger.debug(`Proxmox unreachable: ${(err as Error).message}`);
      return { online: false };
    }
  }

  async shutdown(): Promise<void> {
    await this.client.post(
      `/nodes/${this.node}/status`,
      {},
      { params: { command: 'shutdown' } },
    );
  }
}
