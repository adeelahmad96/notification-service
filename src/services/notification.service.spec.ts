import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { BadRequestException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: Repository<Notification>;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
  };

  const mockClientProxy = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(Notification), useValue: mockRepo },
        { provide: 'NOTIFICATION_SERVICE', useValue: mockClientProxy },
      ],
    }).compile();

    service = module.get(NotificationService);
    repo = module.get(getRepositoryToken(Notification));
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create notification', () => {
    const testDto: CreateNotificationDto = {
      recipientId: '123-456',
      recipientEmail: 'test@example.com',
      subject: 'Test',
      content: 'Hello',
      htmlContent: '<p>Hello</p>',
    };

    const fakeNotification: Partial<Notification> = {
      id: 'fake-id-123',
      ...testDto,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create and emit notification', async () => {
      mockRepo.create.mockReturnValue(fakeNotification);
      mockRepo.save.mockResolvedValue(fakeNotification);
      mockClientProxy.emit.mockReturnValue(undefined);

      const result = await service.create(testDto);

      expect(result).toBeTruthy();
      expect(mockRepo.create).toHaveBeenCalledWith(testDto);
      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockClientProxy.emit).toHaveBeenCalledWith('send_notification', fakeNotification);
    });
  });

  describe('find operations', () => {
    it('should find all notifications', async () => {
      const mockNotifs = [{ id: '1', status: 'SENT' }];
      mockRepo.find.mockResolvedValue(mockNotifs);

      const result = await service.findAll();
      expect(result).toEqual(mockNotifs);
    });

    it('should find notifications by recipient', async () => {
      const mockNotifs = [{ id: '1', status: 'SENT' }];
      mockRepo.find.mockResolvedValue(mockNotifs);

      const result = await service.findByRecipientId('123');
      expect(result).toEqual(mockNotifs);
    });

    it('should find one notification', async () => {
      const mockNotif = { id: '1', status: 'SENT' };
      mockRepo.findOneOrFail.mockResolvedValue(mockNotif);

      const result = await service.findOne('1');
      expect(result).toEqual(mockNotif);
    });
  });
}); 