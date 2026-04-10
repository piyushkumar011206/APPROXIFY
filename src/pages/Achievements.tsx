import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Award, CheckCircle, Plus, Image as ImageIcon, FileText } from 'lucide-react';
import { motion } from 'motion/react';

const Achievements: React.FC = () => {
  const { profile } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      try {
        // Fetch achievements
        const achQuery = query(collection(db, 'achievements'), where('studentId', '==', profile.uid));
        const achSnap = await getDocs(achQuery);
        setAchievements(achSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));

        // Fetch approved requests that don't have achievements yet
        const reqQuery = query(
          collection(db, 'requests'), 
          where('studentId', '==', profile.uid),
          where('status', '==', 'approved')
        );
        const reqSnap = await getDocs(reqQuery);
        setApprovedRequests(reqSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
      } catch (error) {
        console.error("Error fetching achievements:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Achievements & Recognition</h2>
          <p className="text-slate-500">Showcase your success and get verified certificates.</p>
        </div>
        {profile?.role === 'student' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus className="w-5 h-5" /> Add Proof
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="region" aria-label="Your achievements">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" aria-hidden="true"></div>)
        ) : achievements.length > 0 ? achievements.map((achievement) => (
          <motion.div 
            whileHover={{ y: -5 }}
            key={achievement.id} 
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group"
            role="article"
            aria-labelledby={`ach-title-${achievement.id}`}
          >
            <div className="h-40 bg-slate-100 relative overflow-hidden">
              <img 
                src={achievement.photos?.[0] || "https://picsum.photos/seed/achievement/400/300"} 
                alt="" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute top-3 right-3">
                <div className="bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm" aria-hidden="true">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <h4 id={`ach-title-${achievement.id}`} className="font-bold text-slate-900 line-clamp-1">{achievement.eventName || 'Event Name'}</h4>
              <p className="text-sm text-slate-600 line-clamp-2">{achievement.result}</p>
              <div className="pt-3 flex items-center justify-between border-t border-slate-50">
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1" role="status">
                  <CheckCircle className="w-3 h-3" aria-hidden="true" /> VERIFIED
                </span>
                <button className="text-indigo-600 text-xs font-bold hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded">VIEW CERTIFICATE</button>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Award className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No achievements yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">
              Once your activity requests are approved and you participate, upload your certificates here.
            </p>
          </div>
        )}
      </div>

      {/* Simple Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="presentation">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center justify-between">
              <h3 id="modal-title" className="text-xl font-bold text-slate-900">Upload Participation Proof</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 hover:bg-slate-100 rounded-full focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                aria-label="Close modal"
              >
                <Plus className="w-6 h-6 rotate-45 text-slate-400" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="event-select" className="block text-sm font-medium text-slate-700 mb-1">Select Approved Event</label>
                <select 
                  id="event-select"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {approvedRequests.map(req => (
                    <option key={req.id} value={req.id}>{req.eventName}</option>
                  ))}
                  {approvedRequests.length === 0 && <option disabled>No approved events found</option>}
                </select>
              </div>

              <div>
                <label htmlFor="achievement-desc" className="block text-sm font-medium text-slate-700 mb-1">Result / Achievement</label>
                <textarea 
                  id="achievement-desc"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Won 1st Prize, Participated as Speaker..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-indigo-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload certificate"
                >
                  <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-xs font-medium text-slate-600">Certificate</p>
                </div>
                <div 
                  className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-indigo-400 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload photos"
                >
                  <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-xs font-medium text-slate-600">Photos</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Submit for Verification
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Achievements;
