import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { setToken, setRole } from '../utils/auth';

import { API_BASE_URL } from '../config';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('username', email); // FastAPI OAuth2 uses 'username'
            formData.append('password', password);

            const response = await axios.post(`${API_BASE_URL}/auth/login`, formData);
            const { access_token } = response.data;
            
            setToken(access_token);
            
            // Fetch user info to determine role
            const meResponse = await axios.get(`${API_BASE_URL}/workers/me`, {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            
            const role = meResponse.data.role;
            setRole(role);

            if (role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center">
                   <span className="text-white font-black text-xl">S</span>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-on-background headline">
                    Welcome back to SurelyAI
                </h2>
                <p className="mt-2 text-sm text-outline">
                    Secure parametric protection for your livelihood
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-surface-container">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-error-container text-error text-sm p-3 rounded-xl border border-error/20">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
                            >
                                {loading ? 'SIGNING IN...' : 'SIGN IN'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-outline-variant"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-outline">New to SurelyAI?</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link 
                                to="/onboarding"
                                className="text-primary font-bold hover:text-primary-container transition-colors"
                            >
                                Get Protected Now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
