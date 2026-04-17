import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  role?: 'USER' | 'ADMIN';
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

interface WorkerData {
  id?: string;
  uid?: string;
  email: string;
  role?: string;
  name?: string;
  city?: string;
  primary_zone?: string;
  persona_type?: string;
}

interface FirebaseContextType {
  user: { uid: string; email: string; role?: string } | null;
  profile: UserProfile | null;
  payouts: Payout[];
  claims: Claim[];
  systemEvents: SystemEvent[];
  loading: boolean;
  isAuthReady: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  connectPlatform: (platform: string) => Promise<void>;
  mockLogin: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const API_URL = 'http://localhost:8000/api/v1';

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  const [user, setUser] = useState<{ uid: string; email: string; role?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize from LocalStorage (Simulating onAuthStateChanged)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/workers/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then(data => {
        setupUserAndProfile(data);
      })
      .catch((e) => {
        console.error("Auth failed:", e);
        logout();
      })
      .finally(() => {
        setIsAuthReady(true);
        setLoading(false);
      });
    } else {
      setIsAuthReady(true);
      setLoading(false);
    }
  }, []);

  const setupUserAndProfile = (workerData: WorkerData) => {
    setUser({ uid: workerData.id || workerData.uid || 'mock-id', email: workerData.email || 'user@surely.ai', role: workerData.role });
    setProfile({
      uid: workerData.id || workerData.uid || 'mock-id',
      fullName: workerData.name || 'Gig Worker',
      city: workerData.city || 'Bangalore',
      zone: workerData.primary_zone || 'Central',
      workPersona: (workerData.persona_type as any) || 'FOOD',
      createdAt: new Date(),
      connectedPlatforms: [],
      role: (workerData.role as any) || 'USER',
    });
    
    const wId = workerData.id || workerData.uid || 'mock-id';

    // Fallback Mock Data for UI features backend doesn't support yet
    setPayouts([
      { id: 'p1', uid: wId, amount: 12.50, eventType: 'Extreme Rainfall', timestamp: new Date(), status: 'completed' },
      { id: 'p2', uid: wId, amount: 8.00, eventType: 'Platform Outage', timestamp: new Date(Date.now() - 86400000), status: 'completed' },
    ]);
    setClaims([
      { id: 'c1', uid: wId, amount: 12.50, status: 'approved', date: new Date(), reason: 'Rainfall Threshold' },
      { id: 'c2', uid: wId, amount: 8.00, status: 'approved', date: new Date(Date.now() - 86400000), reason: 'Platform Downtime' },
    ]);
    setSystemEvents([
      { id: 'e1', type: 'Storm', region: workerData.primary_zone || 'Bangalore', intensity: 'Heavy', timestamp: new Date(), active: true }
    ]);
  };

  const mockLogin = async (email: string) => {
    setLoading(true);
    try {
      // 1. We'll try to signup this user implicitly so demo works easily
      let response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: "password123", name: email.split('@')[0] })
      });
      
      let data = await response.json();
      
      // If email exists, fallback to login
      if (!response.ok && data.detail === "Email already registered") {
         const formData = new URLSearchParams();
         formData.append('username', email);
         formData.append('password', "password123");
         
         response = await fetch(`${API_URL}/auth/login`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
           body: formData
         });
         data = await response.json();
      }
      
      if (!response.ok) throw new Error(data.detail || "Authentication Failed");
      
      const token = data.access_token;
      localStorage.setItem('token', token);
      
      const meRes = await fetch(`${API_URL}/workers/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meData = await meRes.json();
      setupUserAndProfile(meData);
      
    } catch (e) {
      console.error(e);
      // Fallback to pure mock if backend is down
      setupUserAndProfile({ id: 'mock-123', email, role: 'USER' });
    }
    setIsAuthReady(true);
    setLoading(false);
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    setPayouts([]);
    setClaims([]);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    setProfile(prev => prev ? { ...prev, ...data } : null);
    
    // Sync to FastAPI Backend
    const token = localStorage.getItem('token');
    if (token) {
        await fetch(`${API_URL}/workers/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: data.fullName,
            city: data.city,
            primary_zone: data.zone,
            persona_type: data.workPersona
          })
        });
    }
  };

  const connectPlatform = async (platform: string) => {
    if (!profile) return;
    const currentPlatforms = profile.connectedPlatforms || [];
    if (!currentPlatforms.includes(platform)) {
      setProfile({ ...profile, connectedPlatforms: [...currentPlatforms, platform] });
      
      // Sync to backend API
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/workers/me/platforms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            platform_type: platform.toUpperCase(),
            avg_weekly_hours: 40,
            avg_weekly_earnings: 2000
          })
        });
      }
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
