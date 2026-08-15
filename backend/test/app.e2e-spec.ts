import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    process.env.PROXMOX_HOST = 'invalid.example';
    process.env.PROXMOX_NODE = 'pve';
    process.env.PROXMOX_TOKEN_ID = 'test@pam!test';
    process.env.PROXMOX_TOKEN_SECRET = 'test';
    process.env.WOL_MAC = 'AA:BB:CC:DD:EE:FF';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/server/status (GET)', () => {
    return request(app.getHttpServer())
      .get('/server/status')
      .expect(200)
      .expect((res) => {
        const body = res.body as { online: unknown };
        expect(typeof body.online).toBe('boolean');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
