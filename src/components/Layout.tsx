import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Trophy, 
  Bell, 
  LogOut, 
  User,
  CheckSquare,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [profile]);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['student', 'faculty', 'hod'] },
    { name: 'New Request', icon: PlusCircle, path: '/request/new', roles: ['student'] },
    { name: 'My Requests', icon: FileText, path: '/requests', roles: ['student'] },
    { name: 'Approvals', icon: CheckSquare, path: '/approvals', roles: ['faculty', 'hod'] },
    { name: 'Achievements', icon: Trophy, path: '/achievements', roles: ['student'] },
    { name: 'Portfolio', icon: User, path: '/portfolio', roles: ['student'] },
    { name: 'Profile', icon: User, path: '/profile', roles: ['student', 'faculty', 'hod'] },
  ];

  const filteredNavItems = navItems.filter(item => profile && item.roles.includes(profile.role));

  return (
    <div className="min-h-screen flex relative">
      {/* Background Overlay for better readability */}
      <div className="fixed inset-0 bg-beige/80 -z-10" />

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="shiny-brown border-r border-white/20 flex flex-col sticky top-0 h-screen z-40"
        aria-label="Main Navigation"
      >
        <div className="p-6 flex items-center justify-between">
          <Link 
            to="/" 
            className={cn("flex items-center gap-2 font-bold text-lg text-white transition-all focus-visible:ring-2 focus-visible:ring-white outline-none rounded-lg", !isSidebarOpen && "opacity-0 invisible w-0")}
            aria-label="APPROVIFY Home"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg border border-white/30 overflow-hidden shrink-0">
              <img 
                src="https://storage.googleapis.com/test-media-agent/88b85994-1772-4660-848e-28956984260a.png" 
                alt="" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="leading-tight uppercase tracking-wider">APPROVIFY</span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-white/20 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <X className="w-5 h-5 text-white/70" aria-hidden="true" /> : <Menu className="w-5 h-5 text-white/70" aria-hidden="true" />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={location.pathname === item.path ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group focus-visible:ring-2 focus-visible:ring-white outline-none",
                location.pathname === item.path 
                  ? "bg-white text-[#8B4513] shadow-lg font-bold" 
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-[#8B4513]" : "text-white/40 group-hover:text-white")} aria-hidden="true" />
              {isSidebarOpen && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-red-500 hover:text-white transition-all group focus-visible:ring-2 focus-visible:ring-white outline-none"
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 text-white/40 group-hover:text-white" aria-hidden="true" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col" id="main-content">
        <header className="h-16 shiny-brown border-b border-white/20 flex items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-lg font-bold text-white">
            {navItems.find(item => item.path === location.pathname)?.name || 'Page'}
          </h1>
          <div className="flex items-center gap-4">
            <Link 
              to="/notifications" 
              className="p-2 hover:bg-white/20 rounded-full relative transition-colors focus-visible:ring-2 focus-visible:ring-white outline-none"
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell className="w-5 h-5 text-white/70" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-[#8B4513] text-[8px] font-bold text-white flex items-center justify-center" aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link 
              to="/profile" 
              className="flex items-center gap-3 pl-4 border-l border-white/20 hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-white outline-none rounded-lg"
              aria-label="User Profile"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{profile?.displayName}</p>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{profile?.role}</p>
              </div>
              <img 
                src={profile?.profilePhoto || `https://ui-avatars.com/api/?name=${profile?.displayName}`} 
                alt="" 
                className="w-9 h-9 rounded-full border-2 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
            </Link>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Layout;
