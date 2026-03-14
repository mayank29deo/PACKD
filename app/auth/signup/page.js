'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../../lib/AppContext';

const SPORTS = ['Running', 'Cycling', 'Football', 'Yoga', 'Swimming', 'CrossFit', 'Basketball', 'Tennis', 'Hiking', 'Badminton', 'Boxing', 'Other'];

export default function SignupPage() {
  const router = useRouter();
  const { login, updateUser } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', sports: [], area: '' });
  const [loading, setLoading] = useState(false);

  function update(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  function toggleSport(s) {
    setForm((p) => ({
      ...p,
      sports: p.sports.includes(s) ? p.sports.filter((x) => x !== s) : [...p.sports, s],
    }));
  }

  function handleFinish() {
    setLoading(true);
    setTimeout(() => {
      login(form.email, form.name);
      updateUser({ name: form.name, sports: form.sports.length ? form.sports : ['Running'], area: form.area || 'Bangalore' });
      router.push('/feed');
    }, 800);
  }

  return (
    <div className="min-h-screen bg-packd-bg flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-white tracking-tight">
            PACK<span className="text-packd-orange">D</span>
          </Link>
          <p className="text-packd-gray text-sm mt-2">Join 12,000+ athletes in Bangalore</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-packd-orange' : 'bg-packd-border'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white mb-1">Create your account</h2>
            <div>
              <label className="text-xs text-packd-gray mb-1.5 block">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Your name"
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-packd-gray mb-1.5 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-packd-gray mb-1.5 block">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors"
              />
            </div>
            <button
              onClick={() => { if (form.name && form.email && form.password) setStep(1); }}
              className="w-full packd-btn-primary py-3.5 text-sm mt-2"
            >
              Continue →
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-black text-white mb-1">Pick your sports</h2>
            <p className="text-packd-gray text-sm mb-5">We'll show you relevant events and packs.</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {SPORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSport(s)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    form.sports.includes(s)
                      ? 'bg-packd-orange border-packd-orange text-white'
                      : 'bg-packd-card border-packd-border text-packd-gray hover:border-packd-orange'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={form.sports.length === 0}
              className="w-full packd-btn-primary py-3.5 text-sm disabled:opacity-50"
            >
              Continue ({form.sports.length} selected) →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white mb-1">Where in Bangalore?</h2>
            <p className="text-packd-gray text-sm mb-4">Find events and packs near you.</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'JP Nagar', 'Jayanagar', 'Malleshwaram', 'Yelahanka'].map((a) => (
                <button
                  key={a}
                  onClick={() => update('area', a)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                    form.area === a
                      ? 'bg-packd-orange border-packd-orange text-white'
                      : 'bg-packd-card border-packd-border text-packd-gray hover:border-packd-orange'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <button
              disabled={loading}
              onClick={handleFinish}
              className="w-full packd-btn-primary py-3.5 text-sm orange-glow disabled:opacity-60"
            >
              {loading ? 'Creating account…' : '🚀 Find My Pack →'}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-packd-gray mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-packd-orange font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
