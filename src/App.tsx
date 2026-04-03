import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, BarChart3, BadgeCheck, ShieldCheck, CloudRain, Lock, Zap,
  Radio, Calculator, ShieldAlert, Layers, BrainCircuit, PlayCircle,
  XCircle, Share2, Globe, Settings, Home, History, Bell, User as UserIcon,
  ChevronRight, CheckCircle2, AlertTriangle, Info, Mail, LogIn,
  ExternalLink, Smartphone, Database, Cpu, ArrowLeft, MapPin, MessageSquare, Search
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from './components/Button';
import { getClaims, getPayouts, simulateEvent, getFraudAlerts } from './api/claims';
import { getClaims as getWorkerClaims } from './api/worker';
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
  const center: [number, number] = location ? [location.latitude, location.longitude] : [12.9716, 77.5946];

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {location && (
          <Marker position={[location.latitude, location.longitude]} icon={L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:#002542;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })}>
            <Popup>
              <div className="p-1 text-[10px] font-bold text-primary">YOU ARE HERE</div>
            </Popup>
          </Marker>
        )}
        {activeEvent && (
          <Circle
            center={[center[0] + 0.005, center[1] + 0.005]}
            radius={1500}
            pathOptions={{ fillColor: '#ba1a1a', color: '#ba1a1a', weight: 1, fillOpacity: 0.2 }}
          />
        )}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-outline-variant/20 shadow-sm flex items-center gap-2">
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
          fillOpacity={0.35}
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

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={cn(
        "fixed bottom-8 right-8 z-[10000] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
        type === 'success'
          ? "bg-white border-secondary/20 text-secondary"
          : "bg-white border-error/20 text-error"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        type === 'success' ? "bg-secondary/10" : "bg-error/10"
      )}>
        {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
      </div>
      <span className="text-sm font-black uppercase tracking-widest">{message}</span>
    </motion.div>
  );
};

// --- Views ---

