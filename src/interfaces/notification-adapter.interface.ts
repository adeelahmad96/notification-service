import { Notification } from '../entities/notification.entity';

export interface NotificationAdapter {
  /**
   * Sends a notification through the specific channel implemented by this adapter.
   * @param notification The notification to send
   * @throws Error if the notification cannot be sent
   */
  send(notification: Notification): Promise<void>;
} 