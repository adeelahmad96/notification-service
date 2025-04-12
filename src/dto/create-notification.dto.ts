import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
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
} 