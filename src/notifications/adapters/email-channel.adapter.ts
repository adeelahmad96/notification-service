import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationChannel, NotificationPayload } from '../interfaces/notification-channel.interface';

@Injectable()
export class EmailChannelAdapter implements NotificationChannel {
  private readonly logger = new Logger(EmailChannelAdapter.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
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

  async send(payload: NotificationPayload): Promise<void> {
    if (!payload.recipientEmail) {
      throw new Error('Recipient email is required for email channel');
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('email.from'),
        to: payload.recipientEmail,
        subject: payload.subject,
        text: payload.content,
        html: payload.htmlContent,
      });

      this.logger.debug(`Email sent successfully to ${payload.recipientEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${payload.recipientEmail}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  canHandle(channelType: string): boolean {
    return channelType.toLowerCase() === 'email';
  }
} 