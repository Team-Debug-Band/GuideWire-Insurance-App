import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, BarChart3, BadgeCheck, ShieldCheck, CloudRain, Lock, Zap, 
  Radio, Calculator, ShieldAlert, Layers, BrainCircuit, PlayCircle, 
  XCircle, Share2, Globe, Settings, Home, History, Bell, User as UserIcon,
  ChevronRight, CheckCircle2, AlertTriangle, Info, Mail, LogIn,
  ExternalLink, Smartphone, Database, Cpu, ArrowLeft, MapPin, MessageSquare
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { Button } from './components/Button';
import { DataPulse } from './components/DataPulse';
import { cn } from './lib/utils';
import { useFirebase } from './context/FirebaseContext';
import { auth } from './firebase';
import { 
  signInWithPopup, GoogleAuthProvider, signOut, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword 
} from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';

// --- Data for Radar Chart ---
const radarData = [
  { subject: 'Reliability', A: 120, fullMark: 150 },
  { subject: 'Precision', A: 110, fullMark: 150 },
  { subject: 'Speed', A: 140, fullMark: 150 },
  { subject: 'Transparency', A: 130, fullMark: 150 },
  { subject: 'Automation', A: 150, fullMark: 150 },
];

// --- Sub-components ---

const RiskMap = ({ location, activeEvent }: { location?: { latitude: number, longitude: number }, activeEvent?: any }) => {
  // Simple SVG City Grid
  return (
    <div className="relative w-full h-full bg-[#f8f9fa] overflow-hidden">
      <svg viewBox="0 0 800 600" className="w-full h-full">
        {/* Grid Lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e9ecef" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Simplified City Blocks */}
        <g opacity="0.4">
          <rect x="100" y="100" width="120" height="80" rx="4" fill="#dee2e6" />
          <rect x="240" y="100" width="100" height="150" rx="4" fill="#dee2e6" />
          <rect x="360" y="80" width="200" height="100" rx="4" fill="#dee2e6" />
          <rect x="100" y="200" width="120" height="120" rx="4" fill="#dee2e6" />
          <rect x="240" y="280" width="150" height="80" rx="4" fill="#dee2e6" />
          <rect x="420" y="200" width="140" height="160" rx="4" fill="#dee2e6" />
          <rect x="100" y="340" width="100" height="180" rx="4" fill="#dee2e6" />
          <rect x="220" y="380" width="180" height="140" rx="4" fill="#dee2e6" />
          <rect x="420" y="380" width="140" height="140" rx="4" fill="#dee2e6" />
        </g>

        {/* Major Roads */}
        <path d="M 0 190 L 800 190" stroke="#ced4da" strokeWidth="8" fill="none" />
        <path d="M 230 0 L 230 600" stroke="#ced4da" strokeWidth="8" fill="none" />
        <path d="M 410 0 L 410 600" stroke="#ced4da" strokeWidth="8" fill="none" />
        <path d="M 0 370 L 800 370" stroke="#ced4da" strokeWidth="8" fill="none" />

        {/* Risk Zone Overlay */}
        {activeEvent && (
          <motion.circle 
            cx="400" cy="300" r="150" 
            fill="rgba(239, 68, 68, 0.1)" 
            stroke="rgba(239, 68, 68, 0.3)" 
            strokeWidth="2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ repeat: Infinity, duration: 3, repeatType: 'reverse' }}
          />
        )}

        {/* User Location Marker */}
        <motion.g 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Mocking user location near center if not provided */}
          <circle cx="380" cy="280" r="8" fill="#0d1c2e" />
          <circle cx="380" cy="280" r="16" fill="rgba(13, 28, 46, 0.2)" />
          <path d="M 380 280 L 380 260" stroke="#0d1c2e" strokeWidth="2" />
          <rect x="340" y="230" width="80" height="24" rx="12" fill="#0d1c2e" />
          <text x="380" y="246" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">YOU ARE HERE</text>
        </motion.g>
      </svg>
      
      {/* Locality Label */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-sm flex items-center gap-2">
        <MapPin className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          {location ? "Current Location Active" : "Koramangala, Bangalore"}
        </span>
      </div>
    </div>
  );
};

const StarDisplay = () => (
  <div className="w-full h-[400px] bg-surface-container-low rounded-3xl p-6 flex flex-col items-center justify-center border border-outline-variant/20 shadow-inner">
    <h3 className="font-headline font-bold text-primary mb-4 uppercase tracking-widest text-xs">Surely.AI Core Performance</h3>
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#0d1c2e', fontSize: 12, fontWeight: 700 }} />
        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
        <Radar
          name="Surely.AI"
          dataKey="A"
          stroke="#0d1c2e"
          fill="#0d1c2e"
          fillOpacity={0.15}
        />
      </RadarChart>
    </ResponsiveContainer>
    <div className="grid grid-cols-5 gap-2 mt-4 w-full">
      {radarData.map((d, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary mb-1"></div>
          <span className="text-[8px] font-bold uppercase text-outline text-center">{d.subject}</span>
        </div>
      ))}
    </div>
  </div>
);

