import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../domain/entities/notification.entity';
import { NotificationController } from '../application/controllers/notification.controller';
import { NotificationService } from '../application/services/notification.service';
import { NotificationRepository } from '../infrastructure/repositories/notification.repository';
import { NotificationChannelFactory } from '../domain/factories/notification-channel.factory';
import { EmailAdapter } from '../infrastructure/adapters/email.adapter';
import { ConsoleAdapter } from '../infrastructure/adapters/console.adapter';
import { RabbitMQService } from '../infrastructure/messaging/rabbitmq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationChannelFactory,
    EmailAdapter,
    ConsoleAdapter,
    RabbitMQService,
  ],
  exports: [NotificationService],
})
export class NotificationsModule implements OnModuleInit {
  constructor(
    private readonly channelFactory: NotificationChannelFactory,
    private readonly emailAdapter: EmailAdapter,
    private readonly consoleAdapter: ConsoleAdapter,
  ) {}

  onModuleInit() {
    // Register available notification channels
    this.channelFactory.registerChannel(this.emailAdapter);
    this.channelFactory.registerChannel(this.consoleAdapter);
  }
} 