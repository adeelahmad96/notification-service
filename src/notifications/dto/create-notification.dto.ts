import { IsString, IsUUID, IsEmail, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum NotificationType {
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  OFFER_EXTENDED = 'OFFER_EXTENDED',
}

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsUUID()
  recipientId: string;

  @IsEmail()
  recipientEmail: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  htmlContent?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 