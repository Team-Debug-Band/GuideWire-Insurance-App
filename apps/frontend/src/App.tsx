import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
  ResponsiveContainer
} from 'recharts';
import { Button } from './components/Button';
import OnboardingWizard from './pages/OnboardingWizard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import { getToken, getUserRole } from './utils/auth';

// --- Data for Radar Chart ---
const radarData = [
  { subject: 'Reliability', A: 120, fullMark: 150 },
  { subject: 'Precision', A: 110, fullMark: 150 },
  { subject: 'Speed', A: 140, fullMark: 150 },
  { subject: 'Transparency', A: 130, fullMark: 150 },
  { subject: 'Automation', A: 150, fullMark: 150 },
];

const LandingPage = ({ onStart }: { onStart: (role?: 'ADMIN' | 'USER') => void }) => {
  return (
    <div className="min-h-screen bg-surface">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tighter text-primary font-headline">SURELY.<span className="text-secondary">AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => onStart()} variant="ghost" className="text-primary font-bold text-xs uppercase tracking-widest hidden sm:flex">Login</Button>
          <Button onClick={() => onStart()} size="md">GET STARTED</Button>
        </div>
      </nav>

      <main>
        <section className="relative pt-20 pb-32 overflow-hidden px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 z-10 text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full mb-6 border border-secondary/20 shadow-sm animate-pulse">
                  The Future of Gig Work Protection
                </span>
                <h2 className="text-5xl lg:text-7xl font-black text-primary leading-[1.1] mb-8 headline tracking-tight">
                  Parametric <span className="text-gradient-primary">Insurance</span> for the Gig Economy
                </h2>
                <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed font-medium mb-10">
                  SurelyAI uses real-time environmental data and ML risk modelling to provide instant, automated protection for platform workers. No claims adjusters. No paperwork. Just speed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button onClick={() => onStart('USER')} size="lg" className="flex items-center gap-3">
                    <LogIn className="w-5 h-5" />
                    Enter Worker Demo
                  </Button>
                  <Button onClick={() => onStart('ADMIN')} variant="secondary" size="lg" className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5" />
                    Enter Admin Demo
                  </Button>
                </div>
              </motion.div>
            </div>
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="w-full h-[500px] bg-white rounded-[3rem] shadow-2xl border border-surface-container relative overflow-hidden group">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-headline font-black text-primary uppercase text-xs tracking-widest">Active Protection Score</h3>
                    <div className="w-2 h-2 rounded-full bg-secondary animate-ping"></div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#0d1c2e', fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Surely.AI" dataKey="A" stroke="#002542" fill="#002542" fillOpacity={0.35} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="p-4 bg-surface rounded-2xl border border-surface-container shadow-inner">
                    <p className="text-[10px] text-outline font-bold uppercase text-center tracking-widest leading-relaxed">
                      "Real-time parametric triggers detected in Zone 4C. Automation engine engaged."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
    const token = getToken();
    const userRole = getUserRole();
    if (!token) return <Navigate to="/login" />;
    if (role && userRole !== role) return <Navigate to={userRole === 'ADMIN' ? '/admin' : '/dashboard'} />;
    return <>{children}</>;
};

const AppRoutes = () => {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/" element={
        getToken() ? (
          <Navigate to={getUserRole() === 'ADMIN' ? '/admin' : '/dashboard'} />
        ) : (
          <LandingPage onStart={(role) => {
            if (role) {
              // For demo, if role is passed, we go straight to login
              navigate('/login');
            } else {
              navigate('/onboarding');
            }
          }} />
        )
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />
      <Route path="/dashboard" element={<PrivateRoute role="WORKER"><WorkerDashboard /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute role="ADMIN"><AdminDashboard /></PrivateRoute>} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
