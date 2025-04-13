import { IsString, IsUUID, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsUUID()
  recipientId: string;

  @IsEmail()
  @IsOptional()
  recipientEmail?: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  htmlContent?: string;

  @IsOptional()
  metadata?: Record<string, any>;
} 