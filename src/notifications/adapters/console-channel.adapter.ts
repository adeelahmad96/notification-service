import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationPayload } from '../interfaces/notification-channel.interface';

@Injectable()
export class ConsoleChannelAdapter implements NotificationChannel {
  private readonly logger = new Logger(ConsoleChannelAdapter.name);

  async send(payload: NotificationPayload): Promise<void> {
    this.logger.log('=== Notification Details ===');
    this.logger.log(`Recipient ID: ${payload.recipientId}`);
    this.logger.log(`Recipient Email: ${payload.recipientEmail || 'N/A'}`);
    this.logger.log(`Subject: ${payload.subject}`);
    this.logger.log('Content:');
    this.logger.log(payload.content);
    
    if (payload.htmlContent) {
      this.logger.log('HTML Content:');
      this.logger.log(payload.htmlContent);
    }
    
    if (payload.metadata) {
      this.logger.log('Metadata:');
      this.logger.log(JSON.stringify(payload.metadata, null, 2));
    }
    
    this.logger.log('=========================');
  }

  canHandle(channelType: string): boolean {
    return channelType.toLowerCase() === 'console';
  }
} 