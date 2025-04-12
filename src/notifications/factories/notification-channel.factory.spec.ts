import { Test, TestingModule } from '@nestjs/testing';
import { NotificationChannelFactory } from './notification-channel.factory';
import { EmailChannelAdapter } from '../adapters/email-channel.adapter';
import { ConsoleChannelAdapter } from '../adapters/console-channel.adapter';
import { ConfigService } from '@nestjs/config';

describe('NotificationChannelFactory', () => {
  let factory: NotificationChannelFactory;
  let emailChannel: EmailChannelAdapter;
  let consoleChannel: ConsoleChannelAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationChannelFactory,
        {
          provide: EmailChannelAdapter,
          useValue: {
            send: jest.fn(),
            canHandle: (type: string) => type.toLowerCase() === 'email',
          },
        },
        {
          provide: ConsoleChannelAdapter,
          useValue: {
            send: jest.fn(),
            canHandle: (type: string) => type.toLowerCase() === 'console',
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get<NotificationChannelFactory>(NotificationChannelFactory);
    emailChannel = module.get<EmailChannelAdapter>(EmailChannelAdapter);
    consoleChannel = module.get<ConsoleChannelAdapter>(ConsoleChannelAdapter);
  });

  describe('getChannelsForNotification', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'; // Default to production for tests
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should include console channel in development environment', () => {
      process.env.NODE_ENV = 'development';
      const channels = factory.getChannelsForNotification('CANDIDATE', 'APPLICATION_RECEIVED');
      expect(channels).toContainEqual(expect.objectContaining({ canHandle: consoleChannel.canHandle }));
    });

    it('should send all notifications to candidates via email', () => {
      const testCases = ['APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED'];
      
      testCases.forEach(notificationType => {
        const channels = factory.getChannelsForNotification('CANDIDATE', notificationType as any);
        expect(channels).toContainEqual(expect.objectContaining({ canHandle: emailChannel.canHandle }));
      });
    });

    it('should send only interview and offer notifications to hiring managers', () => {
      // Should receive email for interview notifications
      const interviewChannels = factory.getChannelsForNotification('HIRING_MANAGER', 'INTERVIEW_SCHEDULED');
      expect(interviewChannels).toContainEqual(expect.objectContaining({ canHandle: emailChannel.canHandle }));

      // Should receive email for offer notifications
      const offerChannels = factory.getChannelsForNotification('HIRING_MANAGER', 'OFFER_EXTENDED');
      expect(offerChannels).toContainEqual(expect.objectContaining({ canHandle: emailChannel.canHandle }));

      // Should not receive email for application notifications
      const applicationChannels = factory.getChannelsForNotification('HIRING_MANAGER', 'APPLICATION_RECEIVED');
      expect(applicationChannels).not.toContainEqual(expect.objectContaining({ canHandle: emailChannel.canHandle }));
    });

    it('should send all notifications to recruiters via email', () => {
      const testCases = ['APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED'];
      
      testCases.forEach(notificationType => {
        const channels = factory.getChannelsForNotification('RECRUITER', notificationType as any);
        expect(channels).toContainEqual(expect.objectContaining({ canHandle: emailChannel.canHandle }));
      });
    });

    it('should log warning for unknown recipient roles', () => {
      const loggerSpy = jest.spyOn(factory['logger'], 'warn');
      factory.getChannelsForNotification('UNKNOWN_ROLE' as any, 'APPLICATION_RECEIVED');
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown recipient role'));
    });
  });

  describe('getChannelByType', () => {
    it('should throw error for unknown channel type', () => {
      expect(() => {
        factory['getChannelByType']('unknown');
      }).toThrow('No channel found for type: unknown');
    });

    it('should return correct channel for known types', () => {
      const emailResult = factory['getChannelByType']('email');
      expect(emailResult.canHandle('email')).toBeTruthy();

      const consoleResult = factory['getChannelByType']('console');
      expect(consoleResult.canHandle('console')).toBeTruthy();
    });
  });
}); 