import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Trophy, User, Briefcase, Shield, CheckCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Login: React.FC = () => {
  const { signInWithGoogle, completeProfile, user, profile, loading, needsProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty' | 'hod'>('student');
  const [selectedDept, setSelectedDept] = useState('Computer Science');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user && profile) return <Navigate to="/" />;

  const roles = [
    { id: 'student', label: 'Student', icon: User, desc: 'Submit and track your activity requests' },
    { id: 'faculty', label: 'Faculty', icon: Briefcase, desc: 'Review student activity proposals' },
    { id: 'hod', label: 'HOD', icon: Shield, desc: 'Department-level approval authority' },
  ];

  const departments = [
    'Computer Science',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Applied Sciences',
  ];

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during sign in.");
    }
  };

  const handleCompleteProfile = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await completeProfile(selectedRole, selectedDept);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 z-0 opacity-40 blur-sm"
        style={{
          backgroundImage: "url('https://its.edu.in/images/its-engg-college.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      <div className="absolute inset-0 bg-beige/60 z-0" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="shiny-brown w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30 overflow-hidden">
            <img 
              src="https://storage.googleapis.com/test-media-agent/88b85994-1772-4660-848e-28956984260a.png" 
              alt="APPROVIFY Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase tracking-[0.2em]">APPROVIFY</h1>
          <p className="text-white/80 mt-2 font-bold uppercase tracking-widest text-xs">Activity Approval & Recognition Hub</p>
        </div>

        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="signin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-white">Welcome</h2>
              </div>

              <div className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-bold text-center"
                  >
                    {error}
                  </motion.div>
                )}
                <button
                  onClick={handleSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white text-[#8B4513] py-4 px-6 rounded-2xl font-bold hover:bg-white/90 transition-all shadow-xl"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  Sign in with Google
                </button>
              </div>
            </motion.div>
          ) : needsProfile ? (
            <motion.div 
              key="complete-profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-10"
            >
              <div className="space-y-6">
                <h2 className="text-sm font-black text-white uppercase tracking-widest">1. Select Your Role</h2>
                <div className="grid grid-cols-1 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id as any)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                        selectedRole === role.id 
                          ? "border-white bg-white/20 shadow-md" 
                          : "border-white/10 bg-black/10 hover:bg-black/20"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                        selectedRole === role.id ? "bg-white text-[#8B4513]" : "bg-white/10 text-white/60 group-hover:bg-white/20"
                      )}>
                        <role.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className={cn("font-bold", selectedRole === role.id ? "text-white" : "text-white/70")}>{role.label}</p>
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">{role.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <h2 className="text-sm font-black text-white uppercase tracking-widest">2. Details</h2>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-white/20 hover:border-white/40 transition-all text-left bg-white/10 backdrop-blur-sm shadow-sm"
                      >
                        <span className="font-bold text-white">{selectedDept}</span>
                        <ChevronDown className={cn("w-5 h-5 text-white/40 transition-transform", showDeptDropdown && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {showDeptDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-[#8B4513]/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-20 overflow-hidden"
                          >
                            {departments.map((dept) => (
                              <button
                                key={dept}
                                onClick={() => {
                                  setSelectedDept(dept);
                                  setShowDeptDropdown(false);
                                }}
                                className={cn(
                                  "w-full px-6 py-3 text-left text-sm font-bold transition-colors hover:bg-white/10",
                                  selectedDept === dept ? "text-white bg-white/20" : "text-white/70"
                                )}
                              >
                                {dept}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                </div>

                <div className="space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-bold text-center"
                    >
                      {error}
                    </motion.div>
                  )}
                  <button
                    onClick={handleCompleteProfile}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-3 bg-white text-[#8B4513] py-4 px-6 rounded-2xl font-bold hover:bg-white/90 transition-all shadow-xl disabled:opacity-50"
                  >
                    {submitting ? 'Completing Profile...' : 'Complete Profile'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
