import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { NotificationService } from '../notifications/services/notification.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import { Notification } from '../entities/notification.entity';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseInterceptors(ClassSerializerInterceptor)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Notification created successfully' })
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    this.logger.debug(
      `Creating notification for recipient: ${createNotificationDto.recipientId}`,
    );
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all notifications' })
  async getAllNotifications() {
    return this.notificationService.findAll();
  }

  @Get('recipient/:id')
  @ApiOperation({ summary: 'Get notifications by recipient ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return notifications for recipient' })
  async getNotificationsByRecipient(@Param('id') recipientId: string) {
    return this.notificationService.findByRecipientId(recipientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return notification by ID' })
  async getNotification(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  // TODO: Add endpoint for bulk notifications
  // TODO: Add endpoint for canceling notifications
  // TODO: Add endpoint for notification templates
} 