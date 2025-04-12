import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationConsumer } from './consumers/notification.consumer';
import { EmailChannelAdapter } from './adapters/email-channel.adapter';
import { ConsoleChannelAdapter } from './adapters/console-channel.adapter';
import { NotificationChannelFactory } from './factories/notification-channel.factory';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
  ],
  providers: [
    NotificationService,
    EmailChannelAdapter,
    ConsoleChannelAdapter,
    NotificationChannelFactory,
    NotificationRepository,
  ],
  controllers: [NotificationConsumer],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationsModule {} 