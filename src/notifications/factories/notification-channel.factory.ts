import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { EmailChannelAdapter } from '../adapters/email-channel.adapter';
import { ConsoleChannelAdapter } from '../adapters/console-channel.adapter';

export type RecipientRole = 'CANDIDATE' | 'HIRING_MANAGER' | 'RECRUITER';
export type NotificationType = 'APPLICATION_RECEIVED' | 'INTERVIEW_SCHEDULED' | 'OFFER_EXTENDED';

@Injectable()
export class NotificationChannelFactory {
  private readonly logger = new Logger(NotificationChannelFactory.name);
  private readonly channels: NotificationChannel[];

  constructor(
    private readonly emailChannel: EmailChannelAdapter,
    private readonly consoleChannel: ConsoleChannelAdapter,
  ) {
    this.channels = [emailChannel, consoleChannel];
  }

  getChannelsForNotification(recipientRole: RecipientRole, notificationType: NotificationType): NotificationChannel[] {
    const selectedChannels: NotificationChannel[] = [];

    // Default to console logging for all notifications in development
    if (process.env.NODE_ENV !== 'production') {
      selectedChannels.push(this.getChannelByType('console'));
    }

    // Add email channel based on recipient role and notification type
    switch (recipientRole) {
      case 'CANDIDATE':
        // Candidates receive all notifications via email
        selectedChannels.push(this.getChannelByType('email'));
        break;

      case 'HIRING_MANAGER':
        // Hiring managers receive interview and offer notifications via email
        if (['INTERVIEW_SCHEDULED', 'OFFER_EXTENDED'].includes(notificationType)) {
          selectedChannels.push(this.getChannelByType('email'));
        }
        break;

      case 'RECRUITER':
        // Recruiters receive all notifications via email
        selectedChannels.push(this.getChannelByType('email'));
        break;

      default:
        this.logger.warn(`Unknown recipient role: ${recipientRole}`);
    }

    return selectedChannels;
  }

  private getChannelByType(channelType: string): NotificationChannel {
    const channel = this.channels.find(ch => ch.canHandle(channelType));
    if (!channel) {
      throw new Error(`No channel found for type: ${channelType}`);
    }
    return channel;
  }
} 