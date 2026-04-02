import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
  uid: string;
  fullName: string;
  city: string;
  zone: string;
  workPersona: 'FOOD' | 'GROCERY' | 'E-COMM';
  phoneNumber?: string;
  createdAt: any;
  connectedPlatforms: string[];
  location?: { latitude: number; longitude: number };
  problems?: string[];
}

interface Claim {
  id: string;
  uid: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  date: any;
  reason: string;
}

interface Payout {
  id: string;
  uid: string;
  amount: number;
  eventType: string;
  timestamp: any;
  status: 'pending' | 'completed';
}

interface SystemEvent {
  id: string;
  type: string;
  region: string;
  intensity: string;
  timestamp: any;
  active: boolean;
}

interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  payouts: Payout[];
  claims: Claim[];
  systemEvents: SystemEvent[];
  loading: boolean;
  isAuthReady: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  connectPlatform: (platform: string) => Promise<void>;
  mockLogin: (email: string) => void;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const mockLogin = (email: string) => {
    const mockUser = {
      uid: 'mock-user-123',
      email: email,
      displayName: email.split('@')[0],
      photoURL: null, // Use UI default silhouette
    } as User;
    setUser(mockUser);
    setIsAuthReady(true);
    setProfile({
      uid: 'mock-user-123',
      fullName: email.split('@')[0],
      city: 'Bangalore',
      zone: 'Central',
      workPersona: 'FOOD',
      createdAt: new Date(),
      connectedPlatforms: [],
    });
    setPayouts([
      { id: 'p1', uid: 'mock-user-123', amount: 12.50, eventType: 'Extreme Rainfall', timestamp: new Date(), status: 'completed' },
      { id: 'p2', uid: 'mock-user-123', amount: 8.00, eventType: 'Platform Outage', timestamp: new Date(Date.now() - 86400000), status: 'completed' },
    ]);
    setClaims([
      { id: 'c1', uid: 'mock-user-123', amount: 12.50, status: 'approved', date: new Date(), reason: 'Rainfall Threshold' },
      { id: 'c2', uid: 'mock-user-123', amount: 8.00, status: 'approved', date: new Date(Date.now() - 86400000), reason: 'Platform Downtime' },
      { id: 'c3', uid: 'mock-user-123', amount: 15.00, status: 'pending', date: new Date(Date.now() - 172800000), reason: 'Heat Wave Alert' },
    ]);
    setSystemEvents([
      { id: 'e1', type: 'Storm', region: 'Bangalore Central', intensity: 'Heavy', timestamp: new Date(), active: true }
    ]);
    setLoading(false);
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
    setPayouts([]);
    setClaims([]);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (!user) {
        setProfile(null);
        setPayouts([]);
        setClaims([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user.uid === 'mock-user-123') return;

    // Listen to user profile
    const profileRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching profile:", error);
      setLoading(false);
    });

    // Listen to payouts
    const payoutsQuery = query(
      collection(db, 'payouts'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubscribePayouts = onSnapshot(payoutsQuery, (snapshot) => {
      const payoutsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payout[];
      setPayouts(payoutsData);
    }, (error) => {
      console.error("Error fetching payouts:", error);
    });

    // Listen to claims
    const claimsQuery = query(
      collection(db, 'claims'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc'),
      limit(10)
    );
    const unsubscribeClaims = onSnapshot(claimsQuery, (snapshot) => {
      const claimsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Claim[];
      setClaims(claimsData);
    }, (error) => {
      console.error("Error fetching claims:", error);
    });

    // Listen to system events
    const eventsQuery = query(
      collection(db, 'system_events'),
      where('active', '==', true),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemEvent[];
      setSystemEvents(eventsData);
    }, (error) => {
      console.error("Error fetching system events:", error);
    });

    return () => {
      unsubscribeProfile();
      unsubscribePayouts();
      unsubscribeClaims();
      unsubscribeEvents();
    };
  }, [user]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    if (user.uid === 'mock-user-123') {
      setProfile(prev => prev ? { ...prev, ...data } : null);
      return;
    }
    const profileRef = doc(db, 'users', user.uid);
    await setDoc(profileRef, {
      ...data,
      uid: user.uid,
      createdAt: profile?.createdAt || serverTimestamp(),
      connectedPlatforms: profile?.connectedPlatforms || [],
    }, { merge: true });
  };

  const connectPlatform = async (platform: string) => {
    if (!user || !profile) return;
    if (user.uid === 'mock-user-123') {
      const currentPlatforms = profile.connectedPlatforms || [];
      if (!currentPlatforms.includes(platform)) {
        setProfile({ ...profile, connectedPlatforms: [...currentPlatforms, platform] });
      }
      return;
    }
    const profileRef = doc(db, 'users', user.uid);
    const currentPlatforms = profile.connectedPlatforms || [];
    if (!currentPlatforms.includes(platform)) {
      await setDoc(profileRef, {
        connectedPlatforms: [...currentPlatforms, platform]
      }, { merge: true });
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, profile, payouts, claims, systemEvents, loading, isAuthReady, updateProfile, connectPlatform, mockLogin, logout 
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
