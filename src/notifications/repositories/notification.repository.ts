import { Injectable } from '@nestjs/common';
import { Repository, DataSource, Between, FindOptionsWhere } from 'typeorm';
import { Notification } from '../entities/notification.entity';

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

  async findByStatus(status: string): Promise<Notification[]> {
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

  async findByTypeAndStatus(type: string, status: string): Promise<Notification[]> {
    return this.find({
      where: { type, status },
      order: { createdAt: 'DESC' },
    });
  }

  async findFailedNotifications(maxRetries: number = 3): Promise<Notification[]> {
    return this.find({
      where: {
        status: 'FAILED',
        retryCount: Between(0, maxRetries - 1),
      },
      order: { createdAt: 'ASC' },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    error?: string,
  ): Promise<void> {
    const updateData: Partial<Notification> = {
      status,
      updatedAt: new Date(),
    };

    if (error) {
      updateData.error = error;
      updateData.retryCount = () => 'retryCount + 1';
    }

    if (status === 'SENT') {
      updateData.sentAt = new Date();
    }

    await this.update(id, updateData);
  }

  async markAsSent(id: string): Promise<void> {
    await this.update(id, {
      status: 'SENT',
      sentAt: new Date(),
      updatedAt: new Date(),
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
    }, {});
  }
} 