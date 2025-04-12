import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
    });
  }

  @MessagePattern('send_notification')
  async handleNotification(@Payload() notification: Notification) {
    this.logger.debug(`Processing email notification ${notification.id}`);

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('email.from'),
        to: notification.recipientEmail,
        subject: notification.subject,
        text: notification.content,
        html: notification.htmlContent,
      });

      await this.notificationRepository.update(notification.id, {
        status: 'SENT',
        sentAt: new Date(),
      });

      this.logger.debug(`Email sent successfully for notification ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email for notification ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      await this.notificationRepository.update(notification.id, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: () => 'retryCount + 1',
      });

      throw error;
    }
  }
} 