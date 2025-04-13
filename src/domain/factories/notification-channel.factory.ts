import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../interfaces/notification-channel.interface';

@Injectable()
export class NotificationChannelFactory {
  private readonly logger = new Logger(NotificationChannelFactory.name);
  private channels: NotificationChannel[] = [];

  constructor() {}

  registerChannel(channel: NotificationChannel): void {
    this.channels.push(channel);
    this.logger.log(`Added channel: ${channel.getName()}`);
  }

  getChannelForNotification(notification: Notification): NotificationChannel {
    // For now, just return the first channel that can handle it
    // TODO: Add proper channel selection logic
    const channel = this.channels.find(ch => ch.canHandle(notification));
    
    if (!channel) {
      throw new Error(`No channel found for notification type: ${notification.type}`);
    }

    return channel;
  }
} 