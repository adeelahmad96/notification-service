import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { Notification, NotificationStatus } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private emailTransporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>
  ) {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter() {
    this.emailTransporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
    });
  }

  async sendNotification(notification: Notification): Promise<void> {
    this.logger.debug(`Sending notification ${notification.id}`);

    try {
      await this.sendEmail(notification);
      
      await this.notificationRepository.update(notification.id, {
        status: 'SENT',
        sentAt: new Date(),
      });

      this.logger.debug(`Notification ${notification.id} sent successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      const isPermamentFailure = this.isPermanentFailure(error);
      const newStatus = isPermamentFailure ? 'FAILED_PERMANENT' : 'FAILED';
      await this.notificationRepository.update(notification.id, {
        status: newStatus as NotificationStatus,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: () => 'retryCount + 1',
      });

      throw error;
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    await this.emailTransporter.sendMail({
      from: this.configService.get<string>('email.from'),
      to: notification.recipientEmail,
      subject: notification.subject,
      text: notification.content,
      html: notification.htmlContent,
    });
  }

  private isPermanentFailure(error: unknown): boolean {
    if (error instanceof Error) {
      // Check for permanent failure conditions
      const permanentFailureMessages = [
        'invalid email address',
        'email address does not exist',
        'recipient rejected',
        'mailbox unavailable',
      ];

      return permanentFailureMessages.some(msg => 
        error.message.toLowerCase().includes(msg.toLowerCase())
      );
    }
    return false;
  }
} 