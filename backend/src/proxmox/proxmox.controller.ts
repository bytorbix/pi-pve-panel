import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ProxmoxApiService } from './proxmox-api.service';
import { WolService } from './wol.service';

@Controller('server')
export class ProxmoxController {
  constructor(
    private readonly proxmoxApi: ProxmoxApiService,
    private readonly wol: WolService,
  ) {}

  @Get('status')
  getStatus() {
    return this.proxmoxApi.getStatus();
  }

  @Post('shutdown')
  @HttpCode(200)
  shutdown() {
    return this.proxmoxApi.shutdown();
  }

  @Post('wake')
  @HttpCode(200)
  wake() {
    return this.wol.wake();
  }
}
