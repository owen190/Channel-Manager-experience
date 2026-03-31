'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building2, Loader2, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      setStep(2);
      setError('');
    } else {
      setError('Please fill in all fields');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password || !formData.companyName) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Signup failed');
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
          {step === 1 ? (
            <>
              <h2 className="font-newsreader text-2xl font-bold text-gray-900 mb-1">
                Create Account
              </h2>
              <p className="text-[#999] text-[13px] mb-6">Step 1 of 2</p>

              <form onSubmit={handleStep1} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-red-700 text-[12px]">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-[12px] font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 border border-[#e8e5e1] rounded-[8px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors text-[13px] bg-[#F7F5F2]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-[12px] font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-[#e8e5e1] rounded-[8px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors text-[13px] bg-[#F7F5F2]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#157A6E] text-white rounded-[8px] font-medium text-[13px] hover:bg-[#0f6960] transition-colors"
                >
                  Continue
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="p-1 hover:bg-[#F7F5F2] rounded-[8px] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div>
                  <h2 className="font-newsreader text-2xl font-bold text-gray-900">
                    Company Details
                  </h2>
                  <p className="text-[#999] text-[13px]">Step 2 of 2</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-red-700 text-[12px]">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="companyName" className="block text-[12px] font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="companyName"
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Acme Corporation"
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
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className="w-full pl-10 pr-4 py-2.5 border border-[#e8e5e1] rounded-[8px] focus:outline-none focus:border-[#157A6E] focus:ring-1 focus:ring-[#157A6E] transition-colors text-[13px] bg-[#F7F5F2]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#157A6E] text-white rounded-[8px] font-medium text-[13px] hover:bg-[#0f6960] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          {/* Login Link */}
          <p className="text-center mt-6 text-[13px] text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-[#157A6E] font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
