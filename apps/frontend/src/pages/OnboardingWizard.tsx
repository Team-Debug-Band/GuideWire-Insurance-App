import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { setToken, setRole } from '../utils/auth';

import { API_BASE_URL } from '../config';

interface PlatformOption {
    id: string;
    label: string;
    icon: string;
}

const PLATFORMS: PlatformOption[] = [
    { id: 'SWIGGY', label: 'Swiggy', icon: '🛵' },
    { id: 'ZOMATO', label: 'Zomato', icon: '🍕' },
    { id: 'BLINKIT', label: 'Blinkit', icon: '🥦' },
    { id: 'ZEPTO', label: 'Zepto', icon: '⚡' },
    { id: 'AMAZON', label: 'Amazon', icon: '📦' },
    { id: 'FLIPKART', label: 'Flipkart', icon: '🛒' },
];

const OnboardingWizard: React.FC = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Step 1: Account
    const [accountData, setAccountData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        otp: ''
    });
    const [otpSent, setOtpSent] = useState(false);

    // Step 2: Profile
    const [profileData, setProfileData] = useState({
        city: '',
        primary_zone: '',
        persona_type: 'FOOD'
    });

    // Step 3: Platforms
    const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, { enabled: boolean, hours: number, earnings: number }>>({});

    // Step 4: Summary
    const [summary, setSummary] = useState<any>(null);

    // Location Detection
    const detectLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                // In a real app, we'd reverse geocode here.
                // For demo, we'll mock it.
                setProfileData(prev => ({ ...prev, city: 'Chennai', primary_zone: 'Mylapore' }));
            });
        }
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const onSignup = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/signup`, {
                name: accountData.name,
                email: accountData.email,
                phone: accountData.phone,
                password: accountData.password
            });
            setToken(res.data.access_token);
            setRole("WORKER");
            handleNext();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const onUpdateProfile = async () => {
        setLoading(true);
        const token = localStorage.getItem("surelyai_token");
        try {
            await axios.put(`${API_BASE_URL}/workers/me`, profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            handleNext();
        } catch (err: any) {
            setError('Update profile failed');
        } finally {
            setLoading(false);
        }
    };

    const onLinkPlatforms = async () => {
        setLoading(true);
        const token = localStorage.getItem("surelyai_token");
        try {
            for (const [id, data] of Object.entries(selectedPlatforms)) {
                if (data.enabled) {
                    await axios.post(`${API_BASE_URL}/workers/me/platforms`, {
                        platform_type: id,
                        avg_weekly_hours: data.hours,
                        avg_weekly_earnings: data.earnings
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }
            handleNext();
        } catch (err: any) {
            setError('Linking platforms failed');
        } finally {
            setLoading(false);
        }
    };

    const onActivate = async () => {
        setLoading(true);
        const token = localStorage.getItem("surelyai_token");
        try {
            const policyRes = await axios.post(`${API_BASE_URL}/workers/me/policy`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const cycleRes = await axios.post(`${API_BASE_URL}/workers/me/weekly-cycle/start`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSummary({
                coverage: policyRes.data.max_weekly_coverage,
                premium: cycleRes.data.weekly_premium
            });
        } catch (err: any) {
            setError('Activation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface p-6 flex flex-col items-center">
            {/* Step Indicator */}
            <div className="max-w-xl w-full flex justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container -z-10 -translate-y-1/2"></div>
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white text-outline'}`}>
                        {s}
                    </div>
                ))}
            </div>

            <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 border border-surface-container">
                {error && <div className="mb-6 p-4 bg-error-container text-error rounded-xl border border-error/20 font-bold">{error}</div>}

                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-on-background headline">Create your account</h2>
                        <input className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" placeholder="Full Name" value={accountData.name} onChange={e => setAccountData({...accountData, name: e.target.value})} />
                        <input className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" placeholder="Email" value={accountData.email} onChange={e => setAccountData({...accountData, email: e.target.value})} />
                        <input className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" placeholder="Phone Number" value={accountData.phone} onChange={e => setAccountData({...accountData, phone: e.target.value})} />
                        <input className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" type="password" placeholder="Password" value={accountData.password} onChange={e => setAccountData({...accountData, password: e.target.value})} />
                        <button onClick={onSignup} disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-container transition-all shadow-md">CONTINUE</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-on-background headline">Your Profile</h2>
                            <button onClick={detectLocation} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">Detect Location</button>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-outline mb-2 uppercase tracking-widest">City</label>
                            <select className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" value={profileData.city} onChange={e => setProfileData({...profileData, city: e.target.value})}>
                                <option value="">Select City</option>
                                <option value="Chennai">Chennai</option>
                                <option value="Bangalore">Bangalore</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-outline mb-2 uppercase tracking-widest">Primary Zone</label>
                            <input className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl outline-none" placeholder="e.g. T Nagar, Koramangala" value={profileData.primary_zone} onChange={e => setProfileData({...profileData, primary_zone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-outline mb-2 uppercase tracking-widest">Work Category</label>
                            <div className="grid grid-cols-1 gap-3">
                                {['FOOD', 'GROCERY', 'ECOMMERCE'].map(t => (
                                    <label key={t} className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${profileData.persona_type === t ? 'border-primary bg-primary/5' : 'border-surface-container bg-surface'}`}>
                                        <input type="radio" name="persona" className="hidden" value={t} checked={profileData.persona_type === t} onChange={() => setProfileData({...profileData, persona_type: t})} />
                                        <span className="font-bold text-sm">{t}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button onClick={onUpdateProfile} disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-container transition-all shadow-md uppercase tracking-widest text-sm">Update Profile</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-on-background headline">Link Platforms</h2>
                        <p className="text-sm text-outline">Link at least one platform to calculate your protection limit.</p>
                        <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {PLATFORMS.map(p => {
                                const data = selectedPlatforms[p.id] || { enabled: false, hours: 0, earnings: 0 };
                                return (
                                    <div key={p.id} className={`p-4 rounded-2xl border-2 transition-all ${data.enabled ? 'border-primary bg-primary/5' : 'border-surface-container bg-white'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{p.icon}</span>
                                                <span className="font-bold">{p.label}</span>
                                            </div>
                                            <input type="checkbox" className="w-6 h-6 rounded-md accent-primary" checked={data.enabled} onChange={e => setSelectedPlatforms({...selectedPlatforms, [p.id]: {...data, enabled: e.target.checked}})} />
                                        </div>
                                        {data.enabled && (
                                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                                                <input type="number" className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm" placeholder="Weekly Hours" value={data.hours} onChange={e => setSelectedPlatforms({...selectedPlatforms, [p.id]: {...data, hours: Number(e.target.value)}})} />
                                                <input type="number" className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm" placeholder="Avg. Weekly ₹" value={data.earnings} onChange={e => setSelectedPlatforms({...selectedPlatforms, [p.id]: {...data, earnings: Number(e.target.value)}})} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={onLinkPlatforms} disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-container transition-all shadow-md uppercase tracking-widest text-sm">Next</button>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 text-center">
                        <h2 className="text-2xl font-black text-on-background headline">Review & Activate</h2>
                        {!summary ? (
                            <>
                                <div className="p-8 bg-surface rounded-3xl border-2 border-dashed border-outline-variant">
                                    <p className="text-outline text-sm italic">Ready to calculate your customized parametric policy.</p>
                                </div>
                                <button onClick={onActivate} disabled={loading} className="w-full py-4 bg-secondary text-white rounded-2xl font-bold hover:bg-secondary/90 transition-all shadow-md uppercase tracking-widest text-sm">CALCULATE & ACTIVATE</button>
                            </>
                        ) : (
                            <div className="animate-in zoom-in-95 duration-300">
                                <div className="p-8 bg-secondary/10 rounded-3xl border-2 border-secondary mb-6 relative overflow-hidden">
                                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
                                    <p className="text-secondary font-black text-xs uppercase tracking-widest mb-4">Protection Active</p>
                                    <div className="text-4xl font-black text-secondary mb-2 headline tabular-nums">₹{summary.coverage}</div>
                                    <p className="text-secondary/70 text-sm font-bold">Max weekly coverage</p>
                                    <div className="mt-8 pt-6 border-t border-secondary/20 flex justify-between items-center">
                                        <span className="text-xs font-black text-secondary/60 uppercase">Weekly Premium</span>
                                        <span className="text-xl font-black text-secondary headline tabular-nums">₹{summary.premium}</span>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-container transition-all shadow-md uppercase tracking-widest text-sm">GO TO DASHBOARD</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingWizard;
