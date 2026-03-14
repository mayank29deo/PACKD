'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useApp } from '../../../lib/AppContext';

const FLOATING_STATS = [
  { emoji: '🏃', text: '12K+ athletes', color: 'bg-packd-orange/20 border-packd-orange/30' },
  { emoji: '📅', text: '2.8K events/mo', color: 'bg-blue-400/20 border-blue-400/30' },
  { emoji: '👥', text: '340+ packs', color: 'bg-packd-green/20 border-packd-green/30' },
  { emoji: '⚡', text: 'Earn XP daily', color: 'bg-packd-gold/20 border-packd-gold/30' },
];

const SPORT_PILLS = ['🏃 Running', '🚴 Cycling', '🧘 Yoga', '⚽ Football', '🏊 Swimming', '💪 CrossFit', '🥾 Hiking', '🏀 Basketball', '🏸 Badminton', '🥊 Boxing', '🎾 Tennis'];

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { login, updateUser } = useApp();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  // If already signed in via NextAuth, sync to AppContext and redirect
  useEffect(() => {
    if (session?.user) {
      login(session.user.email, session.user.name);
      if (session.user.image) updateUser({ googleAvatar: session.user.image });
      router.push('/feed');
    }
  }, [session]);

  async function handleGoogle() {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signIn('google', { callbackUrl: '/feed', redirect: true });
      // If redirect: true, next-auth handles the redirect
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid credentials. Try again.');
        setLoading(false);
      } else {
        login(form.email);
        router.push('/feed');
      }
    } catch {
      setError('Sign in failed. Please try again.');
      setLoading(false);
    }
  }

  function handleGuest() {
    setLoading(true);
    login('demo@packd.app', 'Demo Athlete');
    setTimeout(() => router.push('/feed'), 400);
  }

  const busy = loading || googleLoading;

  return (
    <div className="min-h-screen bg-packd-bg overflow-hidden relative flex flex-col">
      {/* Animated bg glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(ellipse, #E8451A 0%, transparent 65%)' }} />
        <div className="absolute -bottom-20 right-0 w-[250px] h-[250px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3fb950 0%, transparent 70%)' }} />
      </div>

      {/* Scrolling sport ticker */}
      <div className="absolute top-0 left-0 right-0 h-12 overflow-hidden pointer-events-none z-0 flex items-center">
        <div className="flex gap-3 whitespace-nowrap" style={{ animation: 'marquee 22s linear infinite' }}>
          {[...SPORT_PILLS, ...SPORT_PILLS].map((s, i) => (
            <span key={i} className="inline-flex items-center bg-packd-card/80 border border-packd-border/60 rounded-full px-3 py-1 text-[11px] text-packd-gray/70 flex-shrink-0">{s}</span>
          ))}
        </div>
      </div>

      <div className={`relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/"><h1 className="text-5xl font-black text-white tracking-tighter">PACK<span className="text-packd-orange">D</span></h1></Link>
          <p className="text-packd-gray text-sm mt-1">Find your pack. Own your sport.</p>
          <div className="inline-flex items-center gap-2 mt-3 bg-packd-card border border-packd-border rounded-full px-4 py-1.5 text-xs text-packd-gray">
            <span className="w-2 h-2 rounded-full bg-packd-green" style={{ animation: 'pulse-dot 1.5s infinite' }} />
            847 athletes active right now in Bangalore
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Google Sign In */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold text-sm py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-[0_4px_24px_rgba(0,0,0,0.3)] mb-4 hover:shadow-[0_4px_32px_rgba(232,69,26,0.25)] disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-gray-300 border-t-packd-orange rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
                Connecting to Google…
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-packd-border" />
            <span className="text-[11px] text-packd-gray/70">or email</span>
            <div className="flex-1 h-px bg-packd-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 mb-3">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 text-center">{error}</div>
            )}
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-packd-gray text-sm">✉</span>
              <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com"
                className="w-full bg-packd-card border border-packd-border rounded-2xl pl-10 pr-4 py-3.5 text-sm text-packd-text placeholder-packd-gray/60 focus:outline-none focus:border-packd-orange transition-colors" />
            </div>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-packd-gray text-sm">🔒</span>
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Password"
                className="w-full bg-packd-card border border-packd-border rounded-2xl pl-10 pr-11 py-3.5 text-sm text-packd-text placeholder-packd-gray/60 focus:outline-none focus:border-packd-orange transition-colors" />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-packd-gray hover:text-packd-text text-sm transition-colors">
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            <button type="submit" disabled={busy}
              className="w-full bg-packd-orange hover:bg-packd-orange-light text-white font-bold py-3.5 text-sm rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ boxShadow: '0 4px 20px rgba(232,69,26,0.35)' }}>
              {loading && !googleLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="flex items-center justify-between mb-4">
            <button className="text-xs text-packd-gray hover:text-packd-orange transition-colors">Forgot password?</button>
            <Link href="/auth/signup" className="text-xs text-packd-orange font-bold hover:underline">Create account →</Link>
          </div>

          <button onClick={handleGuest} disabled={busy}
            className="w-full py-3 text-xs text-packd-gray/70 border border-packd-border/60 rounded-2xl hover:border-packd-orange/50 hover:text-packd-gray transition-all disabled:opacity-40">
            👀 Just browsing — enter as guest
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-8">
          {FLOATING_STATS.map(({ emoji, text, color }) => (
            <div key={text} className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 ${color}`}>
              <span className="text-base">{emoji}</span>
              <span className="text-xs text-packd-text font-semibold">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 text-center pb-5">
        <p className="text-[10px] text-packd-gray/40">By continuing you agree to our Terms & Privacy Policy</p>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
