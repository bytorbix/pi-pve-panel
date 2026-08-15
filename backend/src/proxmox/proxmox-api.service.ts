import { Injectable } from '@nestjs/common';

// TODO: replace with real Proxmox API calls
@Injectable()
export class ProxmoxApiService {
  getStatus() {
    return { online: false };
  }

  shutdown() {
    return;
  }
}
