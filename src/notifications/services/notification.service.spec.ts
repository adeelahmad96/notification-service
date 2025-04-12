import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Notification } from '../entities/notification.entity';
import { NotificationChannelFactory } from '../factories/notification-channel.factory';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: Repository<Notification>;
  let channelFactory: NotificationChannelFactory;
  let mockChannel: NotificationChannel;

  beforeEach(async () => {
    mockChannel = {
      send: jest.fn(),
      canHandle: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: NotificationChannelFactory,
          useValue: {
            getChannelsForNotification: jest.fn().mockReturnValue([mockChannel]),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    channelFactory = module.get<NotificationChannelFactory>(NotificationChannelFactory);
  });

  describe('sendNotification', () => {
    it('should successfully send a notification through all channels', async () => {
      const notification = {
        id: '123',
        type: 'APPLICATION_RECEIVED',
        recipientId: 'user123',
        recipientEmail: 'test@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
        status: 'PENDING',
      } as Notification;

      await service.sendNotification(notification);

      expect(mockChannel.send).toHaveBeenCalledWith({
        recipientId: notification.recipientId,
        recipientEmail: notification.recipientEmail,
        subject: notification.subject,
        content: notification.content,
        htmlContent: undefined,
        metadata: undefined,
      });

      expect(notificationRepository.update).toHaveBeenCalledWith(
        notification.id,
        expect.objectContaining({
          status: 'SENT',
          sentAt: expect.any(Date),
        })
      );
    });

    it('should handle send failure and update status', async () => {
      const notification = {
        id: '123',
        type: 'APPLICATION_RECEIVED',
        recipientId: 'user123',
        recipientEmail: 'test@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
        status: 'PENDING',
      } as Notification;

      const error = new Error('Send failed');
      mockChannel.send.mockRejectedValueOnce(error);

      await expect(service.sendNotification(notification)).rejects.toThrow(error);

      expect(notificationRepository.update).toHaveBeenCalledWith(
        notification.id,
        expect.objectContaining({
          status: 'FAILED',
          error: error.message,
        })
      );
    });
  });

  describe('createNotification', () => {
    it('should create a new notification with PENDING status', async () => {
      const dto: CreateNotificationDto = {
        type: 'APPLICATION_RECEIVED',
        recipientId: 'user123',
        recipientEmail: 'test@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
      };

      const createdNotification = { ...dto, id: '123', status: 'PENDING' };
      jest.spyOn(notificationRepository, 'create').mockReturnValue(createdNotification as Notification);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue(createdNotification as Notification);

      const result = await service.createNotification(dto);

      expect(notificationRepository.create).toHaveBeenCalledWith({
        ...dto,
        status: 'PENDING',
      });
      expect(notificationRepository.save).toHaveBeenCalledWith(createdNotification);
      expect(result).toEqual(createdNotification);
    });
  });

  describe('determineRecipientRole', () => {
    it('should return CANDIDATE for candidate-related notifications', () => {
      const testCases = ['APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED'];
      
      testCases.forEach(type => {
        const notification = { type } as Notification;
        expect(service['determineRecipientRole'](notification)).toBe('CANDIDATE');
      });
    });

    it('should return RECRUITER for unknown notification types', () => {
      const notification = { type: 'UNKNOWN_TYPE' } as Notification;
      expect(service['determineRecipientRole'](notification)).toBe('RECRUITER');
    });
  });
}); 