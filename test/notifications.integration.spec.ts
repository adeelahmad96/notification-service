import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { NotificationService } from '../src/notifications/services/notification.service';
import { Notification } from '../src/notifications/entities/notification.entity';
import { CreateNotificationDto } from '../src/notifications/dto/create-notification.dto';

describe('Notifications Integration', () => {
  let app: INestApplication;
  let notificationService: NotificationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST'),
            port: configService.get('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: configService.get('DB_DATABASE'),
            entities: [Notification],
            synchronize: true, // Only for testing
          }),
          inject: [ConfigService],
        }),
        NotificationsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    notificationService = moduleFixture.get<NotificationService>(NotificationService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Notification Flow', () => {
    it('should create and send a notification', async () => {
      // Create a notification
      const createDto: CreateNotificationDto = {
        type: 'APPLICATION_RECEIVED',
        recipientId: 'test-user-123',
        recipientEmail: 'test@example.com',
        subject: 'New Application Received',
        content: 'A new application has been received for the Software Engineer position.',
      };

      const notification = await notificationService.createNotification(createDto);

      // Verify notification was created with correct initial state
      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.status).toBe('PENDING');
      expect(notification.type).toBe(createDto.type);
      expect(notification.recipientEmail).toBe(createDto.recipientEmail);

      // Send the notification
      await notificationService.sendNotification(notification);

      // Query the database to verify the notification status was updated
      const updatedNotification = await notificationService['notificationRepository'].findOne({
        where: { id: notification.id },
      });

      expect(updatedNotification).toBeDefined();
      expect(updatedNotification?.status).toBe('SENT');
      expect(updatedNotification?.sentAt).toBeDefined();
    });

    it('should handle failed notifications correctly', async () => {
      // Create a notification with invalid email to trigger failure
      const createDto: CreateNotificationDto = {
        type: 'APPLICATION_RECEIVED',
        recipientId: 'test-user-456',
        recipientEmail: 'invalid-email',  // Invalid email to trigger failure
        subject: 'Test Failed Notification',
        content: 'This notification should fail.',
      };

      const notification = await notificationService.createNotification(createDto);

      // Attempt to send the notification (should fail)
      await expect(notificationService.sendNotification(notification)).rejects.toThrow();

      // Verify the notification status was updated to FAILED
      const failedNotification = await notificationService['notificationRepository'].findOne({
        where: { id: notification.id },
      });

      expect(failedNotification).toBeDefined();
      expect(failedNotification?.status).toBe('FAILED');
      expect(failedNotification?.error).toBeDefined();
      expect(failedNotification?.retryCount).toBe(1);
    });
  });
}); 