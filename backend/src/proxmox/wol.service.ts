import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dgram from 'node:dgram';

@Injectable()
export class WolService {
  constructor(private readonly config: ConfigService) {}

  async wake(): Promise<void> {
    const mac = this.config.getOrThrow<string>('WOL_MAC');
    const address = this.config.get<string>(
      'WOL_BROADCAST_ADDRESS',
      '255.255.255.255',
    );
    const port = Number(this.config.get<string>('WOL_PORT', '9'));
    const packet = this.buildMagicPacket(mac);

    await new Promise<void>((resolve, reject) => {
      const socket = dgram.createSocket('udp4');
      socket.once('error', (err) => {
        socket.close();
        reject(err);
      });
      socket.bind(() => {
        socket.setBroadcast(true);
        socket.send(packet, 0, packet.length, port, address, (err) => {
          socket.close();
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  private buildMagicPacket(mac: string): Buffer {
    const bytes = mac.split(/[:-]/).map((b) => parseInt(b, 16));
    if (bytes.length !== 6 || bytes.some(Number.isNaN)) {
      throw new Error(`Invalid MAC address: ${mac}`);
    }
    const macBuffer = Buffer.from(bytes);
    const repeated = new Array<Buffer>(16).fill(macBuffer);
    return Buffer.concat([Buffer.alloc(6, 0xff), ...repeated]);
  }
}
