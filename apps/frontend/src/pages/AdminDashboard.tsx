import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../utils/auth';

import { API_BASE_URL } from '../config';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [metrics, setMetrics] = useState<any>(null);
    const [claims, setClaims] = useState<any[]>([]);
    const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Simulation State
    const [simData, setSimData] = useState({ city: 'Chennai', zone: '', severity: 0.5 });
    const [simResult, setSimResult] = useState<any>(null);

    const fetchData = async () => {
        const token = localStorage.getItem("surelyai_token");
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const [mRes, cRes, fRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/metrics`, { headers }),
                axios.get(`${API_BASE_URL}/admin/claims`, { headers }),
                axios.get(`${API_BASE_URL}/admin/fraud-dashboard`, { headers })
            ]);
            setMetrics(mRes.data);
            setClaims(cRes.data);
            setFraudAlerts(fRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSimulate = async (type: 'rain' | 'aqi') => {
        setLoading(true);
        const token = localStorage.getItem("surelyai_token");
        try {
            const res = await axios.post(`${API_BASE_URL}/admin/simulate-${type}`, simData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSimResult(res.data);
            fetchData();
        } catch (err) {
            alert('Simulation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearToken();
        navigate('/login');
    };

    const tabs = ['Overview', 'Claims', 'Fraud Alerts', 'Simulator'];

    return (
        <div className="min-h-screen bg-surface flex">
            {/* Sidebar */}
            <aside className="w-64 bg-primary text-white flex flex-col fixed inset-y-0 shadow-2xl z-50">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary font-black text-xl">S</div>
                        <span className="font-black text-xl headline tracking-tighter">SurelyAI</span>
                    </div>
                    <nav className="space-y-2">
                        {tabs.map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-primary shadow-lg scale-105' : 'hover:bg-white/10 text-white/70'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-8 border-t border-white/10">
                    <button onClick={handleLogout} className="text-xs font-black text-white/50 hover:text-white transition-colors uppercase tracking-widest">Sign Out</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-black text-on-background headline uppercase tracking-tight">{activeTab}</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black bg-secondary text-white px-3 py-1 rounded-full uppercase tracking-widest">Admin Mode</span>
                        <div className="w-10 h-10 bg-white rounded-full border border-surface-container flex items-center justify-center font-bold text-primary">A</div>
                    </div>
                </header>

                {loading && activeTab !== 'Simulator' ? (
                    <div className="animate-pulse flex space-y-4 flex-col">
                        <div className="h-32 bg-white rounded-3xl w-full"></div>
                        <div className="h-64 bg-white rounded-3xl w-full"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'Overview' && metrics && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Active Policies', value: metrics.total_active_policies, color: 'text-primary' },
                                        { label: 'Premiums (Weekly)', value: `₹${metrics.total_weekly_premiums}`, color: 'text-secondary' },
                                        { label: 'Total Payouts', value: `₹${metrics.total_payouts}`, color: 'text-error' },
                                        { label: 'Loss Ratio', value: `${((metrics.total_payouts / (metrics.total_weekly_premiums || 1)) * 100).toFixed(1)}%`, color: 'text-amber-600' }
                                    ].map((m, i) => (
                                        <div key={i} className="bg-white p-6 rounded-3xl border border-surface-container shadow-sm">
                                            <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-2">{m.label}</p>
                                            <div className={`text-2xl font-black headline ${m.color}`}>{m.value}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-surface-container shadow-sm h-96 flex flex-col items-center justify-center text-outline">
                                    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4">📈</div>
                                    <p className="text-sm font-bold uppercase tracking-widest">System growth charts will appear here</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Claims' && (
                            <div className="bg-white rounded-3xl border border-surface-container shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
                                <table className="w-full text-left">
                                    <thead className="bg-surface border-b border-surface-container">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-outline uppercase">Ref #</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-outline uppercase">Claimed ₹</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-outline uppercase">Fraud Score</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-outline uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-container text-xs font-bold">
                                        {claims.map((c, i) => (
                                            <tr key={i} className="hover:bg-surface/50 transition-colors">
                                                <td className="px-6 py-4 font-black">#{c.id.slice(0, 8)}</td>
                                                <td className="px-6 py-4 text-primary">₹{c.claimed_amount}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] ${c.fraud_score > 0.6 ? 'bg-error-container text-error' : 'bg-secondary/10 text-secondary'}`}>
                                                        {c.fraud_score?.toFixed(2) || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-surface px-2 py-1 rounded border border-surface-container uppercase text-[9px]">{c.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'Fraud Alerts' && (
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    {fraudAlerts.length === 0 ? (
                                        <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-surface-container text-outline">No active fraud alerts detected.</div>
                                    ) : (
                                        fraudAlerts.map((a, i) => (
                                            <div key={i} className="bg-white p-6 rounded-3xl border-2 border-error/20 shadow-lg flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-black text-on-background headline uppercase tracking-tight">{a.zone}</h4>
                                                    <p className="text-xs text-error font-bold">{a.claim_count} claims vs {a.expected_claim_count} expected</p>
                                                </div>
                                                <button className="bg-error text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Investigate</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                             </div>
                        )}

                        {activeTab === 'Simulator' && (
                            <div className="space-y-8 animate-in zoom-in-95">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Rain Simulator */}
                                    <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-primary">
                                        <h3 className="text-xl font-black text-on-background headline mb-6 uppercase tracking-tight">Simulate Rain Event</h3>
                                        <div className="space-y-4">
                                            <select className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" value={simData.city} onChange={e => setSimData({...simData, city: e.target.value})}>
                                                <option>Chennai</option>
                                                <option>Bangalore</option>
                                            </select>
                                            <input className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" placeholder="Zone (e.g. T Nagar)" value={simData.zone} onChange={e => setSimData({...simData, zone: e.target.value})} />
                                            <div>
                                                <label className="text-[10px] font-black text-outline uppercase mb-2 block">Severity: {simData.severity}</label>
                                                <input type="range" min="0" max="1" step="0.1" className="w-full accent-primary" value={simData.severity} onChange={e => setSimData({...simData, severity: Number(e.target.value)})} />
                                            </div>
                                            <button onClick={() => handleSimulate('rain')} disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-container transition-all">Trigger Rain Event</button>
                                        </div>
                                    </div>

                                    {/* AQI Simulator */}
                                    <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-amber-500">
                                        <h3 className="text-xl font-black text-on-background headline mb-6 uppercase tracking-tight">Simulate AQI Event</h3>
                                        <div className="space-y-4">
                                            <select className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" value={simData.city} onChange={e => setSimData({...simData, city: e.target.value})}>
                                                <option>Chennai</option>
                                                <option>Bangalore</option>
                                            </select>
                                            <input className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" placeholder="Zone" value={simData.zone} onChange={e => setSimData({...simData, zone: e.target.value})} />
                                            <div>
                                                <label className="text-[10px] font-black text-outline uppercase mb-2 block">Severity: {simData.severity}</label>
                                                <input type="range" min="0" max="1" step="0.1" className="w-full accent-amber-500" value={simData.severity} onChange={e => setSimData({...simData, severity: Number(e.target.value)})} />
                                            </div>
                                            <button onClick={() => handleSimulate('aqi')} disabled={loading} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-600 transition-all">Trigger AQI Event</button>
                                        </div>
                                    </div>
                                </div>

                                {simResult && (
                                    <div className="bg-secondary/10 border-2 border-secondary p-8 rounded-3xl animate-in fade-in slide-in-from-top-4">
                                        <h4 className="text-secondary font-black uppercase tracking-widest text-xs mb-4">Simulation Result</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-[10px] font-black text-secondary/60 uppercase">Affected Workers</p>
                                                <p className="text-2xl font-black text-secondary headline">{simResult.affected_cycles}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <p className="text-[10px] font-black text-secondary/60 uppercase">Status</p>
                                                <p className="text-sm font-bold text-secondary">{simResult.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
