import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export type NotificationType = 'approval' | 'rejection' | 'new_request' | 'system';

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  requestId?: string;
  read: boolean;
  createdAt: any;
}

export const notificationService = {
  /**
   * Create an in-app notification and trigger a simulated email
   */
  async notify(userId: string, title: string, message: string, type: NotificationType, requestId?: string) {
    try {
      // 1. Create In-App Notification in Firestore
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        message,
        type,
        requestId: requestId || null,
        read: false,
        createdAt: serverTimestamp(),
      });

      // 2. Trigger Simulated Email Notification via Backend API
      // In a real app, this would send an actual email using a service like SendGrid/Resend
      fetch('/api/notify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, message, type }),
      }).catch(err => console.error("Email simulation failed:", err));

    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }
};
