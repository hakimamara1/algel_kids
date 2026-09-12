import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import adminApi, { apiErrorMessage } from '../lib/adminApi';
import { setAdminToken } from '../lib/adminToken';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Only return to admin pages, never to an outside address
    const next = searchParams.get('next');
    const target = next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await adminApi.post('/admin/login', { password });
            setAdminToken(data.token);
            navigate(target, { replace: true });
        } catch (err) {
            setError(apiErrorMessage(err, 'Could not log in. Check your connection and try again.'));
            setLoading(false);
        }
    };

    return (
        <div dir="ltr" className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin login</h1>
                    <p className="text-sm text-gray-500 mt-1">Enter the dashboard password.</p>
                </div>
                <div>
                    <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                    />
                </div>
                {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                    {loading ? 'Logging in…' : 'Log in'}
                </button>
            </form>
        </div>
    );
};

export default AdminLogin;
