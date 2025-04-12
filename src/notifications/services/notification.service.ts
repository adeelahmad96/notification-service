import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationChannelFactory, RecipientRole } from '../factories/notification-channel.factory';
import { NotificationPayload } from '../interfaces/notification-channel.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private notificationChannelFactory: NotificationChannelFactory,
  ) {}

  async sendNotification(notification: Notification): Promise<void> {
    this.logger.debug(`Processing notification ${notification.id}`);

    try {
      const payload: NotificationPayload = {
        recipientId: notification.recipientId,
        recipientEmail: notification.recipientEmail,
        subject: notification.subject,
        content: notification.content,
        htmlContent: notification.htmlContent,
        metadata: notification.metadata,
      };

      // Get appropriate channels based on recipient role and notification type
      const recipientRole = this.determineRecipientRole(notification);
      const channels = this.notificationChannelFactory.getChannelsForNotification(
        recipientRole,
        notification.type as any
      );

      // Send through all appropriate channels
      await Promise.all(channels.map(channel => channel.send(payload)));

      // Update notification status
      await this.notificationRepository.update(notification.id, {
        status: 'SENT',
        sentAt: new Date(),
      });

      this.logger.debug(`Notification ${notification.id} sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      await this.notificationRepository.update(notification.id, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: () => 'retryCount + 1',
      });

      throw error;
    }
  }

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...dto,
      status: 'PENDING',
    });

    return this.notificationRepository.save(notification);
  }

  private determineRecipientRole(notification: Notification): RecipientRole {
    // This could be more sophisticated, possibly looking up the recipient in a users table
    // For now, we'll use a simple mapping based on the notification type
    switch (notification.type) {
      case 'APPLICATION_RECEIVED':
      case 'INTERVIEW_SCHEDULED':
      case 'OFFER_EXTENDED':
        return 'CANDIDATE';
      default:
        return 'RECRUITER';
    }
  }
} 