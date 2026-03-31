'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/onboarding');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <h1 className="font-newsreader text-4xl font-bold text-[#157A6E] mb-2">
            Channel Companion
          </h1>
          <p className="text-[#999] text-sm font-medium">Partner Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[10px] border border-[#e8e5e1] p-8 shadow-sm">
          <h2 className="font-newsreader text-2xl font-bold text-gray-900 mb-6">
            Sign In
          </h2>

          {/* Google OAuth Button */}
          <button
            className="w-full py-2.5 px-4 border border-[#e8e5e1] rounded-[8px] flex items-center justify-center gap-3 hover:bg-[#F7F5F2] transition-colors mb-6 text-[13px] font-medium text-gray-700"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e8e5e1]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white text-[#999]">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-red-700 text-[12px]">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#e8e5e1] rounded-[8px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors text-[13px] bg-[#F7F5F2]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[12px] font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo123"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#e8e5e1] rounded-[8px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors text-[13px] bg-[#F7F5F2]"
                />
              </div>
              <p className="text-[11px] text-[#999] mt-1">Demo password: demo123</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#157A6E] text-white rounded-[8px] font-medium text-[13px] hover:bg-[#0f6960] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Signup Link */}
          <p className="text-center mt-6 text-[13px] text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-[#157A6E] font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
