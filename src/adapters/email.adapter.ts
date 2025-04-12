import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationAdapter } from '../interfaces/notification-adapter.interface';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class EmailAdapter implements NotificationAdapter {
  private readonly logger = new Logger(EmailAdapter.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const emailConfig = this.configService.get('email');
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password,
      },
    });
  }

  async send(notification: Notification): Promise<void> {
    try {
      const emailConfig = this.configService.get('email');
      
      await this.transporter.sendMail({
        from: emailConfig.from || emailConfig.user,
        to: notification.recipientEmail,
        subject: notification.subject,
        text: notification.content,
        html: notification.htmlContent,
      });

      this.logger.debug(`Email sent successfully to ${notification.recipientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
} 