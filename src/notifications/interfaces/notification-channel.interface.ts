export interface NotificationPayload {
  recipientEmail?: string;
  recipientId: string;
  subject: string;
  content: string;
  htmlContent?: string;
  metadata?: Record<string, any>;
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
  canHandle(channelType: string): boolean;
} 