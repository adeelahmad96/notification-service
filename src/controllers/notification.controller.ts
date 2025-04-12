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
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
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
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    type: Notification,
    description: 'The notification has been successfully created and queued for delivery.'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid notification data provided.'
  })
  async create(
    @Body(new ValidationPipe({ transform: true }))
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    this.logger.debug(
      `Creating notification for recipient: ${createNotificationDto.recipientId}`,
    );
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: [Notification],
    description: 'Returns all notifications.'
  })
  findAll(): Promise<Notification[]> {
    return this.notificationService.findAll();
  }

  @Get('recipient/:recipientId')
  @ApiOperation({ summary: 'Get notifications by recipient ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: [Notification],
    description: 'Returns all notifications for the recipient.'
  })
  findByRecipient(@Param('recipientId') recipientId: string): Promise<Notification[]> {
    return this.notificationService.findByRecipientId(recipientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    type: Notification,
    description: 'Returns a specific notification.'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Notification not found.'
  })
  findOne(@Param('id') id: string): Promise<Notification> {
    return this.notificationService.findOne(id);
  }

  // TODO: Add endpoint for bulk notifications
  // TODO: Add endpoint for canceling notifications
  // TODO: Add endpoint for notification templates
} 