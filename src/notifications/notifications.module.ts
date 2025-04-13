import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationController } from '../controllers/notification.controller';
import { ConfigService } from '@nestjs/config';
import { NotificationChannelFactory } from './factories/notification-channel.factory';
import { EmailChannelAdapter } from './adapters/email-channel.adapter';
import { ConsoleChannelAdapter } from './adapters/console-channel.adapter';
import { RabbitMQService } from './services/rabbitmq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationChannelFactory,
    EmailChannelAdapter,
    ConsoleChannelAdapter,
    RabbitMQService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule {} 