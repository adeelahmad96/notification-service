import { Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

interface HiringEvent {
  type: string;
  candidateId: string;
  candidateEmail: string;
  data: Record<string, any>;
}

@Injectable()
export class HiringPipelineConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  @RabbitSubscribe({
    exchange: 'hiring',
    routingKey: 'events.*',
    queue: 'notifications',
  })
  async handleHiringEvent(event: HiringEvent) {
    switch (event.type) {
      case 'application.received':
        await this.handleApplicationReceived(event);
        break;
      case 'interview.scheduled':
        await this.handleInterviewScheduled(event);
        break;
      case 'offer.extended':
        await this.handleOfferExtended(event);
        break;
    }
  }

  private async handleApplicationReceived(event: HiringEvent) {
    await this.notificationService.create({
      type: NotificationType.APPLICATION_RECEIVED,
      recipientId: event.candidateId,
      recipientEmail: event.candidateEmail,
      subject: 'Application Received',
      content: `Dear candidate,\n\nWe have received your application. Our team will review it shortly.\n\nBest regards,\nHR Team`,
      metadata: event.data,
    });
  }

  private async handleInterviewScheduled(event: HiringEvent) {
    const { interviewDate, interviewType } = event.data;
    await this.notificationService.create({
      type: NotificationType.INTERVIEW_SCHEDULED,
      recipientId: event.candidateId,
      recipientEmail: event.candidateEmail,
      subject: 'Interview Scheduled',
      content: `Dear candidate,\n\nYour ${interviewType} interview has been scheduled for ${interviewDate}.\n\nBest regards,\nHR Team`,
      metadata: event.data,
    });
  }

  private async handleOfferExtended(event: HiringEvent) {
    await this.notificationService.create({
      type: NotificationType.OFFER_EXTENDED,
      recipientId: event.candidateId,
      recipientEmail: event.candidateEmail,
      subject: 'Offer Extended',
      content: `Dear candidate,\n\nWe are pleased to extend you an offer. Please review the attached documents.\n\nBest regards,\nHR Team`,
      metadata: event.data,
    });
  }
} 