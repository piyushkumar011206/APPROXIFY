import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  ArrowRight,
  FileText,
  PlusCircle,
  Bell,
  Check,
  X,
  Loader2,
  Calendar,
  MapPin,
  Info,
  Plus,
  BookOpen,
  Music,
  Dumbbell,
  Users,
  ExternalLink,
  X as CloseIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { requestService } from '../services/requestService';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'Workshop',
    registrationLink: ''
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'Workshop': return BookOpen;
      case 'Competition': return Trophy;
      case 'Conference': return Users;
      case 'Cultural': return Music;
      case 'Sports': return Dumbbell;
      default: return Info;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Workshop': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Competition': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Conference': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'Cultural': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'Sports': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    // 1. Requests Listener
    let q;
    if (profile.role === 'student') {
      q = query(collection(db, 'requests'), where('studentId', '==', profile.uid), orderBy('createdAt', 'desc'));
    } else if (profile.role === 'faculty') {
      q = query(collection(db, 'requests'), where('status', '==', 'pending_faculty'), orderBy('createdAt', 'desc'));
    } else if (profile.role === 'hod') {
      q = query(collection(db, 'requests'), where('status', '==', 'pending_hod'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'requests'), where('status', '==', 'approved'), orderBy('createdAt', 'desc'));
    }

    const unsubRequests = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
      setRecentRequests(requests.slice(0, 5));
      
      const total = requests.length;
      const pending = requests.filter((r: any) => r.status.startsWith('pending')).length;
      const approved = requests.filter((r: any) => r.status === 'approved').length;
      const rejected = requests.filter((r: any) => r.status === 'rejected').length;
      setStats({ total, pending, approved, rejected });
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'requests');
    });

    // 2. Notifications Listener
    const notifQ = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubNotifs = onSnapshot(notifQ, (snapshot) => {
      setRecentNotifications(snapshot.docs.slice(0, 3).map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    // 3. Leaderboard Listener
    const leaderboardQ = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      orderBy('points', 'desc'),
      limit(10)
    );
    const unsubLeaderboard = onSnapshot(leaderboardQ, (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    // 4. Events Listener
    const eventsQ = query(
      collection(db, 'events'),
      orderBy('date', 'asc')
    );
    const unsubEvents = onSnapshot(eventsQ, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
    });

    return () => {
      unsubRequests();
      unsubNotifs();
      unsubLeaderboard();
      unsubEvents();
    };
  }, [profile]);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await requestService.handleAction(requestId, action, profile);
      // No need to refresh manually, onSnapshot handles it
    } catch (error) {
      console.error("Error updating request:", error);
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || (profile.role !== 'faculty' && profile.role !== 'hod')) return;
    
    setEventSubmitting(true);
    try {
      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        createdAt: serverTimestamp(),
        createdBy: profile.uid
      });
      setShowAddEventModal(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        location: '',
        type: 'Workshop',
        registrationLink: ''
      });
    } catch (error) {
      console.error("Error adding event:", error);
      alert("Failed to add event. Please check your permissions.");
    } finally {
      setEventSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-brown-600" aria-hidden="true" />
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Preparing your dashboard</h3>
        <p className="text-slate-500 animate-pulse">Fetching latest requests and statistics...</p>
      </div>
    </div>
  );

  const statCards = [
    { name: 'Total Requests', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.displayName}!</h2>
          <p className="text-slate-500">Here's what's happening with your activities today.</p>
        </div>
        {profile?.role === 'student' ? (
          <Link 
            to="/request/new" 
            className="inline-flex items-center gap-2 bg-brown-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brown-700 transition-all shadow-lg shadow-brown-200"
          >
            <PlusCircle className="w-5 h-5" />
            New Request
          </Link>
        ) : (
          <button 
            onClick={() => setShowAddEventModal(true)}
            className="inline-flex items-center gap-2 bg-brown-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brown-700 transition-all shadow-lg shadow-brown-200"
          >
            <Plus className="w-5 h-5" />
            Post New Event
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="Statistics overview">
        {statCards.map((stat) => (
          <div key={stat.name} className="glass p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", stat.bg)} aria-hidden="true">
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-300" aria-hidden="true" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.name}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Events Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" role="region" aria-label="Events Hub">
        {/* Upcoming Events */}
        <div className="glass rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 bg-brown-600 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5" />
              <h3 className="font-bold">Upcoming Events</h3>
            </div>
            <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">New Announcements</span>
          </div>
          <div className="p-4 space-y-4 flex-1">
            {events.filter(e => new Date(e.date) >= new Date()).length > 0 ? (
              events.filter(e => new Date(e.date) >= new Date()).map(event => {
                const Icon = getEventTypeIcon(event.type);
                const colorClasses = getEventTypeColor(event.type);
                return (
                  <div key={event.id} className="p-5 rounded-2xl bg-white/40 border border-white/20 hover:bg-white/60 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brown-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className={cn("flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider", colorClasses)}>
                        <Icon className="w-3 h-3" />
                        {event.type}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium bg-white/50 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3" />
                        {format(new Date(event.date), 'MMM dd, yyyy')}
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-900 text-lg group-hover:text-brown-600 transition-colors leading-tight">{event.title}</h4>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{event.description}</p>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100/50">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-brown-500" />
                        {event.location}
                      </div>
                      
                      {event.registrationLink && (
                        <a 
                          href={event.registrationLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brown-600 hover:text-brown-700 transition-colors group/link"
                        >
                          Register Now
                          <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-sm text-slate-500">No upcoming events at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Past Events */}
        <div className="glass rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 bg-brown-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5" />
              <h3 className="font-bold">Past Events</h3>
            </div>
            <span className="bg-white/10 text-brown-100 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">History</span>
          </div>
          <div className="p-4 space-y-4 flex-1">
            {events.filter(e => new Date(e.date) < new Date()).length > 0 ? (
              events.filter(e => new Date(e.date) < new Date()).reverse().slice(0, 3).map(event => {
                const Icon = getEventTypeIcon(event.type);
                return (
                  <div key={event.id} className="p-4 rounded-xl bg-white/30 border border-white/10 opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <Icon className="w-3 h-3" />
                        {event.type}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{format(new Date(event.date), 'MMM dd, yyyy')}</span>
                    </div>
                    <h4 className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{event.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{event.description}</p>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-sm text-slate-500">No past events recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-2xl shadow-sm overflow-hidden" role="region" aria-label="Recent requests">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Requests</h3>
            <Link 
              to={profile?.role === 'student' ? "/requests" : "/approvals"} 
              className="text-brown-600 text-sm font-medium hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-brown-500 outline-none rounded"
            >
              View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/40 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Event Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  {profile?.role !== 'student' && <th scope="col" className="px-6 py-4 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentRequests.length > 0 ? recentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-white/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{request.eventName}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{request.description}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(request.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium",
                          request.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                          request.status === 'rejected' ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}
                        role="status"
                      >
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    {profile?.role !== 'student' && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAction(request.id, 'approve')}
                            className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                            aria-label={`Approve ${request.eventName}`}
                          >
                            <Check className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button 
                            onClick={() => handleAction(request.id, 'reject')}
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 outline-none"
                            aria-label={`Reject ${request.eventName}`}
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={profile?.role !== 'student' ? 4 : 3} className="px-6 py-12 text-center text-slate-500">
                      No recent requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="glass rounded-2xl shadow-sm flex flex-col" role="region" aria-label="Notifications">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Notifications</h3>
            <Link to="/notifications" className="text-brown-600 text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-brown-500 outline-none rounded">
              View all
            </Link>
          </div>
          <div className="p-4 flex-1 space-y-4">
            {recentNotifications.length > 0 ? recentNotifications.map((notif) => (
              <div key={notif.id} className={cn(
                "p-4 rounded-xl border transition-all",
                notif.read ? "bg-white/40 border-white/10" : "bg-brown-50/50 border-brown-100"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-1 w-2 h-2 rounded-full shrink-0",
                    notif.read ? "bg-slate-300" : "bg-brown-600"
                  )} aria-hidden="true" />
                  <div className="space-y-1">
                    <p className={cn("text-xs font-bold", notif.read ? "text-slate-600" : "text-slate-900")}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium">
                      {notif.createdAt ? format(notif.createdAt.toDate(), 'MMM dd, HH:mm') : 'Just now'}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Bell className="w-10 h-10 text-slate-200 mb-3" aria-hidden="true" />
                <p className="text-sm text-slate-500 font-medium">No new notifications</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="glass rounded-2xl shadow-sm overflow-hidden" role="region" aria-label="Student leaderboard">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-brown-600">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-300" aria-hidden="true" />
            <h3 className="font-bold text-white">Student Leaderboard (Top 10)</h3>
          </div>
          <span className="text-brown-100 text-xs font-medium uppercase tracking-wider">Top Performers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold w-16">Rank</th>
                <th scope="col" className="px-6 py-4 font-semibold">Student Name</th>
                <th scope="col" className="px-6 py-4 font-semibold">Department</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.length > 0 ? leaderboard.map((student, index) => (
                <tr key={student.id} className={cn(
                  "hover:bg-slate-50 transition-colors",
                  index === 0 && "bg-amber-50/30",
                  index === 1 && "bg-slate-50/30",
                  index === 2 && "bg-orange-50/30"
                )}>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      index === 0 ? "bg-amber-400 text-white" :
                      index === 1 ? "bg-slate-300 text-white" :
                      index === 2 ? "bg-orange-400 text-white" :
                      "text-slate-400"
                    )} aria-label={`Rank ${index + 1}`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {student.profilePhoto ? (
                        <img src={student.profilePhoto} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brown-100 flex items-center justify-center text-brown-600 font-bold text-xs" aria-hidden="true">
                          {student.displayName?.charAt(0)}
                        </div>
                      )}
                      <p className="font-medium text-slate-900">{student.displayName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {student.department}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-brown-600" aria-label={`${student.points || 0} points`}>{student.points || 0}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="presentation">
          <div 
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-event-title"
          >
            <div className="flex items-center justify-between">
              <h3 id="add-event-title" className="text-xl font-bold text-slate-900">Post New Event</h3>
              <button 
                onClick={() => setShowAddEventModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-all"
                aria-label="Close modal"
              >
                <CloseIcon className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                <input 
                  required
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                  placeholder="e.g. Annual Hackathon 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                <select 
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Competition">Competition</option>
                  <option value="Conference">Conference</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input 
                    required
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input 
                    required
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                    placeholder="Auditorium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                  placeholder="Briefly describe the event..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Registration Link (Optional)</label>
                <input 
                  type="url"
                  value={newEvent.registrationLink}
                  onChange={(e) => setNewEvent({...newEvent, registrationLink: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brown-500 outline-none transition-all"
                  placeholder="https://..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={eventSubmitting}
                  className="flex-1 px-6 py-3 bg-brown-600 text-white rounded-xl font-medium hover:bg-brown-700 transition-all shadow-lg shadow-brown-100 disabled:opacity-50"
                >
                  {eventSubmitting ? 'Posting...' : 'Post Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
