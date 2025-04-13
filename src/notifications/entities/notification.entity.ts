import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NotificationType {
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  OFFER_EXTENDED = 'OFFER_EXTENDED',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  FAILED_PERMANENT = 'FAILED_PERMANENT',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column('uuid')
  recipientId: string;

  @Column({ nullable: true })
  recipientEmail: string;

  @Column()
  subject: string;

  @Column('text')
  content: string;

  @Column('text', { nullable: true })
  htmlContent: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column('text', { nullable: true })
  error: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;
} 