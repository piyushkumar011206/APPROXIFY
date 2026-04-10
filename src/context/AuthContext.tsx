import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'faculty' | 'hod';
  department?: string;
  profilePhoto?: string;
  bio?: string;
  skills?: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  completeProfile: (role: 'student' | 'faculty' | 'hod', department: string, accessCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthReady: boolean;
  needsProfile: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
          setNeedsProfile(false);
        } else {
          setNeedsProfile(true);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setNeedsProfile(false);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const completeProfile = async (role: 'student' | 'faculty' | 'hod', department: string) => {
    if (!user) throw new Error('No user authenticated');

    // Restriction: Student emails must end with @its.edu.in
    if (role === 'student' && user.email && !user.email.endsWith('@its.edu.in')) {
      throw new Error('Students must use their @its.edu.in college email address.');
    }

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role,
      department,
      profilePhoto: user.photoURL || '',
    };

    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, newProfile);
    setProfile(newProfile);
    setNeedsProfile(false);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, completeProfile, logout, isAuthReady, needsProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
