import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Bell, CheckCircle, XCircle, Info, Mail, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Notifications: React.FC = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'rejection': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'new_request': return <Bell className="w-5 h-5 text-brown-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notification Center</h2>
          <p className="text-slate-500">Stay updated on your activity requests and approvals.</p>
        </div>
        <div className="flex items-center gap-2 bg-brown-50 px-4 py-2 rounded-xl border border-brown-100">
          <Mail className="w-4 h-4 text-brown-600" />
          <span className="text-xs font-bold text-brown-600 uppercase tracking-wider">Email Notifications Enabled</span>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-white/20 rounded-2xl animate-pulse"></div>)
        ) : notifications.length > 0 ? (
          <AnimatePresence>
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "p-5 rounded-2xl border transition-all flex gap-4 items-start group relative",
                  notif.read ? "glass" : "bg-brown-50/40 border-brown-100 shadow-sm"
                )}
              >
                <div className="mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className={cn("font-bold", notif.read ? "text-slate-700" : "text-slate-900")}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400">
                      {notif.createdAt ? format(notif.createdAt.toDate(), 'MMM dd, HH:mm') : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{notif.message}</p>
                </div>
                {!notif.read && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="text-[10px] font-bold text-brown-600 hover:underline"
                  >
                    MARK AS READ
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center">
            <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No notifications yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">
              We'll notify you here when there's an update on your activity requests.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
