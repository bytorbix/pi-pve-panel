import { Module } from '@nestjs/common';
import { ProxmoxController } from './proxmox.controller';
import { ProxmoxApiService } from './proxmox-api.service';
import { WolService } from './wol.service';

@Module({
  controllers: [ProxmoxController],
  providers: [ProxmoxApiService, WolService],
})
export class ProxmoxModule {}
