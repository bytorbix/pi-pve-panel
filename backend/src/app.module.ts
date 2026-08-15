import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxmoxModule } from './proxmox/proxmox.module';

@Module({
  imports: [ProxmoxModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
