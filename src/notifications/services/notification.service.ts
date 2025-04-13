import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType } from '../entities/notification.entity';
import { NotificationChannelFactory, RecipientRole } from '../factories/notification-channel.factory';
import { NotificationPayload } from '../interfaces/notification-channel.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { RabbitMQService } from './rabbitmq.service';
import { NotificationRepository } from '../repositories/notification.repository';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationChannelFactory: NotificationChannelFactory,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create(notificationData);
    const savedNotification = await this.notificationRepository.save(notification);
    
    try {
      if (!this.rabbitMQService.isReady()) {
        this.logger.warn('RabbitMQ service not ready, notification will be processed later');
        return savedNotification;
      }

      // Publish to RabbitMQ for processing
      await this.rabbitMQService.publish('hiring', 'notification.created', {
        notificationId: savedNotification.id,
        type: savedNotification.type,
        recipientId: savedNotification.recipientId,
      });
      
      this.logger.debug(`Notification ${savedNotification.id} published to RabbitMQ`);
    } catch (error) {
      this.logger.error(`Failed to publish notification ${savedNotification.id} to RabbitMQ`, error);
      // Don't throw the error, just log it and continue
      // The notification will be processed later when RabbitMQ is available
    }
    
    return savedNotification;
  }

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

      // Publish to RabbitMQ
      const channel = this.rabbitMQService.getChannel();
      await channel.publish('hiring', 'notification.sent', {
        notificationId: notification.id,
        type: notification.type,
        recipientId: notification.recipientId,
        status: NotificationStatus.SENT,
        timestamp: new Date(),
      });

      // Update notification status
      await this.notificationRepository.update(notification.id, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });

      this.logger.debug(`Notification ${notification.id} sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      await this.notificationRepository.update(notification.id, {
        status: NotificationStatus.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: () => 'CASE WHEN retry_count IS NULL THEN 1 ELSE retry_count + 1 END',
      });

      throw error;
    }
  }

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      status: NotificationStatus.PENDING,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find();
  }

  async findOne(id: string): Promise<Notification> {
    return this.notificationRepository.findOneOrFail({ where: { id } });
  }

  async findByRecipientId(recipientId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsSent(id: string): Promise<Notification> {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
    return this.findOne(id);
  }

  async markAsFailed(id: string, error: string): Promise<Notification> {
    const notification = await this.findOne(id);
    const retryCount = (notification.retryCount || 0) + 1;
    const status = retryCount >= 3 ? NotificationStatus.FAILED_PERMANENT : NotificationStatus.FAILED;

    await this.notificationRepository.update(id, {
      status,
      error,
      retryCount,
    });

    return this.findOne(id);
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