const PayoutVelocityChart = ({ data }: { data: any[] }) => {
  // Map data to a trend format
  const chartData = data.slice(-10).map((p, i) => ({
    name: `P-${i + 1}`,
    amount: p.amount,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/30">
        <p className="text-[10px] font-black text-outline uppercase tracking-widest italic">Insufficient data for trend analysis</p>
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#0F172A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 8, fontWeight: 900, fill: '#64748B' }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 8, fontWeight: 900, fill: '#64748B' }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              fontSize: '10px',
              fontWeight: 900,
              textTransform: 'uppercase'
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#0F172A"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorAmount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};


const ClaimDetailsModal = ({ isOpen, onClose, claim }: { isOpen: boolean, onClose: () => void, claim: any }) => {
  if (!isOpen || !claim) return null;

  const { explanation } = claim;
  if (!explanation) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-outline-variant/20"
      >
        <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline font-black text-2xl text-primary uppercase tracking-tighter">Claim Intelligence</h3>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest">ID #{claim.id} • Automated Decision Audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-outline" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Income & Loss Analysis */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Loss Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5">
                <p className="text-[8px] font-bold text-outline uppercase mb-1">Expected Daily</p>
                <p className="text-xl font-headline font-black text-primary">₹{explanation.risk_breakdown.expected_daily_income.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/5">
                <p className="text-[8px] font-bold text-outline uppercase mb-1">Actual Observed</p>
                <p className="text-xl font-headline font-black text-primary">₹{explanation.risk_breakdown.actual_income.toFixed(2)}</p>
              </div>
              <div className="col-span-2 p-4 bg-secondary/5 rounded-2xl border border-secondary/10 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-bold text-secondary uppercase mb-1">Impact Total (Loss)</p>
                  <p className="text-2xl font-headline font-black text-secondary">₹{explanation.risk_breakdown.loss.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-secondary/60 uppercase mb-1">Severity Coefficient</p>
                  <p className="text-sm font-black text-secondary tabular-nums">{(explanation.risk_breakdown.severity * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </section>

          {/* Fraud & Risk Integrity */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Risk Assessment
            </h4>
            <div className="p-6 bg-white rounded-2xl border border-outline-variant/10 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-primary">Fraud Probability Score</span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black tabular-nums",
                  explanation.fraud_breakdown.fraud_score > 0.5 ? "bg-error text-white" : "bg-emerald-100 text-emerald-800"
                )}>
                  {(explanation.fraud_breakdown.fraud_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="space-y-2">
                {explanation.fraud_breakdown.reasons.length > 0 ? (
                  explanation.fraud_breakdown.reasons.map((reason: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] font-medium text-on-surface-variant bg-surface-container-high/50 p-2 rounded-lg">
                      <AlertTriangle className="w-3 h-3 text-warning shrink-0 mt-0.5" />
                      {reason}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-[10px] font-medium text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    Low-risk behavioral signals detected
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Final Decision */}
          <section className="p-6 bg-primary rounded-3xl text-white space-y-1">
            <h4 className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Engine Decision</h4>
            <p className="text-lg font-bold italic tracking-tight">{explanation.payout_breakdown.decision_reason}</p>
            <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Final Payout</p>
                <p className="text-3xl font-headline font-black tabular-nums">₹{explanation.payout_breakdown.payout_amount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Status</p>
                <p className="text-sm font-black tabular-nums">{explanation.payout_breakdown.claim_status}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-8 bg-surface-container-lowest border-t border-outline-variant/10">
          <Button onClick={onClose} className="w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl">Confirm Audit</Button>
        </div>
      </motion.div>
    </div>
  );
};

const LandingPage = ({ onStart }: { onStart: (role?: 'ADMIN' | 'USER') => void }) => {
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
                    <Button onClick={() => onStart('USER')} size="lg" className="flex items-center gap-3">
                      <span>Enter Worker Demo</span>
                      <TrendingUp className="w-5 h-5" />
                    </Button>
                    <Button onClick={() => onStart('ADMIN')} variant="secondary" size="lg" className="flex items-center gap-3">
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

        <Button
          onClick={() => mockLogin('admin@surely.ai')}
          className="w-full py-5 flex items-center justify-center gap-3 bg-primary text-white border border-primary hover:bg-primary/90"
          size="lg"
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Login as Admin</span>
        </Button>

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
  const [location, setLocation] = useState<{ lat: number, lng: number, name?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleGetLocation = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude, name: 'Current Location' };
        setLocation(newLoc);
        setLocating(false);
      }, (error) => {
        console.error("Location Error:", error);
        setLocating(false);
      });
    } else {
      setLocating(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in`);
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (res: any) => {
    setLocation({ lat: parseFloat(res.lat), lng: parseFloat(res.lon), name: res.display_name });
    setSearchResults([]);
    setSearchQuery(res.display_name);
  };

  const handleSubmit = async () => {
    if (location) {
      await updateProfile({
        location: { latitude: location.lat, longitude: location.lng },
        city: location.name?.split(',')[0] || 'Unknown',
        zone: location.name?.split(',')[1]?.trim() || 'Unknown'
      });
    }
    onNext();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col px-6 py-8 max-w-md mx-auto w-full">
      <OnboardingHeader title="Precise Location" onBack={onBack} step={3} totalSteps={5} />

      <section className="mb-6">
        <p className="text-on-surface-variant text-sm leading-relaxed">Surely.AI uses hyper-local sensing. Search for your primary work area or grant location access.</p>
      </section>

      <div className="space-y-6 flex-grow">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
            <input
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl pl-12 pr-4 py-4 text-sm text-on-surface shadow-sm focus:ring-2 focus:ring-primary/20"
              placeholder="Search for your locality (e.g. Koramangala)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold"
            >
              {searching ? "..." : "Search"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-white border border-outline-variant/20 rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => selectLocation(res)}
                  className="w-full text-left px-4 py-3 text-xs hover:bg-surface-container-low border-b border-outline-variant/5 last:border-0"
                >
                  {res.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-grow h-px bg-outline-variant/20"></div>
          <span className="text-[10px] font-bold text-outline uppercase tracking-widest">or</span>
          <div className="flex-grow h-px bg-outline-variant/20"></div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center relative">
            <div className={cn("absolute inset-0 bg-primary/10 rounded-full", locating && "animate-ping")}></div>
            <MapPin className="w-10 h-10 text-primary relative z-10" />
          </div>

          {location ? (
            <div className="text-center space-y-1">
              <div className="flex items-center gap-2 text-secondary font-bold justify-center">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm">Location Selected</span>
              </div>
              <p className="text-[10px] text-outline font-mono max-w-[200px] truncate">{location.name}</p>
            </div>
          ) : (
            <Button onClick={handleGetLocation} variant="outline" className="gap-2 text-xs" disabled={locating}>
              {locating ? "Locating..." : "Use Current Location"} <Radio className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <footer className="mt-8">
        <Button onClick={handleSubmit} className="w-full py-5" size="lg" disabled={!location && !searchQuery}>
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
              <h2 className="text-5xl font-bold mt-2 tabular-nums tracking-tight">₹{totalPayouts.toFixed(2)}</h2>
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-on-surface font-bold text-lg tracking-tight">Recent Payouts</h3>
            <span className="text-[10px] font-black text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-1 rounded-md">Total Verified</span>
          </div>
          <div className="space-y-6">
            {payouts.length > 0 ? (
              <ul className="space-y-4">
                {payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-white/20 hover:bg-white transition-colors cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary italic uppercase tracking-tighter">{p.eventType}</p>
                        <p className="text-[10px] text-outline uppercase font-black tracking-widest">{new Date(p.timestamp?.toDate?.() || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block font-headline font-black text-secondary">+₹{p.amount.toFixed(2)}</span>
                      <span className="text-[8px] font-black text-secondary/60 uppercase tracking-widest">Instant Credit</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 bg-white/30 rounded-3xl border border-dashed border-outline-variant/30">
                <ShieldCheck className="w-12 h-12 text-outline/20 mx-auto mb-4" />
                <p className="text-outline font-black text-xs uppercase tracking-widest italic">No active payouts detected</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

type WorkerClaimRow = {
  id?: string | number;
  event_type?: string;
  amount?: number;
  status?: string;
};

const workerClaimStatusPresentation = (raw?: string): { label: string; badgeClass: string } => {
  const s = (raw || '').toUpperCase();
  if (s === 'PAID' || s === 'APPROVED') {
    return { label: 'PAID', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (s === 'FLAGGED' || s === 'REJECTED') {
    return { label: 'FLAGGED', badgeClass: 'bg-red-50 text-red-700 border-red-200' };
  }
  return { label: 'CREATED', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
};

const ClaimsView = ({ onBack }: { onBack: () => void }) => {
  const [rows, setRows] = useState<WorkerClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getWorkerClaims()
      .then((data: WorkerClaimRow[]) => {
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || 'Could not load claims');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-3 bg-surface-container-high rounded-full text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-primary">Claims history</h2>
          <p className="text-on-surface-variant text-sm">Parametric claims from your coverage.</p>
        </div>
      </header>

      <div className="bg-surface-container-lowest rounded-[2.5rem] border border-outline-variant/10 p-6 md:p-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-outline uppercase tracking-widest">Loading claims…</p>
          </div>
        )}
        {!loading && error && (
          <div className="text-center py-12 px-4">
            <AlertTriangle className="w-10 h-10 text-error/60 mx-auto mb-3" />
            <p className="text-sm font-bold text-primary mb-1">Unable to load claims</p>
            <p className="text-xs text-on-surface-variant">{error}</p>
          </div>
        )}
        {!loading && !error && rows.length === 0 && (
          <div className="text-center py-16 bg-white/40 rounded-3xl border border-dashed border-outline-variant/30">
            <History className="w-12 h-12 text-outline/25 mx-auto mb-4" />
            <p className="text-outline font-black text-xs uppercase tracking-widest">No claims yet</p>
          </div>
        )}
        {!loading && !error && rows.length > 0 && (
          <ul className="space-y-3">
            {rows.map((claim) => {
              const { label, badgeClass } = workerClaimStatusPresentation(claim.status);
              const amount = Number(claim.amount ?? 0);
              return (
                <li
                  key={String(claim.id ?? `${claim.event_type}-${amount}-${label}`)}
                  className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-outline-variant/10 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Event</p>
                    <p className="text-sm font-bold text-primary truncate">{claim.event_type ?? '—'}</p>
                  </div>
                  <div className="text-right sm:text-left sm:min-w-[100px]">
                    <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Amount</p>
                    <p className="font-headline font-black text-primary tabular-nums">₹{amount.toFixed(2)}</p>
                  </div>
                  <div className="w-full sm:w-auto sm:shrink-0 flex sm:justify-end">
                    <span
                      className={cn(
                        'inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
                        badgeClass
                      )}
                    >
                      {label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

const ExplainView = ({ onBack }: { onBack: () => void }) => {
  const { payouts } = useFirebase();
  const lastPayout = payouts[0];

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <header className="flex flex-col items-center text-center relative">
        <button
          onClick={onBack}
          className="absolute left-0 top-0 p-3 bg-surface-container-high rounded-full text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-headline font-extrabold text-4xl text-primary mb-4">How it Works</h2>
        <p className="text-on-surface-variant">Understanding the Surely.AI Parametric Protocol.</p>
      </header>

      {lastPayout && (
        <div className="bg-secondary/5 border-2 border-secondary/20 p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-4 right-8">
            <Zap className="text-secondary w-12 h-12 opacity-20" />
          </div>
          <h3 className="font-headline font-bold text-secondary mb-4 uppercase tracking-widest text-xs">Latest Payout Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-primary font-headline font-bold text-2xl mb-2">₹{lastPayout.amount.toFixed(2)} Disbursed</p>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Triggered by <span className="font-bold text-primary">{lastPayout.eventType}</span> in your specific zone.
              </p>
              <div className="mt-4 p-4 bg-white/50 rounded-xl border border-secondary/10">
                <p className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1">Exact Reason for Payout</p>
                <p className="text-xs font-bold text-primary leading-relaxed">
                  {lastPayout.eventType === 'Rainfall'
                    ? "Local sensors detected rainfall exceeding 2.5mm/hr for a continuous period of 32 minutes, meeting the parametric threshold for delivery disruption."
                    : "Platform API heartbeat failed for 18 consecutive minutes, triggering the operational downtime protection clause."}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-secondary/10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Trigger Condition</span>
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Met</span>
              </div>
              <p className="text-xs font-bold text-primary">
                {lastPayout.eventType.includes('Rain') ? "Rainfall > 2.5mm/hr for 30+ mins" : "Platform Downtime > 15m"}
              </p>
              <div className="w-full h-1.5 bg-surface-container rounded-full mt-3 overflow-hidden">
                <div className="w-full h-full bg-secondary"></div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        </div>
      </div>

      <div className="bg-primary text-white p-12 rounded-[3rem] text-center">
        <h3 className="font-headline font-bold text-3xl mb-6">Built for the Gig Economy</h3>
        <p className="text-white/70 max-w-2xl mx-auto mb-10">
          We understand that for gig workers, time is money. Our protocol is designed to be invisible, automatic, and absolutely transparent.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <p className="text-2xl font-black text-secondary mb-1">99.9%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Uptime</p>
          </div>
          <div>
            <p className="text-2xl font-black text-secondary mb-1">&lt; 5m</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Payout Speed</p>
          </div>
          <div>
            <p className="text-2xl font-black text-secondary mb-1">100%</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Automated</p>
          </div>
          <div>
            <p className="text-2xl font-black text-secondary mb-1">0</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Paperwork</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimulationModal = ({ isOpen, onClose, onSimulate, loading }: {
  isOpen: boolean,
  onClose: () => void,
  onSimulate: (data: any) => void,
  loading: boolean
}) => {
  const [formData, setFormData] = useState({
    event_type: 'RAIN',
    city: 'Chennai',
    zone: 'T Nagar',
    severity: 0.7
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-outline-variant/10 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-surface-container-low rounded-full transition-colors text-outline hover:text-primary z-10"
        >
          <XCircle className="w-6 h-6" />
        </button>

        <div className="mb-8">
          <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4">
            <Radio className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="font-headline font-black text-2xl text-primary tracking-tight">Risk Simulator</h3>
          <p className="text-sm text-outline font-medium mt-2">Configure environment parameters for simulation.</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2.5 px-1">Event Category</label>
            <div className="grid grid-cols-3 gap-2">
              {['RAIN', 'FLOOD', 'CURFEW'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, event_type: type })}
                  className={cn(
                    "py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    formData.event_type === type
                      ? "bg-primary text-white border-primary shadow-md"
                      : "bg-surface-container-low text-outline border-outline-variant/10 hover:border-outline-variant/30"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2.5 px-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 hover:border-outline-variant/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-outline uppercase tracking-widest mb-2.5 px-1">Zone / Area</label>
              <input
                type="text"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/10 hover:border-outline-variant/30 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2.5 px-1">
              <label className="text-[10px] font-black text-outline uppercase tracking-widest">Impact Severity</label>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                formData.severity > 0.7 ? "bg-error/10 text-error" : "bg-secondary/10 text-secondary"
              )}>{Math.round(formData.severity * 100)}%</span>
            </div>
            <div className="relative pt-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-surface-container-low rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[9px] font-bold text-outline">Mild</span>
                <span className="text-[9px] font-bold text-outline">Extreme</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-[2] py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-secondary text-white border-none relative overflow-hidden"
            disabled={loading}
            onClick={() => onSimulate(formData)}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4 animate-pulse" />
                Processing...
              </span>
            ) : (
              'Run Simulation'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const AdminDashboard = ({ onSwitchToUser }: { onSwitchToUser?: () => void }) => {
  const { systemEvents } = useFirebase();
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'claims' | 'fraud' | 'simulator' | 'metrics' | 'settings'>('overview');
  const [claims, setClaims] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [totalPayoutAmount, setTotalPayoutAmount] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const refreshAll = async () => {
    getClaims()
      .then((data) => setClaims(data))
      .catch((err) => console.error('Failed to fetch claims:', err))
      .finally(() => setClaimsLoading(false));

    getPayouts()
      .then((data: any[]) => {
        setPayouts(data);
        const total = data.reduce((sum, p) => sum + (p.amount ?? 0), 0);
        setTotalPayoutAmount(total);
      })
      .catch((err) => console.error('Failed to fetch payouts:', err));

    getFraudAlerts()
      .then((data) => setFraudAlerts(data))
      .catch((err) => console.error('Failed to fetch fraud alerts:', err));
  };

  const handleSimulate = async (data: any) => {
    setSimulating(true);
    try {
      await simulateEvent(data);
      await refreshAll();
      setIsSimulatorOpen(false);
      setToast({ message: "Event processed. Claims updated.", type: 'success' });
    } catch (err) {
      console.error('Simulation failed:', err);
      setToast({ message: "Simulation failed. Check backend.", type: 'error' });
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);


  const totalPayoutDisplay = totalPayoutAmount === null
    ? 'Loading...'
    : `₹${totalPayoutAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const stats = [
    { label: 'Total Active Policies', value: '1.24M', change: '+2.4%', icon: BarChart3, color: 'primary' },
    { label: 'Total Payouts Today', value: totalPayoutDisplay, change: 'Optimal', icon: Zap, color: 'secondary' },
    { label: 'Fraud Alert Rate', value: '0.82%', change: '+0.1%', icon: ShieldAlert, color: 'error' },
    { label: 'Avg. Loss Ratio', value: '64.5%', change: 'Optimal', icon: TrendingUp, color: 'primary' },
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-surface-container-high border-r border-outline-variant/10 py-8 sticky top-0 h-screen">
        <div className="px-8 mb-12">
          <h1 className="font-headline font-black text-xl tracking-tighter text-primary">SURELY ADMIN</h1>
        </div>
        <nav className="flex-grow space-y-1 overflow-y-auto">
          {[
            { id: 'overview', icon: Home, label: 'Overview' },
            { id: 'claims', icon: History, label: 'Claims Queue' },
            { id: 'fraud', icon: ShieldAlert, label: 'Fraud Engine' },
            { id: 'simulator', icon: Cpu, label: 'Risk Simulator' },
            { id: 'metrics', icon: BarChart3, label: 'System Metrics' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveAdminTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-8 py-4 text-sm font-bold transition-all border-l-4",
                activeAdminTab === item.id
                  ? "bg-white text-primary border-primary"
                  : "text-outline hover:bg-white/50 border-transparent"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-8 mt-auto pt-8">
          <Button
            variant="outline"
            className="w-full text-[10px] font-black uppercase tracking-widest py-4 border-primary/20 text-primary hover:bg-primary/5"
            onClick={onSwitchToUser}
          >
            Switch to User View
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        <header className="bg-white border-b border-outline-variant/10 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 hover:bg-surface-container-high rounded-full"
              onClick={onSwitchToUser}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">System Operational • Admin Mode</p>
              <h2 className="font-headline font-bold text-primary text-xl capitalize">{activeAdminTab} Dashboard</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/10">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Network Live</span>
            </div>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              disabled={simulating}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-sm hover:bg-secondary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle className="w-4 h-4" />
              {simulating ? 'Simulated...' : 'Simulate Event'}
            </button>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">AD</div>
          </div>
        </header>

        <SimulationModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          onSimulate={handleSimulate}
          loading={simulating}
        />

        <ClaimDetailsModal
          isOpen={!!selectedClaim}
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />

        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>

        <main className="p-8 flex-grow overflow-y-auto">
          {activeAdminTab === 'overview' ? (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <div key={i} className={cn(
                    "bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden group",
                    stat.color === 'error' && "border-b-2 border-b-error",
                    stat.color === 'primary' && i === 0 && "border-b-2 border-b-primary"
                  )}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-outline uppercase tracking-widest">{stat.label}</span>
                      <stat.icon className={cn("w-5 h-5", `text-${stat.color}/40`)} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-headline font-black text-primary tabular-nums">{stat.value}</h3>
                      <span className={cn("text-[10px] font-bold", stat.color === 'error' ? "text-error" : "text-secondary")}>{stat.change}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-12 gap-8">
                {/* Map Section */}
                <div className="col-span-12 lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline font-bold text-primary flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Live Risk Map
                    </h3>
                    <div className="flex gap-2">
                      <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-primary tracking-tighter">NORTH AMERICA</span>
                      <span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-primary tracking-tighter">REAL-TIME FEED</span>
                    </div>
                  </div>
                  <div className="h-[400px] rounded-[2.5rem] overflow-hidden border border-outline-variant/10 shadow-sm relative">
                    <RiskMap activeEvent={systemEvents[0]} />

                    {/* Floating Overlay */}
                    <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/15 w-64 space-y-3 shadow-xl">
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest">Active Disruption Zones</p>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold">Zone 7A (Storm Front)</span>
                            <span className="w-2 h-2 rounded-full bg-error"></span>
                          </div>
                          <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                            <div className="bg-error h-full w-[85%]"></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold">Zone 12 (Strike Action)</span>
                            <span className="w-2 h-2 rounded-full bg-warning"></span>
                          </div>
                          <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                            <div className="bg-warning h-full w-[40%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fraud Insights */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                  <h3 className="font-headline font-bold text-primary flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5" />
                    Fraud Insights
                  </h3>
                  <div className="bg-surface-container-high rounded-[2.5rem] p-8 h-[400px] flex flex-col justify-between border border-outline-variant/10">
                    <div className="space-y-4">
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        AI has detected a <span className="font-bold text-primary">high-density cluster</span> of claims originating from localized IP ranges in Zone 4C.
                      </p>
                      <div className="p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-error uppercase tracking-widest">Anomalous Spike</span>
                          <span className="text-[10px] font-bold text-outline tabular-nums">14:22 UTC</span>
                        </div>
                        <div className="text-3xl font-black text-primary">+142%</div>
                        <p className="text-[10px] text-on-surface-variant mt-1 font-bold uppercase tracking-widest">Claim volume vs Baseline</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {['IP-MASQUERADING', 'VELOCITY-CLAIM', 'ZONE-HACKING'].map(tag => (
                          <span key={tag} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[8px] font-black tracking-widest">{tag}</span>
                        ))}
                      </div>
                      <Button className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest">Launch Full Investigation</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-outline-variant/10 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="font-headline font-black text-primary text-xl uppercase tracking-tighter">Payout Velocity</h3>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">Real-time disbursement trend analysis</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <PayoutVelocityChart data={payouts} />
              </div>

              {/* Claims Queue */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline font-bold text-primary flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Recent Claims Queue
                  </h3>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-widest italic">
                    {claimsLoading ? 'Loading...' : `Showing ${claims.length} claim${claims.length !== 1 ? 's' : ''} from API`}
                  </span>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-outline-variant/10 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-8 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Worker Name</th>
                        <th className="px-8 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Claim ID</th>
                        <th className="px-8 py-4 text-[10px] font-black text-outline uppercase tracking-widest">City</th>
                        <th className="px-8 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Event Type</th>
                        <th className="px-8 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Amount</th>
                        <th className="px-8 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Fraud Score</th>
                        <th className="px-8 py-4 text-[10px] font-black text-outline uppercase tracking-widest text-center">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black text-outline uppercase tracking-widest text-right">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {claimsLoading ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-12 text-center text-outline italic">Fetching live claims data...</td>
                        </tr>
                      ) : claims.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-12 text-center text-outline italic">No claims found. Run a simulation to generate data.</td>
                        </tr>
                      ) : (
                        claims.map((claim) => {
                          const fraudPct = Math.round((1 - claim.fraud_score) * 100);

                          const statusConfig =
                            claim.status === 'PAID' ? { label: 'PAID', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' } :
                              claim.status === 'REJECTED' ? { label: 'FLAGGED', classes: 'bg-red-50 text-red-700 border-red-100' } :
                                { label: 'CREATED', classes: 'bg-amber-50 text-amber-700 border-amber-100' };

                          return (
                            <tr key={claim.id} className="hover:bg-surface-container-lowest transition-colors group">
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                                    <UserIcon className="w-4 h-4" />
                                  </div>
                                  <p className="text-xs font-bold text-primary">{claim.worker_name}</p>
                                </div>
                              </td>
                              <td className="px-8 py-4 font-mono text-[10px] text-outline font-bold">#{claim.id}</td>
                              <td className="px-8 py-4 text-xs font-bold text-primary italic uppercase tracking-tighter">{claim.city || 'Chennai'}</td>
                              <td className="px-8 py-4 text-xs font-bold text-primary">{claim.event_type}</td>
                              <td className="px-8 py-4 font-headline font-bold text-primary tabular-nums">₹{claim.amount.toFixed(2)}</td>
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                                    <div className={cn("h-full", fraudPct > 70 ? "bg-secondary" : "bg-warning")} style={{ width: `${fraudPct}%` }}></div>
                                  </div>
                                  <span className={cn("text-[10px] font-black tabular-nums", fraudPct > 70 ? "text-secondary" : "text-warning")}>{fraudPct}%</span>
                                </div>
                              </td>
                              <td className="px-8 py-4 text-center">
                                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", statusConfig.classes)}>
                                  {statusConfig.label}
                                </span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <button
                                  onClick={() => setSelectedClaim(claim)}
                                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-secondary hover:underline underline-offset-4 transition-all"
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeAdminTab === 'fraud' ? (
            <div className="space-y-8">
              <header className="flex justify-between items-center">
                <div>
                  <h2 className="font-headline font-black text-3xl text-primary">Fraud Statistics</h2>
                  <p className="text-on-surface-variant font-medium">Real-time velocity monitoring across active zones.</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white px-4 py-2 rounded-xl border border-outline-variant/10 shadow-sm flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Monitoring</span>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fraudAlerts.length === 0 ? (
                  <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center">
                    <ShieldCheck className="w-12 h-12 text-outline/20 mb-4" />
                    <p className="text-outline font-bold italic">No anomalies detected at this time.</p>
                  </div>
                ) : (
                  fraudAlerts.map((alert, idx) => {
                    const isHighRisk = alert.alert_status === "HIGH RISK";
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className={cn(
                          "p-8 rounded-[2.5rem] border transition-all shadow-sm relative overflow-hidden group",
                          isHighRisk
                            ? "bg-red-50/50 border-error/20"
                            : "bg-white border-outline-variant/10"
                        )}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            isHighRisk ? "bg-error text-white" : "bg-primary/10 text-primary"
                          )}>
                            {isHighRisk ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            isHighRisk ? "bg-error text-white border-none" : "bg-secondary/10 text-secondary border-secondary/20"
                          )}>
                            {alert.alert_status}
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Geographic Zone</h4>
                            <p className="text-lg font-bold text-primary italic uppercase tracking-tighter">{alert.zone}</p>
                          </div>
                          <div className="flex justify-between items-end border-t border-outline-variant/10 pt-4">
                            <div>
                              <h4 className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Cluster Density</h4>
                              <p className="text-2xl font-headline font-black text-primary tabular-nums">{alert.claim_count}</p>
                            </div>
                            {isHighRisk && (
                              <div className="bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
                                Velocity spike detected
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
                <Cpu className="w-10 h-10 text-outline/30 animate-pulse" />
              </div>
              <h3 className="font-headline font-bold text-primary text-2xl mb-2 capitalize">{activeAdminTab} Interface</h3>
              <p className="text-on-surface-variant max-w-md mx-auto">
                This module is currently processing real-time data streams. Full interface will be available shortly.
              </p>
              <Button
                variant="outline"
                className="mt-8"
                onClick={() => setActiveAdminTab('overview')}
              >
                Return to Overview
              </Button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="px-8 py-6 flex justify-between items-center border-t border-outline-variant/10 bg-white">
          <div className="flex items-center gap-4 text-[8px] font-black text-outline uppercase tracking-widest">
            <span>© 2024 SurelyAI Technologies</span>
            <div className="w-1 h-1 bg-outline/20 rounded-full"></div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>
              Engine: V4.2-Luminous
            </div>
          </div>
          <div className="flex gap-6 text-[8px] font-black text-outline uppercase tracking-widest">
            <a href="#" className="hover:text-primary">API Status</a>
            <a href="#" className="hover:text-primary">Incident Logs</a>
            <a href="#" className="hover:text-primary">Node Clusters</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

const AlertsView = ({ onBack }: { onBack: () => void }) => {
  const { systemEvents } = useFirebase();
  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-3 bg-surface-container-high rounded-full text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-primary">Safety Alerts</h2>
          <p className="text-on-surface-variant">Real-time notifications for your active zones.</p>
        </div>
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

const ProfileView = ({ onBack }: { onBack: () => void }) => {
  const { user, profile, updateProfile, logout } = useFirebase();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.fullName || '');

  const handleSave = async () => {
    await updateProfile({ fullName: name });
    setEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <header className="flex flex-col items-center text-center relative">
        <button
          onClick={onBack}
          className="absolute left-0 top-0 p-3 bg-surface-container-high rounded-full text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
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
  const { user, profile } = useFirebase();
  const [activeTab, setActiveTab] = useState<'home' | 'claims' | 'explain' | 'alerts' | 'profile'>('home');
  const [isAdminView, setIsAdminView] = useState(profile?.role === 'ADMIN');

  const isAdmin = profile?.role === 'ADMIN';

  if (isAdminView) {
    return <AdminDashboard onSwitchToUser={() => setIsAdminView(false)} />;
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="bg-surface sticky top-0 z-40 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          {activeTab !== 'home' && (
            <button
              onClick={() => setActiveTab('home')}
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline hover:text-primary mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 premium-gradient rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tighter text-primary font-headline">SURELY.<span className="text-secondary">AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button
              onClick={() => setIsAdminView(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-surface-container-high text-outline hover:text-primary"
            >
              Switch to Admin
            </button>
          )}
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
            {activeTab === 'claims' && <ClaimsView onBack={() => setActiveTab('home')} />}
            {activeTab === 'explain' && <ExplainView onBack={() => setActiveTab('home')} />}
            {activeTab === 'alerts' && <AlertsView onBack={() => setActiveTab('home')} />}
            {activeTab === 'profile' && <ProfileView onBack={() => setActiveTab('home')} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isAdminView && (
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
      )}
    </div>
  );
};

// --- Main App Entry ---

export default function App() {
  const { user, profile, loading, isAuthReady, logout, mockLogin } = useFirebase();
  const [showLanding, setShowLanding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState<'profile' | 'persona' | 'location' | 'problems' | 'connect' | 'complete'>('profile');

  const isAdmin = profile?.role === 'ADMIN';

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
              <LandingPage onStart={(role) => {
                if (role === 'ADMIN') {
                  mockLogin('admin@surely.ai');
                } else if (role === 'USER') {
                  mockLogin('worker@surely.ai');
                } else {
                  setShowLanding(false);
                }
              }} />
            </motion.div>
          ) : (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OnboardingLogin onBack={() => setShowLanding(true)} />
            </motion.div>
          )
        ) : (!profile || (onboardingStep !== 'complete' && !isAdmin)) ? (
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
