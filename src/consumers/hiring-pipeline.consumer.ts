import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationService } from '../services/notification.service';

interface ApplicationReceivedEvent {
  applicationId: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  position: string;
  company: string;
}

interface InterviewScheduledEvent {
  applicationId: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  interviewDate: string;
  interviewType: string;
  interviewerName: string;
  position: string;
}

interface OfferExtendedEvent {
  applicationId: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  position: string;
  company: string;
  startDate: string;
  offerDetails: {
    salary: number;
    benefits: string[];
    startDate: string;
  };
}

@Controller()
export class HiringPipelineConsumer {
  private readonly logger = new Logger(HiringPipelineConsumer.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private notificationService: NotificationService
  ) {}

  @MessagePattern('application.received')
  async handleApplicationReceived(@Payload() event: ApplicationReceivedEvent) {
    this.logger.debug(`Processing application received event for candidate ${event.candidateId}`);

    try {
      const notification = await this.notificationRepository.create({
        type: 'APPLICATION_RECEIVED',
        recipientId: event.candidateId,
        recipientEmail: event.candidateEmail,
        subject: `Application Received - ${event.position} at ${event.company}`,
        content: `Dear ${event.candidateName},\n\nThank you for applying for the ${event.position} position at ${event.company}. We have received your application and our team will review it shortly.\n\nBest regards,\nRecruitment Team`,
        status: 'PENDING',
      });

      await this.notificationRepository.save(notification);
      await this.notificationService.sendNotification(notification);

    } catch (error) {
      this.logger.error(
        `Failed to process application received event for candidate ${event.candidateId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  @MessagePattern('interview.scheduled')
  async handleInterviewScheduled(@Payload() event: InterviewScheduledEvent) {
    this.logger.debug(`Processing interview scheduled event for candidate ${event.candidateId}`);

    try {
      const notification = await this.notificationRepository.create({
        type: 'INTERVIEW_SCHEDULED',
        recipientId: event.candidateId,
        recipientEmail: event.candidateEmail,
        subject: `Interview Scheduled - ${event.position}`,
        content: `Dear ${event.candidateName},\n\nYour ${event.interviewType} interview has been scheduled for ${event.interviewDate} with ${event.interviewerName}.\n\nBest regards,\nRecruitment Team`,
        status: 'PENDING',
      });

      await this.notificationRepository.save(notification);
      await this.notificationService.sendNotification(notification);

    } catch (error) {
      this.logger.error(
        `Failed to process interview scheduled event for candidate ${event.candidateId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  @MessagePattern('offer.extended')
  async handleOfferExtended(@Payload() event: OfferExtendedEvent) {
    this.logger.debug(`Processing offer extended event for candidate ${event.candidateId}`);

    try {
      const notification = await this.notificationRepository.create({
        type: 'OFFER_EXTENDED',
        recipientId: event.candidateId,
        recipientEmail: event.candidateEmail,
        subject: `Offer Letter - ${event.position} at ${event.company}`,
        content: `Dear ${event.candidateName},\n\nWe are pleased to offer you the position of ${event.position} at ${event.company}.\n\nStart Date: ${event.offerDetails.startDate}\nAnnual Salary: ${event.offerDetails.salary}\nBenefits: ${event.offerDetails.benefits.join(', ')}\n\nPlease review the attached offer letter for complete details.\n\nBest regards,\nHR Team`,
        status: 'PENDING',
        metadata: {
          offerDetails: event.offerDetails
        }
      });

      await this.notificationRepository.save(notification);
      await this.notificationService.sendNotification(notification);

    } catch (error) {
      this.logger.error(
        `Failed to process offer extended event for candidate ${event.candidateId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
} 