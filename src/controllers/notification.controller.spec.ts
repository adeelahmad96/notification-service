import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { Notification, NotificationType, NotificationStatus } from '../entities/notification.entity';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    create: jest.fn(),
    processNotification: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByRecipientId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create and process a notification', async () => {
      const createNotificationDto: CreateNotificationDto = {
        recipientId: '123',
        recipientEmail: 'test@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
        channels: [NotificationType.EMAIL],
      };

      const notification = new Notification();
      Object.assign(notification, {
        ...createNotificationDto,
        id: 'test-id',
        status: NotificationStatus.SENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockNotificationService.create.mockResolvedValue(notification);
      mockNotificationService.processNotification.mockResolvedValue(undefined);

      const result = await controller.create(createNotificationDto);

      expect(result).toEqual(notification);
      expect(mockNotificationService.create).toHaveBeenCalledWith(createNotificationDto);
      expect(mockNotificationService.processNotification).toHaveBeenCalledWith(notification);
    });
  });

  describe('findAll', () => {
    it('should return an array of notifications', async () => {
      const notifications = [new Notification(), new Notification()];
      mockNotificationService.findAll.mockResolvedValue(notifications);

      const result = await controller.findAll();

      expect(result).toEqual(notifications);
      expect(mockNotificationService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a notification by id', async () => {
      const notification = new Notification();
      mockNotificationService.findById.mockResolvedValue(notification);

      const result = await controller.findOne('123');

      expect(result).toEqual(notification);
      expect(mockNotificationService.findById).toHaveBeenCalledWith('123');
    });
  });

  describe('findByRecipient', () => {
    it('should return notifications by recipient id', async () => {
      const notifications = [new Notification(), new Notification()];
      mockNotificationService.findByRecipientId.mockResolvedValue(notifications);

      const result = await controller.findByRecipient('123');

      expect(result).toEqual(notifications);
      expect(mockNotificationService.findByRecipientId).toHaveBeenCalledWith('123');
    });
  });
}); 