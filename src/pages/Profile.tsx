import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Briefcase, Shield, CheckCircle, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const Profile: React.FC = () => {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    role: profile?.role || 'student',
    department: profile?.department || 'Computer Science',
    bio: profile?.bio || '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      // Role change validation
      if (formData.role !== profile?.role) {
        if (formData.role === 'student' && user.email && !user.email.endsWith('@its.edu.in')) {
          throw new Error('Students must use their @its.edu.in college email address.');
        }

      }

      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "An error occurred");
      // Specific error handling for Firestore permissions
      if (error instanceof Error && error.message.includes('insufficient permissions')) {
        const errInfo = {
          error: error.message,
          operationType: 'update',
          path: `users/${user.uid}`,
          authInfo: {
            userId: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
          }
        };
        console.error('Firestore Error Details:', JSON.stringify(errInfo));
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'student', label: 'Student', icon: User },
    { id: 'faculty', label: 'Faculty', icon: Briefcase },
    { id: 'hod', label: 'HOD', icon: Shield },
  ];

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Applied Sciences',
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8 border-b border-white/10 bg-white/20">
          <h2 className="text-2xl font-bold text-slate-900">Profile Settings</h2>
          <p className="text-slate-500">Manage your account details and role within the college.</p>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          {/* Role Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Your Role</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.id as any })}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                    formData.role === role.id 
                      ? "border-brown-600 bg-white shadow-md text-brown-600" 
                      : "border-white/40 bg-white/20 text-slate-400 hover:border-white/60"
                  )}
                >
                  <role.icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Department Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/30 backdrop-blur-sm focus:ring-2 focus:ring-brown-500 outline-none transition-all"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Display Name */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/30 backdrop-blur-sm focus:ring-2 focus:ring-brown-500 outline-none transition-all"
              placeholder="Your full name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/30 backdrop-blur-sm focus:ring-2 focus:ring-brown-500 outline-none transition-all"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            {success && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-600 text-sm font-bold flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Profile updated successfully!
              </motion.p>
            )}
            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-600 text-sm font-bold"
              >
                {error}
              </motion.p>
            )}
            <div className="flex-1"></div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-brown-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brown-700 transition-all shadow-lg shadow-brown-100 disabled:opacity-50"
            >
              {loading ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
