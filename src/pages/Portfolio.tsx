import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Trophy, 
  Award, 
  Star, 
  Download, 
  Share2, 
  ExternalLink,
  MapPin,
  Calendar,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

const Portfolio: React.FC = () => {
  const { profile } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!profile) return;
      try {
        const q = query(collection(db, 'achievements'), where('studentId', '==', profile.uid));
        const querySnapshot = await getDocs(q);
        setAchievements(querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) })));
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [profile]);

  const skills = profile?.skills || ['Leadership', 'Teamwork', 'Problem Solving', 'Public Speaking'];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="h-32 bg-linear-to-r from-brown-600 to-brown-800"></div>
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12">
            <img 
              src={profile?.profilePhoto || `https://ui-avatars.com/api/?name=${profile?.displayName}&size=128`} 
              alt="Profile" 
              className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg bg-white"
            />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-slate-900">{profile?.displayName}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{profile?.department || 'Computer Science'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>APPROVIFY</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                aria-label="Export portfolio as PDF"
                className="flex items-center gap-2 bg-brown-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brown-700 transition-all shadow-lg shadow-brown-100 focus-visible:ring-2 focus-visible:ring-brown-500 outline-none"
              >
                <Download className="w-4 h-4" aria-hidden="true" /> Export PDF
              </button>
              <button 
                aria-label="Share portfolio"
                className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all focus-visible:ring-2 focus-visible:ring-brown-500 outline-none"
              >
                <Share2 className="w-5 h-5 text-slate-600" aria-hidden="true" />
              </button>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">About Me</h3>
                <p className="text-slate-600 leading-relaxed">
                  {profile?.bio || "Passionate student leader with a focus on technology and community building. Actively participating in national level competitions and workshops to enhance practical skills."}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Skills & Competencies</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span key={skill} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 space-y-4" role="region" aria-label="Verification">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Verification</h3>
              <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200" aria-label="Verification QR Code">
                <QRCodeSVG value={`https://its.edu/verify/${profile?.uid}`} size={120} />
              </div>
              <p className="text-xs text-slate-500 text-center">
                Scan to verify this student's official activity record and achievements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Timeline */}
      <div className="space-y-6" role="region" aria-label="Activity timeline">
        <h3 className="text-2xl font-bold text-slate-900">Activity Timeline</h3>
        <div className="space-y-4">
          {loading ? (
            [1, 2].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" aria-hidden="true"></div>)
          ) : achievements.length > 0 ? achievements.map((achievement, idx) => (
            <div 
              key={achievement.id} 
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex gap-6 items-start"
              role="article"
            >
              <div className="w-12 h-12 bg-brown-50 rounded-xl flex items-center justify-center shrink-0" aria-hidden="true">
                <Award className="w-6 h-6 text-brown-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{achievement.eventName || 'National Tech Fest 2024'}</h4>
                  <span className="text-sm text-slate-400">Mar 2024</span>
                </div>
                <p className="text-slate-600 text-sm mt-1">{achievement.result || 'Winner - First Place in Web Development'}</p>
                <div className="flex items-center gap-4 mt-4">
                  <button className="text-brown-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-brown-500 outline-none rounded">
                    <ExternalLink className="w-3 h-3" aria-hidden="true" /> View Certificate
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">No achievements recorded yet. Participate in events to build your portfolio!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
