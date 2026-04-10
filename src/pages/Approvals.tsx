import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Check, X, MessageSquare, User, Loader2 } from 'lucide-react';
import { requestService } from '../services/requestService';

const Approvals: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let statusToFetch = '';
      if (profile.role === 'faculty') statusToFetch = 'pending_faculty';
      else if (profile.role === 'hod') statusToFetch = 'pending_hod';

      if (!statusToFetch) {
        setRequests([]);
        setLoading(false);
        return;
      }

      let q;
      // HODs and Faculty should typically only see requests from their department
      if ((profile.role === 'hod' || profile.role === 'faculty') && profile.department) {
        q = query(
          collection(db, 'requests'), 
          where('status', '==', statusToFetch),
          where('department', '==', profile.department)
        );
      } else {
        q = query(collection(db, 'requests'), where('status', '==', statusToFetch));
      }
      
      const querySnapshot = await getDocs(q);
      setRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
    } catch (error) {
      console.error("Error fetching approvals:", error);
      if (error instanceof Error && error.message.includes('insufficient permissions')) {
        console.error('Firestore Permission Error: Check if you have the correct role and department assigned in your profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [profile]);

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await requestService.handleAction(requestId, action, profile);
      fetchApprovals(); // Refresh list
    } catch (error) {
      console.error("Error updating request:", error);
      if (error instanceof Error && error.message.includes('insufficient permissions')) {
        alert("Permission denied. You may not have authority to approve this request.");
      } else {
        alert(error instanceof Error ? error.message : "An error occurred");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-brown-600 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-bold text-slate-900">Loading Approvals</h3>
            <p className="text-slate-500 animate-pulse">Please wait while we fetch pending requests...</p>
          </div>
        ) : requests.length > 0 ? requests.map((request) => (
          <article 
            key={request.id} 
            className="glass rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-6"
            aria-labelledby={`request-title-${request.id}`}
          >
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-brown-50 text-brown-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  {request.category}
                </span>
                <span className="text-xs text-slate-400">
                  Submitted {format(request.createdAt.toDate(), 'MMM dd, yyyy')}
                </span>
              </div>
              
              <div>
                <h3 id={`request-title-${request.id}`} className="text-xl font-bold text-slate-900">{request.eventName}</h3>
                <p className="text-slate-600 mt-1">{request.description}</p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User className="w-4 h-4" aria-hidden="true" />
                  <span>Student: <span className="font-medium text-slate-900">{request.studentName}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-bold text-slate-900">${request.budget.toLocaleString()}</span>
                  <span>Budget Requested</span>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-6 min-w-[160px]">
              <button 
                onClick={() => handleAction(request.id, 'approve')}
                aria-label={`Approve request for ${request.eventName}`}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all shadow-lg shadow-emerald-100"
              >
                <Check className="w-5 h-5" aria-hidden="true" /> Approve
              </button>
              <button 
                onClick={() => handleAction(request.id, 'reject')}
                aria-label={`Reject request for ${request.eventName}`}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl font-medium hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 outline-none transition-all"
              >
                <X className="w-5 h-5" aria-hidden="true" /> Reject
              </button>
              <button 
                aria-label={`Add comment to ${request.eventName}`}
                className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-brown-500 outline-none transition-all text-sm"
              >
                <MessageSquare className="w-4 h-4" aria-hidden="true" /> Add Comment
              </button>
            </div>
          </article>
        )) : (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
            <p className="text-slate-500">No pending requests for your approval at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
