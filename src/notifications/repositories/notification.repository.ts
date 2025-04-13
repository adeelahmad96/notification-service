import { Injectable } from '@nestjs/common';
import { Repository, DataSource, Between, FindOptionsWhere, LessThan } from 'typeorm';
import { Notification, NotificationStatus, NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository extends Repository<Notification> {
  constructor(private dataSource: DataSource) {
    super(Notification, dataSource.createEntityManager());
  }

  async findByRecipientId(recipientId: string): Promise<Notification[]> {
    return this.find({
      where: { recipientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: NotificationStatus): Promise<Notification[]> {
    return this.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Notification[]> {
    return this.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByTypeAndStatus(
    type: NotificationType,
    status: NotificationStatus
  ): Promise<Notification[]> {
    return this.find({
      where: { type, status },
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingNotifications(): Promise<Notification[]> {
    return this.findByStatus(NotificationStatus.PENDING);
  }

  async findFailedNotifications(): Promise<Notification[]> {
    return this.findByStatus(NotificationStatus.FAILED);
  }

  async findRetryableNotifications(): Promise<Notification[]> {
    return this.find({
      where: {
        status: NotificationStatus.FAILED,
        retryCount: LessThan(3),
      },
      order: { createdAt: 'ASC' },
    });
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    error?: string,
  ): Promise<void> {
    const updateData: Partial<Notification> = {
      status,
      updatedAt: new Date(),
    };

    if (error) {
      updateData.error = error;
      updateData.retryCount = await this.createQueryBuilder()
        .select('COALESCE(retry_count, 0) + 1', 'newRetryCount')
        .from(Notification, 'notification')
        .where('id = :id', { id })
        .getRawOne()
        .then(result => result.newRetryCount);
    }

    if (status === NotificationStatus.SENT) {
      updateData.sentAt = new Date();
    }

    await this.update(id, updateData);
  }

  async markAsSent(id: string): Promise<void> {
    await this.update(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    const notification = await this.findOneOrFail({ where: { id } });
    const retryCount = (notification.retryCount || 0) + 1;
    const status = retryCount >= 3 ? NotificationStatus.FAILED_PERMANENT : NotificationStatus.FAILED;

    await this.update(id, {
      status,
      error,
      retryCount,
    });
  }

  async getNotificationStats(startDate: Date, endDate: Date) {
    const stats = await this.createQueryBuilder('notification')
      .select('notification.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('notification.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('notification.status')
      .getRawMany();

    return stats.reduce((acc, curr) => {
      acc[curr.status.toLowerCase()] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>);
  }
} 