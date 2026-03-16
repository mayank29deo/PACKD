'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../lib/AppContext';

const SPORTS = ['Running', 'Cycling', 'Football', 'Yoga', 'Swimming', 'CrossFit', 'Basketball', 'Tennis', 'Hiking', 'Badminton', 'Boxing'];
const AREAS = ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'JP Nagar', 'Jayanagar', 'Malleshwaram', 'Yelahanka', 'Central BLR', 'North BLR'];

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <line x1="12" y1="2.5" x2="12" y2="5"   stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="19"  x2="12" y2="21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="2.5"  y1="12" x2="5"   y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="19"   y1="12" x2="21.5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="5.1"  y1="5.1"  x2="6.9"  y2="6.9"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17.1" y1="17.1" x2="18.9" y2="18.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="5.1"  y1="18.9" x2="6.9"  y2="17.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17.1" y1="6.9"  x2="18.9" y2="5.1"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser, logout, theme, setTheme } = useApp();
  const [form, setForm] = useState({
    name: user.name,
    username: user.username,
    bio: user.bio || '',
    area: user.area || '',
    sports: user.sports || [],
  });
  const [saved, setSaved] = useState(false);

  function update(k, v) { setForm((p) => ({ ...p, [k]: v })); }
  function toggleSport(s) {
    setForm((p) => ({
      ...p,
      sports: p.sports.includes(s) ? p.sports.filter((x) => x !== s) : [...p.sports, s],
    }));
  }

  function handleSave() {
    updateUser(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogout() {
    logout();
    router.push('/auth/login');
  }



  return (
    <div className="min-h-screen bg-packd-bg pb-10">
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur border-b border-packd-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-packd-gray hover:text-packd-text text-xl">←</button>
          <h1 className="text-lg font-black text-white flex-1">Settings</h1>
          <button
            onClick={handleSave}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${saved ? 'bg-packd-green text-packd-bg' : 'packd-btn-primary'}`}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile section */}
        <div>
          <h2 className="text-xs font-bold text-packd-gray uppercase tracking-widest mb-3">Profile</h2>
          <div className="packd-card p-4 space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-packd-orange flex items-center justify-center text-2xl font-black text-white">
                {form.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{form.name || 'Your Name'}</p>
                <p className="text-xs text-packd-gray">@{form.username}</p>
                <button className="text-xs text-packd-orange mt-1 hover:underline">Change avatar</button>
              </div>
            </div>

            <div>
              <label className="text-xs text-packd-gray mb-1 block">Display Name</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full bg-packd-bg border border-packd-border rounded-xl px-4 py-2.5 text-sm text-packd-text focus:outline-none focus:border-packd-orange transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-packd-gray mb-1 block">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-packd-gray text-sm">@</span>
                <input
                  value={form.username}
                  onChange={(e) => update('username', e.target.value)}
                  className="w-full bg-packd-bg border border-packd-border rounded-xl pl-8 pr-4 py-2.5 text-sm text-packd-text focus:outline-none focus:border-packd-orange transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-packd-gray mb-1 block">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="Tell people about your athletic journey…"
                rows={2}
                className="w-full bg-packd-bg border border-packd-border rounded-xl px-4 py-2.5 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="text-xs font-bold text-packd-gray uppercase tracking-widest mb-3">Location</h2>
          <div className="packd-card p-4">
            <p className="text-xs text-packd-gray mb-3">Your area in Bangalore</p>
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map((a) => (
                <button
                  key={a}
                  onClick={() => update('area', a)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                    form.area === a ? 'bg-packd-orange border-packd-orange text-white' : 'bg-packd-bg border-packd-border text-packd-gray hover:border-packd-orange'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sports */}
        <div>
          <h2 className="text-xs font-bold text-packd-gray uppercase tracking-widest mb-3">My Sports</h2>
          <div className="packd-card p-4">
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSport(s)}
                  className={form.sports.includes(s) ? 'sport-pill-active' : 'sport-pill'}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h2 className="text-xs font-bold text-packd-gray uppercase tracking-widest mb-3">Appearance</h2>
          <div className="packd-card p-4 space-y-4">
            <p className="text-sm font-semibold text-white">Theme</p>

            {/* PACKD theme row */}
            <div>
              <p className="text-xs text-packd-gray mb-2 font-medium">PACKD <span className="opacity-50">— orange & black</span></p>
              <div className="flex gap-2">
                {/* PACKD Dark */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 rounded-xl border-2 overflow-hidden transition-all ${
                    theme === 'dark' ? 'border-[#E8451A]' : 'border-packd-border'
                  }`}
                >
                  <div className="h-10 bg-[#0d1117] flex items-center justify-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#E8451A]"/>
                    <span className="w-8 h-1.5 rounded bg-[#E8451A]/40"/>
                  </div>
                  <div className={`py-1.5 text-xs font-semibold text-center transition-colors ${
                    theme === 'dark' ? 'text-[#E8451A] bg-[#E8451A]/10' : 'text-packd-gray bg-packd-card2'
                  }`}>
                    <MoonIcon /> Dark
                  </div>
                </button>
                {/* PACKD Light */}
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 rounded-xl border-2 overflow-hidden transition-all ${
                    theme === 'light' ? 'border-[#E8451A]' : 'border-packd-border'
                  }`}
                >
                  <div className="h-10 bg-[#F7F3EF] flex items-center justify-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#E8451A]"/>
                    <span className="w-8 h-1.5 rounded bg-[#E8451A]/40"/>
                  </div>
                  <div className={`py-1.5 text-xs font-semibold text-center transition-colors ${
                    theme === 'light' ? 'text-[#E8451A] bg-[#E8451A]/10' : 'text-packd-gray bg-packd-card2'
                  }`}>
                    <SunIcon /> Light
                  </div>
                </button>
              </div>
            </div>

            {/* Forest theme row */}
            <div>
              <p className="text-xs text-packd-gray mb-2 font-medium flex items-center gap-1.5">
                Forest <span className="opacity-50">— green & black</span>
                <span className="text-[10px] bg-packd-orange/15 text-packd-orange px-1.5 py-0.5 rounded-full font-bold">BETA</span>
              </p>
              <div className="flex gap-2">
                {/* Forest Dark */}
                <button
                  onClick={() => setTheme('forest-dark')}
                  className={`flex-1 rounded-xl border-2 overflow-hidden transition-all ${
                    theme === 'forest-dark' ? 'border-[#00d563]' : 'border-packd-border'
                  }`}
                >
                  <div className="h-10 bg-[#08120a] flex items-center justify-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#00d563]"/>
                    <span className="w-8 h-1.5 rounded bg-[#00d563]/40"/>
                  </div>
                  <div className={`py-1.5 text-xs font-semibold text-center transition-colors ${
                    theme === 'forest-dark' ? 'text-[#00d563] bg-[#00d563]/10' : 'text-packd-gray bg-packd-card2'
                  }`}>
                    <MoonIcon /> Dark
                  </div>
                </button>
                {/* Forest Light */}
                <button
                  onClick={() => setTheme('forest-light')}
                  className={`flex-1 rounded-xl border-2 overflow-hidden transition-all ${
                    theme === 'forest-light' ? 'border-[#00aa4b]' : 'border-packd-border'
                  }`}
                >
                  <div className="h-10 bg-[#eefaf1] flex items-center justify-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#00aa4b]"/>
                    <span className="w-8 h-1.5 rounded bg-[#00aa4b]/40"/>
                  </div>
                  <div className={`py-1.5 text-xs font-semibold text-center transition-colors ${
                    theme === 'forest-light' ? 'text-[#00aa4b] bg-[#00aa4b]/10' : 'text-packd-gray bg-packd-card2'
                  }`}>
                    <SunIcon /> Light
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-xs font-bold text-packd-gray uppercase tracking-widest mb-3">Notifications</h2>
          <div className="packd-card divide-y divide-packd-border">
            {[
              { label: 'Event reminders', desc: '24 hours before your RSVP\'d events' },
              { label: 'Pack activity', desc: 'New posts from your packs' },
              { label: 'XP milestones', desc: 'Level ups and badge unlocks' },
              { label: 'Challenge updates', desc: 'Weekly challenge progress' },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-packd-gray">{desc}</p>
                </div>
                <div className="w-10 h-6 bg-packd-orange rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div>
          <h2 className="text-xs font-bold text-packd-gray uppercase tracking-widest mb-3">Account</h2>
          <div className="packd-card divide-y divide-packd-border">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-white">Email</p>
              <p className="text-xs text-packd-gray">{user.email}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-white">Plan</p>
              <p className="text-xs text-packd-orange font-semibold">Free · Upgrade to Pro →</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3.5 text-sm font-semibold text-red-400 border border-red-400/30 rounded-xl hover:bg-red-400/10 transition-colors"
        >
          Sign Out
        </button>

        <p className="text-center text-xs text-packd-gray">PACKD v0.1.0 · Bangalore, India</p>
      </div>
    </div>
  );
}
