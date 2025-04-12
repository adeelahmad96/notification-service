import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { NotificationType } from '../src/enums/notification-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../src/config/configuration';

describe('NotificationController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('database.host'),
            port: configService.get('database.port'),
            username: configService.get('database.username'),
            password: configService.get('database.password'),
            database: configService.get('database.database'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/notifications (POST) - should create a notification', () => {
    return request(app.getHttpServer())
      .post('/notifications')
      .send({
        recipientId: '123',
        recipientEmail: 'test@example.com',
        subject: 'E2E Test Subject',
        content: 'E2E Test Content',
        channels: [NotificationType.EMAIL],
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.recipientId).toBe('123');
        expect(res.body.recipientEmail).toBe('test@example.com');
        expect(res.body.subject).toBe('E2E Test Subject');
        expect(res.body.content).toBe('E2E Test Content');
        expect(res.body.channels).toEqual([NotificationType.EMAIL]);
      });
  });

  it('/notifications (POST) - should validate request body', () => {
    return request(app.getHttpServer())
      .post('/notifications')
      .send({
        recipientId: '123',
        recipientEmail: 'invalid-email', // Invalid email format
        subject: 'Test Subject',
        content: 'Test Content',
      })
      .expect(400);
  });

  it('/notifications (GET) - should return notifications', () => {
    return request(app.getHttpServer())
      .get('/notifications')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/notifications/:id (GET) - should return a notification', async () => {
    // First create a notification
    const createResponse = await request(app.getHttpServer())
      .post('/notifications')
      .send({
        recipientId: '123',
        recipientEmail: 'test@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
        channels: [NotificationType.EMAIL],
      });

    const notificationId = createResponse.body.id;

    // Then retrieve it
    return request(app.getHttpServer())
      .get(`/notifications/${notificationId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(notificationId);
      });
  });

  it('/notifications/recipient/:recipientId (GET) - should return recipient notifications', () => {
    return request(app.getHttpServer())
      .get('/notifications/recipient/123')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        res.body.forEach((notification) => {
          expect(notification.recipientId).toBe('123');
        });
      });
  });
});
