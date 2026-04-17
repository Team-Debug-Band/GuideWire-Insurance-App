import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PremiumExplainer from '../components/PremiumExplainer';
import { clearToken } from '../utils/auth';

import { API_BASE_URL, POLLING_INTERVAL } from '../config';

interface DashboardData {
    worker: { name: string; city: string; persona_type: string };
    policy: { max_weekly_coverage: number; status: string } | null;
    active_cycle: { weekly_premium: number; risk_score: number; risk_components: any[] } | null;
    recent_payouts: any[];
}

const WorkerDashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchPayouts = useCallback(async () => {
        const token = localStorage.getItem("surelyai_token");
        try {
            const res = await axios.get(`${API_BASE_URL}/workers/me/payouts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayouts(res.data);
        } catch (err) {
            console.error("Failed to fetch payouts", err);
        }
    }, []);

    const fetchDashboard = useCallback(async () => {
        const token = localStorage.getItem("surelyai_token");
        try {
            const res = await axios.get(`${API_BASE_URL}/workers/me/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
            
            // Fetch weather once city is known
            if (res.data.worker.city) {
                const wRes = await axios.get(`${API_BASE_URL}/weather/current?city=${res.data.worker.city}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setWeather(wRes.data);
            }
        } catch (err) {
            setError('Failed to load dashboard');
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                clearToken();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboard();
        fetchPayouts();

        // Polling for "real-time" updates every 30 seconds
        const interval = setInterval(() => {
            fetchDashboard();
            fetchPayouts();
        }, POLLING_INTERVAL);

        return () => clearInterval(interval);
    }, [fetchDashboard, fetchPayouts]);

    const handleLogout = () => {
        clearToken();
        navigate('/login');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface text-primary font-black animate-pulse uppercase tracking-widest">Loading Dashboard...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-surface text-error font-bold uppercase">{error}</div>;
    if (!data) return null;

    const protectionScore = data.active_cycle ? Math.round((1 - data.active_cycle.risk_score) * 100) : 0;

    return (
        <div className="min-h-screen bg-surface">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-surface-container px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs uppercase">S</div>
                    <span className="font-black text-on-background headline uppercase tracking-tight">SurelyAI</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-black text-on-background uppercase">{data.worker.name}</p>
                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{data.worker.city} • {data.worker.persona_type}</p>
                    </div>
                    <button onClick={handleLogout} className="text-xs font-black text-error bg-error/10 px-4 py-2 rounded-xl hover:bg-error/20 transition-all uppercase tracking-widest">Logout</button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Coverage Card */}
                    <div className={`p-8 rounded-3xl shadow-lg relative overflow-hidden transition-all border-4 ${data.policy?.status === 'ACTIVE' ? 'bg-secondary border-secondary/20 text-white' : 'bg-amber-500 border-amber-500/20 text-white'}`}>
                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-80">Weekly Coverage Active</p>
                        <div className="text-6xl font-black headline tabular-nums mb-2">₹{data.policy?.max_weekly_coverage || 0}</div>
                        <p className="text-sm font-bold opacity-90">Protection limit for current cycle</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Premium Card */}
                        <div className="bg-white p-6 rounded-3xl border border-surface-container shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-2">Weekly Premium</p>
                            <div className="text-3xl font-black text-on-background headline tabular-nums">₹{data.active_cycle?.weekly_premium || 0}</div>
                        </div>

                        {/* Protection Score */}
                        <div className="bg-white p-6 rounded-3xl border border-surface-container shadow-sm relative group overflow-hidden">
                             <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity"></div>
                            <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-2">Safety Score</p>
                            <div className="flex items-end gap-2">
                                <div className="text-3xl font-black text-primary headline tabular-nums">{protectionScore}</div>
                                <div className="w-12 h-1 bg-surface rounded-full mb-2 overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${protectionScore}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weather Card */}
                    {weather && (
                        <div className={`p-6 rounded-3xl border-2 shadow-sm transition-all ${weather.status === 'ALERT' ? 'bg-error-container border-error/20' : 'bg-white border-surface-container'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-on-background headline uppercase tracking-tight">Local Conditions</h3>
                                    <p className="text-xs font-bold text-outline uppercase tracking-widest">{data.worker.city}</p>
                                </div>
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${weather.status === 'ALERT' ? 'bg-error text-white animate-pulse' : 'bg-secondary/10 text-secondary'}`}>
                                    {weather.status === 'ALERT' ? '⚠️ RISK ALERT' : '✅ NORMAL'}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-surface/50 p-4 rounded-2xl">
                                    <p className="text-[10px] font-black text-outline uppercase mb-1">Hourly Rain</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black headline">{weather.rain_1h_mm}mm</span>
                                        {weather.rain_1h_mm > 30 && <span className="w-2 h-2 rounded-full bg-error"></span>}
                                    </div>
                                </div>
                                <div className="bg-surface/50 p-4 rounded-2xl">
                                    <p className="text-[10px] font-black text-outline uppercase mb-1">AQI Level</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black headline">{weather.aqi}</span>
                                        {weather.aqi > 200 && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="lg:col-span-7 space-y-6">
                    {/* XAI Premium Explainer */}
                    {data.active_cycle && (
                        <PremiumExplainer 
                            xai_breakdown={data.active_cycle.risk_components || []} 
                            premium={data.active_cycle.weekly_premium || 0} 
                        />
                    )}

                    {/* Recent Payouts Table */}
                    <div className="bg-white rounded-3xl border border-surface-container shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-surface-container flex justify-between items-center">
                            <h3 className="text-lg font-black text-on-background headline uppercase tracking-tight">Payout History</h3>
                            <button className="text-[10px] font-black text-primary uppercase tracking-widest" onClick={fetchPayouts}>Refresh</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface border-b border-surface-container">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Event</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Method</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-outline uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container">
                                    {payouts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-xs text-outline font-medium italic">No recent payouts found.</td>
                                        </tr>
                                    ) : (
                                        payouts.map((p, i) => {
                                            const providerLabels: Record<string, string> = {
                                                'RAZORPAY': 'Credited via Razorpay',
                                                'MOCK': 'Processed (Demo Mode)'
                                            };
                                            const methodLabel = providerLabels[p.provider] || p.provider || 'System Credit';
                                            
                                            return (
                                                <tr key={i} className="hover:bg-surface/50 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-black text-secondary tabular-nums">₹{p.amount}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-on-background uppercase tracking-tight bg-surface px-2 py-1 rounded-lg">
                                                            {p.event_type || 'GENERAL'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">
                                                        {methodLabel}
                                                    </td>
                                                    <td className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-widest">
                                                        {new Date(p.payout_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === 'SUCCESS' ? 'bg-secondary/10 text-secondary' : 'bg-amber-100 text-amber-600'}`}>
                                                            {p.status}
                                                        </span>
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
            </main>
        </div>
    );
};

export default WorkerDashboard;
