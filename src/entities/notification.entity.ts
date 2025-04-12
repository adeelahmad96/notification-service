import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recipientId: string;

  @Column()
  recipientEmail: string;

  @Column()
  subject: string;

  @Column('text')
  content: string;

  @Column('text', { nullable: true })
  htmlContent?: string;

  @Column({
    type: 'varchar',
    default: 'PENDING'
  })
  status: NotificationStatus;

  @Column('text', { nullable: true })
  error?: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 