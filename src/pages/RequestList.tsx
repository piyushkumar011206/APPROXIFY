import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Search, Filter, MoreVertical, Eye, Loader2 } from 'lucide-react';

const RequestList: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!profile) return;
      try {
        const q = query(
          collection(db, 'requests'), 
          where('studentId', '==', profile.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        setRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
          <input 
            type="text" 
            placeholder="Search requests..." 
            aria-label="Search requests"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/20 bg-white/30 backdrop-blur-sm focus:ring-2 focus:ring-brown-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            aria-label="Filter requests"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/30 backdrop-blur-sm text-slate-600 hover:bg-white/50 focus-visible:ring-2 focus-visible:ring-brown-500 outline-none transition-all"
          >
            <Filter className="w-4 h-4" aria-hidden="true" /> Filter
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl shadow-sm overflow-hidden" role="region" aria-label="Requests table">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/40 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Event Details</th>
                <th scope="col" className="px-6 py-4 font-semibold">Date</th>
                <th scope="col" className="px-6 py-4 font-semibold">Budget</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold">Workflow</th>
                <th scope="col" className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin text-brown-600" aria-hidden="true" />
                      <p className="text-sm font-medium animate-pulse">Fetching your requests...</p>
                    </div>
                  </td>
                </tr>
              ) : requests.length > 0 ? requests.map((request) => (
                <tr key={request.id} className="hover:bg-white/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{request.eventName}</p>
                    <p className="text-xs text-slate-500">{request.category}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {format(new Date(request.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    ${request.budget.toLocaleString()}
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1" aria-label={`Approval stage: ${request.status.replace('_', ' ')}`}>
                      {['faculty', 'hod'].map((role, idx) => (
                        <React.Fragment key={role}>
                          <div 
                            className={cn(
                              "w-2 h-2 rounded-full",
                              request.status === 'approved' ? "bg-emerald-500" :
                              request.status === 'rejected' ? "bg-red-500" :
                              (request.status.includes(role) ? "bg-amber-500 animate-pulse" : 
                               (idx < ['faculty', 'hod'].indexOf(request.status.split('_')[1]) ? "bg-emerald-500" : "bg-slate-200"))
                            )}
                            title={`${role.toUpperCase()} Stage`}
                          ></div>
                          {idx < 1 && <div className="w-4 h-0.5 bg-slate-100" aria-hidden="true"></div>}
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        aria-label={`View details for ${request.eventName}`}
                        className="p-2 hover:bg-brown-50 text-brown-600 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-brown-500 outline-none"
                      >
                        <Eye className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button 
                        aria-label="More actions"
                        className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-brown-500 outline-none"
                      >
                        <MoreVertical className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RequestList;