// --- Views ---

const LandingPage = ({ onStart }: { onStart: () => void }) => {
  const [activeSection, setActiveSection] = useState<'hero' | 'how' | 'partners'>('hero');

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-surface/80 backdrop-blur-md flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50 border-b border-outline-variant/10">
        <div className="text-lg font-black text-primary tracking-tighter uppercase font-headline">
          SURELY.<span className="text-secondary">AI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 font-headline font-bold tracking-tight text-sm uppercase text-outline">
          <button 
            onClick={() => setActiveSection('hero')}
            className={cn("hover:text-primary transition-all px-4 py-2 rounded-md", activeSection === 'hero' && "text-primary bg-surface-container-high")}
          >
            Platform
          </button>
          <button 
            onClick={() => setActiveSection('how')}
            className={cn("hover:text-primary transition-all px-4 py-2 rounded-md", activeSection === 'how' && "text-primary bg-surface-container-high")}
          >
            How it works
          </button>
          <button 
            onClick={() => setActiveSection('partners')}
            className={cn("hover:text-primary transition-all px-4 py-2 rounded-md", activeSection === 'partners' && "text-primary bg-surface-container-high")}
          >
            For Partners
          </button>
        </div>
        <Button onClick={onStart} size="md">GET STARTED</Button>
      </nav>

      <AnimatePresence mode="wait">
        {activeSection === 'hero' && (
          <motion.div 
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Hero */}
            <section className="relative pt-20 pb-32 overflow-hidden px-6">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 z-10">
                  <div className="inline-flex items-center space-x-2 bg-surface-container-high px-3 py-1 rounded-full mb-6">
                    <BadgeCheck className="w-4 h-4 text-secondary" />
                    <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">Parametric Resilience v2.4</span>
                  </div>
                  <h1 className="font-headline font-extrabold text-5xl md:text-7xl text-primary leading-[1.1] tracking-tighter mb-8">
                    Income protection that <span className="italic text-secondary">triggers itself</span> when disruptions hit.
                  </h1>
                  <p className="font-body text-lg text-on-surface-variant max-w-xl mb-10 leading-relaxed">
                    Surely.AI uses zero-touch parametric triggers to instantly compensate gig workers for income lost due to weather, curfews, or platform outages. No claims. No waiting. Just data.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={onStart} size="lg" className="flex items-center gap-3">
                      <span>Enter Worker Demo</span>
                      <TrendingUp className="w-5 h-5" />
                    </Button>
                    <Button variant="secondary" size="lg" className="flex items-center gap-3">
                      <span>Enter Admin Demo</span>
                      <BarChart3 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <StarDisplay />
                </div>
              </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 bg-surface-container-low">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
                    <Zap className="w-10 h-10 text-secondary mb-6" />
                    <h3 className="font-headline font-bold text-xl text-primary mb-4">Instant Payouts</h3>
                    <p className="font-body text-on-surface-variant text-sm leading-relaxed">No paperwork. No adjusters. Funds are pushed to your account the second a trigger is met.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
                    <Globe className="w-10 h-10 text-primary mb-6" />
                    <h3 className="font-headline font-bold text-xl text-primary mb-4">Hyper-Local Data</h3>
                    <p className="font-body text-on-surface-variant text-sm leading-relaxed">We monitor your exact delivery zone to ensure protection is relevant to your specific environment.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
                    <ShieldCheck className="w-10 h-10 text-secondary mb-6" />
                    <h3 className="font-headline font-bold text-xl text-primary mb-4">Fraud Proof</h3>
                    <p className="font-body text-on-surface-variant text-sm leading-relaxed">Blockchain-verified triggers ensure that every payout is backed by objective, immutable data.</p>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {activeSection === 'how' && (
          <motion.div 
            key="how"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-24 px-6 max-w-7xl mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="font-headline font-extrabold text-4xl text-primary mb-4">The Parametric Protocol</h2>
              <p className="font-body text-on-surface-variant max-w-2xl mx-auto">How Surely.AI automates resilience for the modern gig economy.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-headline font-black shrink-0">01</div>
                  <div>
                    <h4 className="font-headline font-bold text-xl text-primary mb-2">Sensor Integration</h4>
                    <p className="font-body text-on-surface-variant text-sm leading-relaxed">We connect to global weather stations, civic APIs, and platform status nodes to build a real-time risk map.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-headline font-black shrink-0">02</div>
                  <div>
                    <h4 className="font-headline font-bold text-xl text-primary mb-2">Threshold Monitoring</h4>
                    <p className="font-body text-on-surface-variant text-sm leading-relaxed">Specific triggers (e.g., 2mm rain/hr or 40°C heat) are set based on your territory's operational limits.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-headline font-black shrink-0">03</div>
                  <div>
                    <h4 className="font-headline font-bold text-xl text-primary mb-2">Automated Verification</h4>
                    <p className="font-body text-on-surface-variant text-sm leading-relaxed">When a threshold is crossed, our AI verifies the event against multiple data sources to prevent false positives.</p>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-high rounded-[2.5rem] p-8 flex items-center justify-center">
                <div className="relative w-full aspect-square max-w-sm">
                  <div className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
                  <div className="absolute inset-8 border-4 border-dashed border-secondary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-outline-variant/10">
                      <Cpu className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'partners' && (
          <motion.div 
            key="partners"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-24 px-6 max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="font-headline font-extrabold text-4xl text-primary mb-8">Enterprise Ecosystem</h2>
                <p className="font-body text-on-surface-variant mb-10 leading-relaxed">
                  Surely.AI partners with gig platforms and financial institutions to embed resilience directly into the worker experience.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-surface-container-low p-6 rounded-2xl">
                    <Smartphone className="w-8 h-8 text-secondary mb-4" />
                    <h5 className="font-headline font-bold text-primary mb-2">SDK Integration</h5>
                    <p className="text-xs text-on-surface-variant">Embed protection into your driver app with 4 lines of code.</p>
                  </div>
                  <div className="bg-surface-container-low p-6 rounded-2xl">
                    <Database className="w-8 h-8 text-primary mb-4" />
                    <h5 className="font-headline font-bold text-primary mb-2">Real-time APIs</h5>
                    <p className="text-xs text-on-surface-variant">Access hyper-local risk data for your entire fleet.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {['Swiggy', 'Zomato', 'Uber Eats', 'DoorDash', 'Instacart'].map((p, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between group hover:border-secondary transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center font-black text-primary">{p[0]}</div>
                      <span className="font-headline font-bold text-primary">{p} Partner Network</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-outline group-hover:text-secondary transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white py-16 px-6 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-black text-primary tracking-tighter uppercase font-headline mb-6">
              SURELY.<span className="text-secondary">AI</span>
            </div>
            <p className="font-body text-on-surface-variant max-w-sm mb-8 leading-relaxed">
              Parametric income protection for the modern workforce. Licensed and regulated resilience for delivery professionals worldwide.
            </p>
            <div className="flex space-x-4">
              <a className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-primary hover:bg-primary-fixed transition-colors" href="#"><Share2 className="w-5 h-5" /></a>
              <a className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-primary hover:bg-primary-fixed transition-colors" href="#"><Globe className="w-5 h-5" /></a>
            </div>
          </div>
          <div>
            <h5 className="font-headline font-bold text-primary mb-6 uppercase tracking-widest text-xs">Resources</h5>
            <ul className="space-y-4 font-body text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Developer Portal</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Incident Reports</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-headline font-bold text-primary mb-6 uppercase tracking-widest text-xs">Company</h5>
            <ul className="space-y-4 font-body text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Careers</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-outline-variant/10 text-center text-xs font-label text-outline uppercase tracking-widest">
          © 2024 Surely.AI Technologies Inc. • Engineered with Precision
        </div>
      </footer>
    </div>
  );
};

const OnboardingHeader = ({ title, onBack, step, totalSteps }: { title: string, onBack?: () => void, step?: number, totalSteps?: number }) => (
  <header className="w-full flex flex-col gap-6 mb-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center">
          <ShieldCheck className="text-white w-5 h-5" />
        </div>
        <span className="font-headline font-extrabold tracking-tighter text-lg text-primary uppercase">Surely.<span className="text-secondary">AI</span></span>
      </div>
      {onBack && (
        <button onClick={onBack} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline hover:text-primary">
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}
    </div>
    <div className="space-y-2">
      <h1 className="font-headline font-bold text-2xl text-primary">{title}</h1>
      {step && totalSteps && (
        <div className="flex items-center gap-2">
          <div className="flex-grow h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          <span className="font-label text-[10px] font-bold tracking-widest text-outline uppercase whitespace-nowrap">Step {step}/{totalSteps}</span>
        </div>
      )}
    </div>
  </header>
);

const OnboardingLogin = ({ onBack }: { onBack: () => void }) => {
  const { mockLogin } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // For now, allow any user login via mockLogin
    try {
      mockLogin(email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center px-6 py-8 relative overflow-hidden">
      <OnboardingHeader 
        title={isRegistering ? "Create your account" : "Welcome back"} 
        onBack={onBack} 
      />

      <div className="w-full max-w-md space-y-6">
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-label text-[11px] font-bold uppercase tracking-wider text-outline ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input 
                type="email"
                required
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl pl-12 pr-4 py-4 text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-label text-[11px] font-bold uppercase tracking-wider text-outline ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
              <input 
                type="password"
                required
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl pl-12 pr-4 py-4 text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full py-5" size="lg" disabled={loading}>
            {loading ? "Processing..." : (isRegistering ? "Create Account" : "Sign In")}
          </Button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-outline font-bold tracking-widest">Or continue with</span></div>
        </div>

        <Button 
          onClick={() => mockLogin('google-user@gmail.com')} 
          className="w-full py-5 flex items-center justify-center gap-3 bg-white text-primary border border-outline-variant hover:bg-surface-container-low" 
          size="lg"
          variant="outline"
        >
          <img src="https://www.gstatic.com/firebase/builtins/external/google_logo.svg" alt="Google" className="w-5 h-5" />
          <span>Google Account</span>
        </Button>

        {error && <p className="text-error text-xs font-medium text-center">{error}</p>}

        <p className="text-center text-sm text-on-surface-variant">
          {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-secondary font-bold hover:underline">
            {isRegistering ? "Sign In" : "Register Now"}
          </button>
        </p>
      </div>
    </div>
  );
};

const OnboardingProfile = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const { profile, updateProfile } = useFirebase();
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    city: profile?.city || 'Bangalore',
    zone: profile?.zone || 'Central'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.fullName) return;
    setIsSubmitting(true);
    try {
      await updateProfile(formData);
      onNext();
    } catch (err) {
      console.error("Profile Update Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col px-6 py-8 max-w-md mx-auto w-full">
      <OnboardingHeader title="Basic Details" onBack={onBack} step={1} totalSteps={5} />

      <section className="mb-8">
        <p className="text-on-surface-variant text-sm leading-relaxed">Let's start with the basics. We need your name and primary work territory.</p>
      </section>

      <div className="space-y-6 flex-grow">
        <div className="space-y-1.5">
          <label className="font-label text-[11px] font-bold uppercase tracking-wider text-outline ml-1">Full Name</label>
          <input 
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-4 text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20" 
            placeholder="Enter your full name" 
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-label text-[11px] font-bold uppercase tracking-wider text-outline ml-1">City</label>
            <select 
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-4 text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            >
              <option>Bangalore</option>
              <option>Mumbai</option>
              <option>Delhi</option>
              <option>New York</option>
              <option>London</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="font-label text-[11px] font-bold uppercase tracking-wider text-outline ml-1">Zone</label>
            <select 
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-4 text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20"
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            >
              <option>North</option>
              <option>Central</option>
              <option>South</option>
              <option>East</option>
              <option>West</option>
            </select>
          </div>
        </div>
      </div>

      <footer className="mt-8">
        <Button onClick={handleSubmit} className="w-full py-5" size="lg" disabled={isSubmitting || !formData.fullName}>
          {isSubmitting ? "Saving..." : "Continue"} <ChevronRight className="w-5 h-5" />
        </Button>
      </footer>
    </div>
  );
};

const OnboardingPersona = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const { profile, updateProfile } = useFirebase();
  const [persona, setPersona] = useState(profile?.workPersona || 'FOOD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile({ workPersona: persona as any });
      onNext();
    } catch (err) {
      console.error("Persona Update Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col px-6 py-8 max-w-md mx-auto w-full">
      <OnboardingHeader title="Work Persona" onBack={onBack} step={2} totalSteps={5} />

      <section className="mb-8">
        <p className="text-on-surface-variant text-sm leading-relaxed">Select the category that best describes your primary delivery work.</p>
      </section>

      <div className="space-y-4 flex-grow">
        {(['FOOD', 'GROCERY', 'E-COMM'] as const).map((p) => (
          <button 
            key={p}
            onClick={() => setPersona(p)}
            className={cn(
              "flex items-center gap-6 p-6 rounded-[2rem] shadow-sm border-2 transition-all w-full text-left",
              persona === p ? "bg-primary text-white border-primary ring-4 ring-primary/10" : "bg-surface-container-lowest border-outline-variant/20 hover:border-primary-fixed-dim"
            )}
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", persona === p ? "bg-white/20" : "bg-surface-container-high")}>
              {p === 'FOOD' && <TrendingUp className="w-7 h-7" />}
              {p === 'GROCERY' && <ShieldAlert className="w-7 h-7" />}
              {p === 'E-COMM' && <Zap className="w-7 h-7" />}
            </div>
            <div>
              <h4 className="font-headline font-bold text-lg uppercase tracking-tight">{p}</h4>
              <p className={cn("text-xs", persona === p ? "text-white/70" : "text-outline")}>
                {p === 'FOOD' && "Restaurant & quick-service delivery"}
                {p === 'GROCERY' && "Supermarket & fresh produce delivery"}
                {p === 'E-COMM' && "Last-mile package & courier delivery"}
              </p>
            </div>
          </button>
        ))}
      </div>

      <footer className="mt-8">
        <Button onClick={handleSubmit} className="w-full py-5" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Continue"} <ChevronRight className="w-5 h-5" />
        </Button>
      </footer>
    </div>
  );
};

const OnboardingLocation = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const { updateProfile } = useFirebase();
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

  const handleGetLocation = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation(newLoc);
        setLocating(false);
      }, (error) => {
        console.error("Location Error:", error);
        setLocating(false);
        // Fallback or alert
      });
    } else {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (location) {
      await updateProfile({ location: { latitude: location.lat, longitude: location.lng } });
    }
    onNext();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col px-6 py-8 max-w-md mx-auto w-full">
      <OnboardingHeader title="Precise Location" onBack={onBack} step={3} totalSteps={5} />

      <section className="mb-8">
        <p className="text-on-surface-variant text-sm leading-relaxed">Surely.AI uses hyper-local sensing. Granting location access ensures your protection triggers are 100% accurate for your exact position.</p>
      </section>

      <div className="flex-grow flex flex-col items-center justify-center space-y-8">
        <div className="w-32 h-32 bg-surface-container-high rounded-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
          <MapPin className="w-12 h-12 text-primary relative z-10" />
        </div>
        
        {location ? (
          <div className="text-center space-y-2">
            <div className="flex items-center gap-2 text-secondary font-bold justify-center">
              <CheckCircle2 className="w-5 h-5" />
              <span>Location Captured</span>
            </div>
            <p className="text-xs text-outline font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
          </div>
        ) : (
          <Button onClick={handleGetLocation} variant="outline" className="gap-2" disabled={locating}>
            {locating ? "Locating..." : "Grant Access"} <Radio className="w-4 h-4" />
          </Button>
        )}
      </div>

      <footer className="mt-8">
        <Button onClick={handleSubmit} className="w-full py-5" size="lg">
          {location ? "Continue" : "Skip for now"} <ChevronRight className="w-5 h-5" />
        </Button>
      </footer>
    </div>
  );
};

const OnboardingProblems = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const { updateProfile } = useFirebase();
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const problems = [
    "Unpredictable Rain",
    "Extreme Heat Waves",
    "Platform App Outages",
    "Traffic Congestion",
    "Fuel Price Spikes",
    "Safety Concerns"
  ];

  const toggleProblem = (p: string) => {
    setSelectedProblems(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile({ problems: selectedProblems });
      onNext();
    } catch (err) {
      console.error("Problems Update Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col px-6 py-8 max-w-md mx-auto w-full">
      <OnboardingHeader title="Major Pain Points" onBack={onBack} step={4} totalSteps={5} />

      <section className="mb-8">
        <p className="text-on-surface-variant text-sm leading-relaxed">What are the biggest challenges you face while working? We'll prioritize protection for these events.</p>
      </section>

      <div className="grid grid-cols-2 gap-3 flex-grow">
        {problems.map((p) => (
          <button 
            key={p}
            onClick={() => toggleProblem(p)}
            className={cn(
              "p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-32",
              selectedProblems.includes(p) ? "bg-primary text-white border-primary" : "bg-surface-container-lowest border-outline-variant/20"
            )}
          >
            <MessageSquare className={cn("w-6 h-6", selectedProblems.includes(p) ? "text-white" : "text-outline")} />
            <span className="font-headline font-bold text-xs leading-tight">{p}</span>
          </button>
        ))}
      </div>

      <footer className="mt-8">
        <Button onClick={handleSubmit} className="w-full py-5" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Continue"} <ChevronRight className="w-5 h-5" />
        </Button>
      </footer>
    </div>
  );
};

const OnboardingConnect = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
  const { profile, connectPlatform } = useFirebase();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showSampleApp, setShowSampleApp] = useState(false);

  const platforms = [
    { id: 'swiggy', name: 'Swiggy', icon: 'S' },
    { id: 'zomato', name: 'Zomato', icon: 'Z' },
    { id: 'uber', name: 'Uber Eats', icon: 'U' },
    { id: 'blinkit', name: 'Blinkit', icon: 'B' },
  ];

  const handleConnect = async (id: string) => {
    setConnecting(id);
    setShowSampleApp(true);
    await new Promise(r => setTimeout(r, 2000)); // Simulate OAuth flow in sample app
    await connectPlatform(id);
    setConnecting(null);
    setShowSampleApp(false);
  };

  const isAnyConnected = profile?.connectedPlatforms?.length && profile.connectedPlatforms.length > 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col px-6 py-8 max-w-md mx-auto w-full relative">
      <OnboardingHeader title="Connect Platforms" onBack={onBack} step={5} totalSteps={5} />

      <section className="mb-8">
        <p className="text-on-surface-variant text-sm leading-relaxed">Connect your delivery accounts to enable automated activity verification and parametric payouts.</p>
      </section>

      <div className="space-y-4 flex-grow">
        {platforms.map((p) => {
          const isConnected = profile?.connectedPlatforms?.includes(p.id);
          return (
            <div key={p.id} className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center font-black text-primary text-xl">{p.icon}</div>
                <div>
                  <h4 className="font-headline font-bold text-primary">{p.name}</h4>
                  <p className="text-[10px] text-outline uppercase font-bold tracking-widest">{isConnected ? "Connected" : "Not Linked"}</p>
                </div>
              </div>
              <Button 
                onClick={() => handleConnect(p.id)} 
                variant={isConnected ? "ghost" : "outline"}
                size="sm"
                disabled={!!connecting || isConnected}
                className={cn(isConnected && "text-secondary")}
              >
                {connecting === p.id ? "Syncing..." : isConnected ? <CheckCircle2 className="w-5 h-5" /> : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>

      <footer className="mt-8">
        <Button onClick={onNext} className="w-full py-5" size="lg" disabled={!isAnyConnected}>
          Go to Dashboard <Zap className="w-5 h-5" />
        </Button>
      </footer>

      <AnimatePresence>
        {showSampleApp && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="bg-white w-full max-w-xs rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-black">
              <div className="bg-primary p-6 text-white text-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-headline font-bold">Partner Login</h3>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="h-10 bg-surface-container rounded-lg animate-pulse"></div>
                  <div className="h-10 bg-surface-container rounded-lg animate-pulse"></div>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-outline animate-pulse">Authorizing Surely.AI...</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App Views ---

const HomeView = () => {
  const { user, profile, payouts, systemEvents } = useFirebase();
  const totalPayouts = payouts.reduce((acc, p) => acc + p.amount, 0);
  const activeEvent = systemEvents.find(e => e.active);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-primary to-primary-container p-8 rounded-[2.5rem] shadow-lg text-white flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-on-primary-container font-label text-sm font-semibold tracking-wider uppercase">Weekly Payout Estimate</p>
              <h2 className="text-5xl font-bold mt-2 tabular-nums tracking-tight">${totalPayouts.toFixed(2)}</h2>
            </div>
            <div className="bg-secondary px-4 py-2 rounded-full flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Active Protection</span>
            </div>
          </div>
          <div className="flex gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl flex-1">
              <p className="text-white/60 text-xs font-medium">Days Covered</p>
              <p className="text-lg font-bold">06/07</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl flex-1">
              <p className="text-white/60 text-xs font-medium">Next Payout</p>
              <p className="text-lg font-bold">Oct 24</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-[2.5rem] space-y-6">
          <h3 className="text-on-surface font-bold text-lg tracking-tight">Platform Status</h3>
          <div className="space-y-4">
            {['Swiggy', 'Zomato', 'Uber Eats'].map((p, i) => {
              const isConnected = profile?.connectedPlatforms?.includes(p.toLowerCase().replace(' ', ''));
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-secondary-fixed-dim shadow-[0_0_8px_rgba(149,212,179,0.8)]" : "bg-outline/30")} />
                    <span className="font-medium text-sm">{p}</span>
                  </div>
                  <span className={cn("text-xs font-bold", isConnected ? "text-secondary" : "text-outline")}>
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="p-6 pb-2">
            <h3 className="text-on-surface font-bold text-lg">Risk Map</h3>
            <p className="text-on-surface-variant text-sm mt-1">Real-time environmental monitoring</p>
          </div>
          <div className="relative flex-grow min-h-[300px] m-4 rounded-3xl overflow-hidden border border-outline-variant/10">
            <RiskMap location={profile?.location} activeEvent={activeEvent} />
            {activeEvent && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-sm p-4 rounded-xl max-w-xs border border-white/20">
                <div className="flex items-center gap-2 text-error mb-2">
                  <CloudRain className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">High {activeEvent.type} Risk</span>
                </div>
                <p className="text-on-surface font-bold text-sm leading-tight">{activeEvent.region}</p>
                <p className="text-on-surface-variant text-[11px] mt-1 italic">{activeEvent.intensity} threshold reached.</p>
              </div>
            )}
            <div className="absolute bottom-4 right-4">
              <DataPulse active={!!activeEvent} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container-high p-8 rounded-[2.5rem]">
          <h3 className="text-on-surface font-bold text-lg mb-6 tracking-tight">Recent Protection</h3>
          <div className="space-y-6">
            {payouts.length > 0 ? (
              <ul className="space-y-4">
                {payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/20">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-secondary fill-secondary/20" />
                      <div>
                        <p className="text-sm font-bold text-primary">{p.eventType}</p>
                        <p className="text-[10px] text-outline uppercase font-bold">{new Date(p.timestamp?.toDate?.() || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="font-headline font-black text-secondary">+${p.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <ShieldCheck className="w-12 h-12 text-outline/20 mx-auto mb-4" />
                <p className="text-on-surface-variant text-sm">No recent payouts triggered.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const ClaimsView = () => {
  const { claims } = useFirebase();
  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline font-extrabold text-3xl text-primary">Claims History</h2>
        <p className="text-on-surface-variant">Track your manual and automated protection claims.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
          <h4 className="font-headline font-bold text-primary mb-4">Automated Parametric</h4>
          <p className="text-sm text-on-surface-variant mb-6">These claims are triggered automatically by Surely.AI sensors. No action required.</p>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-secondary" />
                  <div>
                    <p className="text-sm font-bold">Rainfall Threshold</p>
                    <p className="text-[10px] text-outline font-bold">OCT 12, 2024</p>
                  </div>
                </div>
                <span className="text-secondary font-black">Approved</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
          <h4 className="font-headline font-bold text-primary mb-4">Manual Appeals</h4>
          <p className="text-sm text-on-surface-variant mb-6">If you believe an event was missed, you can file a manual appeal here.</p>
          <Button variant="outline" className="w-full">File New Appeal</Button>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/10">
        <table className="w-full text-left">
          <thead className="bg-surface-container-high text-[10px] font-bold uppercase tracking-widest text-outline">
            <tr>
              <th className="px-6 py-4">Claim ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {claims.map(c => (
              <tr key={c.id} className="border-t border-outline-variant/10">
                <td className="px-6 py-4 font-mono text-xs">#{c.id.slice(0, 8)}</td>
                <td className="px-6 py-4 font-medium">{c.reason}</td>
                <td className="px-6 py-4 font-bold">${c.amount}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    c.status === 'approved' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                  )}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-outline italic">No manual claims found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExplainView = () => {
  const { payouts } = useFirebase();
  const lastPayout = payouts[0];

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <header className="text-center">
        <h2 className="font-headline font-extrabold text-4xl text-primary mb-4">How it Works</h2>
        <p className="text-on-surface-variant">Understanding the Surely.AI Parametric Protocol.</p>
      </header>
      <div className="space-y-8">
        <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center"><Radio className="w-6 h-6" /></div>
            <h3 className="font-headline font-bold text-2xl text-primary">01. Real-time Sensing</h3>
          </div>
          <p className="font-body text-on-surface-variant leading-relaxed">
            Surely.AI is connected to a global network of IoT sensors, weather satellites, and platform status nodes. We monitor your specific delivery zone (e.g., "Bangalore North") for any disruption that crosses our predefined safety and operational thresholds.
          </p>
        </div>
        <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-secondary text-white rounded-2xl flex items-center justify-center"><Calculator className="w-6 h-6" /></div>
            <h3 className="font-headline font-bold text-2xl text-primary">02. Parametric Triggers</h3>
          </div>
          <p className="font-body text-on-surface-variant leading-relaxed">
            Unlike traditional insurance, we don't wait for you to file a claim. If the rain exceeds 2.5mm/hr or a platform goes offline for more than 15 minutes, a "trigger" is activated. This trigger is objective and immutable.
          </p>
        </div>
        <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary-container text-white rounded-2xl flex items-center justify-center"><Zap className="w-6 h-6" /></div>
            <h3 className="font-headline font-bold text-2xl text-primary">03. Instant Settlement</h3>
          </div>
          <p className="font-body text-on-surface-variant leading-relaxed">
            Once a trigger is verified, our system calculates your estimated loss based on your historical earnings and persona. The funds are then pushed directly to your connected wallet or bank account within minutes.
          </p>
          {lastPayout && (
            <div className="mt-8 p-6 bg-white/50 rounded-3xl border border-primary/10">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Latest Payout Analysis</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface-variant">Reason for Payout:</span>
                <span className="text-sm font-bold text-primary">{lastPayout.eventType}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-on-surface-variant">Trigger Condition:</span>
                <span className="text-sm font-bold text-secondary">
                  {lastPayout.eventType.includes('Rain') ? "Rainfall > 2.5mm/hr" : "Platform Downtime > 15m"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AlertsView = () => {
  const { systemEvents } = useFirebase();
  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-headline font-extrabold text-3xl text-primary">Safety Alerts</h2>
        <p className="text-on-surface-variant">Real-time notifications for your active zones.</p>
      </header>
      <div className="space-y-4">
        {systemEvents.map(e => (
          <div key={e.id} className={cn(
            "p-6 rounded-3xl border flex items-start gap-6 transition-all",
            e.active ? "bg-error-container/20 border-error/20" : "bg-surface-container-low border-outline-variant/10"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              e.active ? "bg-error text-white" : "bg-outline/20 text-outline"
            )}>
              {e.type === 'Storm' ? <CloudRain className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h4 className="font-headline font-bold text-primary text-lg">{e.type} Alert: {e.region}</h4>
                <span className="text-[10px] font-bold uppercase text-outline">{new Date(e.timestamp?.toDate?.() || Date.now()).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                {e.intensity} threshold reached. Operational risk is high. Parametric protection is currently active for this zone.
              </p>
              {e.active && (
                <div className="mt-4 flex items-center gap-2 text-error font-bold text-xs uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                  Live Monitoring Active
                </div>
              )}
            </div>
          </div>
        ))}
        {systemEvents.length === 0 && (
          <div className="text-center py-20 bg-surface-container-low rounded-[2.5rem]">
            <Bell className="w-12 h-12 text-outline/20 mx-auto mb-4" />
            <p className="text-on-surface-variant">No active alerts for your current zones.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileView = () => {
  const { user, profile, updateProfile, logout } = useFirebase();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.fullName || '');

  const handleSave = async () => {
    await updateProfile({ fullName: name });
    setEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <header className="flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl mb-6 bg-surface-container-high flex items-center justify-center">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="w-16 h-16 text-outline" />
          )}
        </div>
        <h2 className="font-headline font-extrabold text-3xl text-primary">{profile?.fullName}</h2>
        <p className="text-on-surface-variant font-medium">{profile?.workPersona} Specialist • {profile?.city}</p>
      </header>

      <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-outline-variant/10 space-y-8">
        <div className="flex justify-between items-center">
          <h4 className="font-headline font-bold text-primary">Account Details</h4>
          <Button variant="ghost" size="sm" onClick={() => editing ? handleSave() : setEditing(true)}>
            {editing ? "Save Changes" : "Edit Profile"}
          </Button>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Full Name</p>
              {editing ? (
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-outline-variant/30 rounded-lg px-3 py-2 text-sm" />
              ) : (
                <p className="font-bold text-primary">{profile?.fullName}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Email</p>
              <p className="font-bold text-primary">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Territory</p>
              <p className="font-bold text-primary">{profile?.city}, {profile?.zone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1">Member Since</p>
              <p className="font-bold text-primary">{new Date(profile?.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-outline-variant/10">
        <h4 className="font-headline font-bold text-primary mb-6">Connected Platforms</h4>
        <div className="grid grid-cols-2 gap-4">
          {['swiggy', 'zomato', 'uber', 'blinkit'].map(p => {
            const isConnected = profile?.connectedPlatforms?.includes(p);
            return (
              <div key={p} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-outline-variant/10">
                <span className="font-headline font-bold text-primary capitalize">{p}</span>
                {isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                ) : (
                  <Button variant="outline" size="sm">Link</Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Button onClick={logout} variant="outline" className="w-full py-5 border-error/20 text-error hover:bg-error/5">Sign Out</Button>
    </div>
  );
};

// --- Main App Wrapper ---

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'claims' | 'explain' | 'alerts' | 'profile'>('home');
  const { user } = useFirebase();

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="bg-surface sticky top-0 z-40 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 premium-gradient rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tighter text-primary font-headline">SURELY.<span className="text-secondary">AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Monitoring</span>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-high bg-surface-container flex items-center justify-center">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-5 h-5 text-outline" />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'claims' && <ClaimsView />}
            {activeTab === 'explain' && <ExplainView />}
            {activeTab === 'alerts' && <AlertsView />}
            {activeTab === 'profile' && <ProfileView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-8 pt-2 bg-white/80 backdrop-blur-md z-50 rounded-t-[2.5rem] shadow-[0_-8px_30px_rgba(0,0,0,0.04)] border-t border-outline-variant/10">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'claims', icon: History, label: 'Claims' },
          { id: 'explain', icon: BrainCircuit, label: 'Explain' },
          { id: 'alerts', icon: Bell, label: 'Alerts' },
          { id: 'profile', icon: UserIcon, label: 'Profile' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-300",
              activeTab === tab.id ? "text-primary bg-surface-container-high scale-110" : "text-outline hover:text-primary"
            )}
          >
            <tab.icon className={cn("w-6 h-6", activeTab === tab.id && "fill-primary/10")} />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// --- Main App Entry ---

export default function App() {
  const { user, profile, loading, isAuthReady, logout } = useFirebase();
  const [showLanding, setShowLanding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<'profile' | 'persona' | 'location' | 'problems' | 'connect' | 'complete'>('profile');

  if (!isAuthReady || (user && loading)) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-headline font-bold text-primary animate-pulse tracking-widest text-xs uppercase">Initializing Surely.AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-body selection:bg-secondary-container selection:text-on-secondary-container">
      <AnimatePresence mode="wait">
        {!user ? (
          showLanding ? (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingPage onStart={() => setShowLanding(false)} />
            </motion.div>
          ) : (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OnboardingLogin onBack={() => setShowLanding(true)} />
            </motion.div>
          )
        ) : (!profile || onboardingStep !== 'complete') ? (
          <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {onboardingStep === 'profile' && (
              <OnboardingProfile onNext={() => setOnboardingStep('persona')} onBack={logout} />
            )}
            {onboardingStep === 'persona' && (
              <OnboardingPersona onNext={() => setOnboardingStep('location')} onBack={() => setOnboardingStep('profile')} />
            )}
            {onboardingStep === 'location' && (
              <OnboardingLocation onNext={() => setOnboardingStep('problems')} onBack={() => setOnboardingStep('persona')} />
            )}
            {onboardingStep === 'problems' && (
              <OnboardingProblems onNext={() => setOnboardingStep('connect')} onBack={() => setOnboardingStep('location')} />
            )}
            {onboardingStep === 'connect' && (
              <OnboardingConnect onNext={() => setOnboardingStep('complete')} onBack={() => setOnboardingStep('problems')} />
            )}
          </motion.div>
        ) : (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MainApp />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
