import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Shield, User, Lock } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuthContext } from '../../context/AuthContext';
import type { UserRole } from '../../types';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'authority', label: 'Authority' },
  { value: 'field_officer', label: 'Field Officer' },
  { value: 'citizen', label: 'Citizen' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthContext();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('authority');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(identifier || 'demo@bhushakti.ai', password || 'demo', role);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  };

  return (
    <AuthLayout>
      <main className="w-full max-w-[390px] mx-auto flex flex-col items-center gap-6">
        {/* Logo / Header */}
        <header className="flex flex-col items-center text-center gap-2 w-full">
          <div className="w-28 h-28 mb-2 rounded-xl overflow-hidden shadow-lg">
            {/* BHUSHAKTI AI official logo */}
            <img
              src="/bhushakti-logo.png"
              alt="BHUSHAKTI AI"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-primary leading-tight">BHUSHAKTI AI</h1>
          <p className="text-body-md text-on-surface-variant">Landslide Intelligence &amp; Early Warning</p>
        </header>

        {/* Role selection — matches Stitch radio pill design */}
        <section className="w-full" aria-label="Select User Role">
          <div className="flex flex-wrap justify-center gap-2">
            {ROLES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`px-4 py-2 rounded-full border text-[12px] font-semibold tracking-wider transition-colors ${
                  role === value
                    ? 'bg-primary-container text-on-primary-container border-primary/40'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Login form — matches Stitch login design */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-surface-container p-4 rounded-xl border border-outline-variant shadow-lg flex flex-col gap-4"
        >
          {/* Email / Mobile */}
          <div className="flex flex-col gap-1">
            <label className="text-label-md text-on-surface-variant" htmlFor="identifier">
              Email or Mobile Number
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or mobile"
                className="w-full h-12 pl-10 pr-4 bg-surface-bright border border-outline rounded-lg text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-label-md text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-label-sm text-primary hover:text-primary-fixed transition-colors">
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-12 pl-10 pr-10 bg-surface-bright border border-outline rounded-lg text-on-surface text-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-label-sm text-error bg-error-container/20 px-3 py-2 rounded-lg border border-error-container/50">
              {error}
            </p>
          )}

          {/* Sign in button — white bg with navy text (Stitch style) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-on-background text-background text-label-md uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center gap-2 font-semibold disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full" />
            ) : (
              <>
                SIGN IN
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo hint */}
        <p className="text-label-sm text-outline text-center">
          Demo: Use any email + password to sign in
        </p>

        {/* Footer */}
        <footer className="text-center w-full">
          <p className="text-label-sm text-outline-variant flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Secure Institutional Access
          </p>
        </footer>
      </main>
    </AuthLayout>
  );
}
