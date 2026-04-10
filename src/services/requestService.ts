import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { notificationService } from './notificationService';

export const requestService = {
  async handleAction(requestId: string, action: 'approve' | 'reject', profile: any) {
    if (!profile) throw new Error('User profile is required');
    
    const docRef = doc(db, 'requests', requestId);
    const requestSnap = await getDoc(docRef);
    if (!requestSnap.exists()) throw new Error('Request not found');
    
    const requestData = requestSnap.data();
    let nextStatus = '';
    
    if (action === 'reject') {
      nextStatus = 'rejected';
    } else {
      if (profile.role === 'faculty') nextStatus = 'pending_hod';
      else if (profile.role === 'hod') nextStatus = 'approved';
    }

    const updateData: any = {
      status: nextStatus,
      [`${profile.role}Id`]: profile.uid,
      [`${profile.role}Name`]: profile.displayName,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);

    const studentId = requestData.studentId;

    // If approved, increment student points
    if (nextStatus === 'approved') {
      const studentDocRef = doc(db, 'users', studentId);
      const studentSnap = await getDoc(studentDocRef);
      if (studentSnap.exists()) {
        const currentPoints = studentSnap.data().points || 0;
        await updateDoc(studentDocRef, {
          points: currentPoints + 10
        });
      }
    }

    // Trigger Notifications
    const statusLabel = nextStatus === 'approved' ? 'Approved' : nextStatus === 'rejected' ? 'Rejected' : 'Moving to Next Stage';
    
    await notificationService.notify(
      studentId,
      `Request ${statusLabel}`,
      `Your request for "${requestData.eventName}" has been ${statusLabel.toLowerCase()} by ${profile.displayName} (${profile.role}).`,
      action === 'approve' ? 'approval' : 'rejection',
      requestId
    );

    return nextStatus;
  }
};
