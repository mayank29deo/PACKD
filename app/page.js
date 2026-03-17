'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SPORTS = ['Running', 'Cycling', 'Yoga', 'Swimming', 'Football', 'Basketball', 'Tennis', 'Hiking', 'CrossFit', 'Badminton', 'Volleyball', 'Boxing'];

const STATS = [
  { value: '12K+', label: 'Athletes', icon: '🏃' },
  { value: '340+', label: 'Packs Active', icon: '👥' },
  { value: '2.8K+', label: 'Events/Month', icon: '📅' },
  { value: '98', label: 'Areas', icon: '📍' },
];

const FEATURES = [
  { icon: '⚡', title: 'Find Your Pack', desc: 'Join sport-specific communities that match your level, schedule, and vibe. No more solo grind.', color: 'from-packd-orange/20 to-transparent' },
  { icon: '📅', title: 'Plan & Execute', desc: 'Create or join events in minutes. Venues, timings, RSVPs — all handled inside the app.', color: 'from-blue-400/20 to-transparent' },
  { icon: '🏆', title: 'Earn & Celebrate', desc: 'Log activities, collect badges, climb leaderboards. Every rep counts toward your legacy.', color: 'from-packd-gold/20 to-transparent' },
  { icon: '📍', title: 'Discover Venues', desc: 'Curated map of courts, grounds, gyms, and trails — community-rated.', color: 'from-packd-green/20 to-transparent' },
  { icon: '👆', title: 'Swipe to Discover', desc: 'Tinder-style event discovery. Swipe right to join, left to skip. Never miss events that matter.', color: 'from-pink-400/20 to-transparent' },
  { icon: '🔥', title: 'Streaks & XP', desc: 'Stay consistent with streak tracking and XP. The more you move, the more you level up.', color: 'from-red-400/20 to-transparent' },
];

// Live activity ticker data
const LIVE_ACTIVITIES = [
  { user: 'Arjun M.', action: 'just completed a 10K run', sport: '🏃', xp: '+280 XP', color: 'text-packd-orange' },
  { user: 'Priya S.', action: 'joined Koramangala Runners', sport: '👥', xp: '+50 XP', color: 'text-packd-green' },
  { user: 'Rahul K.', action: 'RSVP\'d to Nandi Hills Ride', sport: '🚴', xp: '+50 XP', color: 'text-blue-400' },
  { user: 'Sneha M.', action: 'hit Level 8 · Pack Alpha', sport: '⚡', xp: '🎉', color: 'text-packd-gold' },
  { user: 'Vikram N.', action: 'created a new football event', sport: '⚽', xp: '+200 XP', color: 'text-packd-green' },
  { user: 'Ananya T.', action: 'earned the Early Bird badge', sport: '🌄', xp: '🏅', color: 'text-packd-gold' },
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % LIVE_ACTIVITIES.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const activity = LIVE_ACTIVITIES[idx];

  return (
    <div className="flex items-center gap-2 bg-packd-card border border-packd-border rounded-full px-4 py-2 text-xs overflow-hidden max-w-sm mx-auto"
      style={{ transition: 'opacity 0.3s', opacity: visible ? 1 : 0 }}>
      <span className="w-2 h-2 rounded-full bg-packd-green flex-shrink-0" style={{ animation: 'pulse-dot 1.5s infinite' }} />
      <span className="text-sm">{activity.sport}</span>
      <span className="text-white font-semibold truncate">{activity.user}</span>
      <span className="text-packd-gray truncate">{activity.action}</span>
      <span className={`font-bold flex-shrink-0 ${activity.color}`}>{activity.xp}</span>
    </div>
  );
}

function CounterStat({ value, label, icon, delay }) {
  const [displayed, setDisplayed] = useState('0');
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        setTimeout(() => setDisplayed(value), delay);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, delay]);

  return (
    <div ref={ref} className="text-center group">
      <p className="text-sm mb-1">{icon}</p>
      <p className="text-3xl md:text-4xl font-black text-gradient transition-all duration-500">{displayed}</p>
      <p className="text-xs text-packd-gray mt-1">{label}</p>
    </div>
  );
}

const HERO_DESCS = [
  'The operating system for your active life. Discover athletes, join packs, plan events, swipe through opportunities — one app for every sport, every level.',
  'Track calories effortlessly — snap a photo of your meal or record your voice and let AI analyse it instantly. Smart insights to fuel your performance.',
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [activeSport, setActiveSport] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [descIdx, setDescIdx] = useState(0);
  const [descVisible, setDescVisible] = useState(true);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDescVisible(false);
      setTimeout(() => {
        setDescIdx((i) => (i + 1) % HERO_DESCS.length);
        setDescVisible(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Redirect signed-in users straight to the feed
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/feed');
    }
  }, [status, router]);

  // Show nothing while checking session to avoid flash of landing page
  if (status === 'loading' || status === 'authenticated') return null;

  function handleJoin(e) {
    e.preventDefault();
    if (email) setJoined(true);
  }

  return (
    <div className="min-h-screen bg-packd-bg text-packd-text font-sans overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-packd-bg/90 backdrop-blur-md border-b border-packd-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-black text-white tracking-tight">
            PACK<span className="text-packd-orange">D</span>
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm text-packd-gray">
            <a href="#features" className="hover:text-packd-text transition-colors">Features</a>
            <a href="#sports" className="hover:text-packd-text transition-colors">Sports</a>
            <a href="#pricing" className="hover:text-packd-text transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-packd-gray hover:text-packd-text transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/auth/signup" className="packd-btn-primary px-4 py-2 text-sm">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden">
        {/* Animated glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(232,69,26,0.18) 0%, transparent 65%)', animation: 'glow-pulse 4s ease-in-out infinite' }} />
        <div className="absolute top-40 -right-20 w-[300px] h-[300px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(63,185,80,0.08) 0%, transparent 70%)' }} />

        <div className={`relative max-w-4xl mx-auto text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Live ticker */}
          <div className="mb-6">
            <LiveTicker />
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.0] tracking-tight mb-6">
            Find Your Pack.{' '}
            <span className="text-gradient">Own Your Sport.</span>
          </h1>

          <p className="text-lg md:text-xl text-packd-gray max-w-2xl mx-auto leading-relaxed mb-8 min-h-[3.5rem] flex items-center justify-center"
            style={{ transition: 'opacity 0.5s ease', opacity: descVisible ? 1 : 0 }}>
            {HERO_DESCS[descIdx]}
          </p>

          {/* Sport pills — interactive */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {SPORTS.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSport(activeSport === s ? null : s)}
                className={`transition-all duration-200 ${activeSport === s ? 'sport-pill-active scale-105' : 'sport-pill hover:scale-105'}`}
              >
                {s}
              </button>
            ))}
          </div>
          {activeSport && (
            <div className="mb-6 text-sm text-packd-gray animate-slide-up">
              <span className="text-packd-orange font-bold">24 events</span> and <span className="text-packd-orange font-bold">3 packs</span> for {activeSport} near Koramangala this weekend →
            </div>
          )}

          {/* Waitlist form */}
          <form id="waitlist" onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
            {!joined ? (
              <>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-packd-card border border-packd-border rounded-2xl px-4 py-3.5 text-packd-text placeholder-packd-gray text-sm focus:outline-none focus:border-packd-orange transition-colors"
                  required
                />
                <button type="submit" className="packd-btn-primary px-6 py-3.5 text-sm whitespace-nowrap rounded-2xl"
                  style={{ boxShadow: '0 4px 20px rgba(232,69,26,0.35)' }}>
                  Get Early Access →
                </button>
              </>
            ) : (
              <div className="flex-1 bg-packd-card border border-packd-green rounded-2xl px-4 py-3.5 text-packd-green text-sm text-center font-semibold animate-slide-up">
                ✓ You're on the list! We'll notify you when it's your turn.
              </div>
            )}
          </form>
          <div className="flex items-center justify-center gap-4 text-xs text-packd-gray">
            <span>No spam</span>
            <span>·</span>
            <span>Free Pro for 3 months</span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/auth/signup"
              className="packd-btn-primary px-8 py-4 text-base rounded-2xl inline-flex items-center gap-2"
              style={{ boxShadow: '0 4px 24px rgba(232,69,26,0.4)' }}>
              🚀 Join for Free
            </Link>
            <Link href="/feed"
              className="packd-btn-ghost px-8 py-4 text-base rounded-2xl inline-flex items-center gap-2">
              👀 Preview the app →
            </Link>
          </div>
        </div>

        {/* App mockup preview */}
        <div className={`relative max-w-5xl mx-auto mt-16 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="bg-packd-card border border-packd-border rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(232,69,26,0.15)' }}>
            {/* Browser chrome */}
            <div className="bg-packd-card2 border-b border-packd-border px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-packd-gold/60" />
                <div className="w-3 h-3 rounded-full bg-packd-green/60" />
              </div>
              <div className="flex-1 bg-packd-bg rounded-full h-7 flex items-center px-4">
                <span className="text-xs text-packd-gray">packd.app/feed</span>
              </div>
            </div>

            {/* Mock app UI */}
            <div className="grid grid-cols-3 gap-4 p-6">
              <div className="col-span-2 space-y-3">
                {/* Swipe UI preview */}
                <div className="packd-card p-4 border-packd-orange/40">
                  <div className="text-xs text-packd-orange font-bold mb-2">👆 DISCOVER EVENTS · SWIPE</div>
                  <div className="bg-packd-card2 rounded-2xl p-3 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-packd-orange bg-packd-orange/10 px-2 py-0.5 rounded-full">Running</span>
                      <span className="text-xs text-packd-green font-bold">Free</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Sunday Long Run @ Cubbon</p>
                    <p className="text-[10px] text-packd-gray">Sun 7 AM · 12 km · 22/30 going</p>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <div className="w-9 h-9 rounded-full border-2 border-red-400/50 flex items-center justify-center text-lg">✗</div>
                    <div className="w-9 h-9 rounded-full border-2 border-packd-green/50 flex items-center justify-center text-lg">✓</div>
                  </div>
                </div>
                {/* Community post */}
                <div className="packd-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-packd-orange flex items-center justify-center text-xs font-bold text-white">A</div>
                    <div>
                      <p className="text-xs font-bold text-white">Arjun M.</p>
                      <p className="text-[10px] text-packd-gray">Running · 23m ago</p>
                    </div>
                    <span className="ml-auto text-xs text-packd-orange font-bold">+420 XP</span>
                  </div>
                  <p className="text-xs text-packd-text mb-2">New PB! 10K in 45:22 🔥 The 5AM crew never disappoints.</p>
                  <div className="flex gap-3 text-[10px] text-packd-gray">
                    <span>❤️ 47</span><span>💬 12</span><span>↗ Share</span>
                  </div>
                </div>
              </div>
              {/* Sidebar */}
              <div className="space-y-3">
                <div className="packd-card p-3">
                  <p className="text-[10px] text-packd-gray mb-1">Your XP</p>
                  <p className="text-xl font-black text-white">2,840</p>
                  <p className="text-[10px] text-packd-orange mb-2">Level 7 · Trailblazer</p>
                  <div className="xp-bar"><div className="xp-fill" style={{ width: '68%' }} /></div>
                </div>
                <div className="packd-card p-3">
                  <p className="text-[10px] text-packd-gray mb-1">Streak</p>
                  <p className="text-2xl font-black text-packd-orange">14🔥</p>
                </div>
                <div className="packd-card p-3">
                  <p className="text-[10px] text-packd-gray mb-2">Your Pack</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🏃</span>
                    <p className="text-[10px] font-bold text-white">Koramangala Runners</p>
                  </div>
                  <p className="text-[10px] text-packd-gray mt-0.5">312 members · 22🔥</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6 border-y border-packd-border bg-packd-card2/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label, icon }, i) => (
            <CounterStat key={label} value={value} label={label} icon={icon} delay={i * 100} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-packd-orange text-sm font-bold tracking-widest uppercase mb-3">The Platform</p>
            <h2 className="text-4xl md:text-5xl font-black text-white">Everything your active life needs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon, title, desc, color }) => (
              <div key={title} className={`packd-card card-hover p-6 bg-gradient-to-br ${color}`}>
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-packd-gray leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPORTS */}
      <section id="sports" className="py-24 px-6 bg-packd-card2">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-3">Sport-agnostic by design</h2>
          <p className="text-packd-gray mb-10">From elite runners to casual weekend warriors — there's a pack for everyone.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[...SPORTS, 'Martial Arts', 'Rock Climbing', 'Skating', 'Frisbee', 'Rugby', 'Cricket', 'Table Tennis', 'Pilates'].map((s) => (
              <span key={s} className="sport-pill cursor-default hover:border-packd-orange hover:text-packd-orange">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-3">Simple, athlete-first pricing</h2>
            <p className="text-packd-gray">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { plan: 'Free', price: '₹0', desc: 'Forever', features: ['3 pack memberships', '10 events/month', 'Basic activity log', 'Community feed', 'Event swipe discovery'], cta: 'Get Started', highlight: false },
              { plan: 'Pro', price: '₹199', desc: '/month', features: ['Unlimited packs', 'Unlimited events', 'Advanced analytics', 'Priority RSVP', 'No ads'], cta: 'Go Pro', highlight: false },
              { plan: 'Elite', price: '₹499', desc: '/month', features: ['Everything in Pro', 'Pack management tools', 'Venue priority booking', 'Coaching marketplace', 'Custom badges'], cta: 'Go Elite', highlight: true },
              { plan: 'Pack Pro', price: '₹999', desc: '/month', features: ['Team of 10', 'Pack leaderboards', 'Branded pack page', 'Event sponsorship', 'Analytics dashboard'], cta: 'For Teams', highlight: false },
            ].map(({ plan, price, desc, features, cta, highlight }) => (
              <div key={plan} className={`packd-card p-6 flex flex-col transition-all hover:-translate-y-1 ${highlight ? 'border-packd-orange' : ''}`}
                style={highlight ? { boxShadow: '0 0 30px rgba(232,69,26,0.2)' } : {}}>
                {highlight && <div className="text-xs text-packd-orange font-bold mb-3 tracking-widest">⭐ MOST POPULAR</div>}
                <h3 className="text-lg font-bold text-white mb-1">{plan}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">{price}</span>
                  <span className="text-packd-gray text-sm"> {desc}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="text-xs text-packd-gray flex items-start gap-2">
                      <span className="text-packd-green mt-0.5 flex-shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup"
                  className={`text-center py-2.5 text-sm rounded-xl transition-all ${highlight ? 'packd-btn-primary' : 'packd-btn-ghost'}`}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 bg-card-gradient">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Ready to find your pack?</h2>
          <p className="text-packd-gray mb-8">Join 12,000+ athletes already on the waitlist. Bangalore's most active sports community is forming right now.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup"
              className="packd-btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base rounded-2xl"
              style={{ boxShadow: '0 4px 24px rgba(232,69,26,0.4)' }}>
              🚀 Join for Free
            </Link>
            <Link href="/auth/login" className="packd-btn-ghost inline-flex items-center justify-center px-8 py-4 text-base rounded-2xl">
              Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-packd-border py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-black text-white">PACK<span className="text-packd-orange">D</span></span>
          <p className="text-xs text-packd-gray">© 2026 PACKD · Find Your Pack. Own Your Sport. · Bangalore, India</p>
          <div className="flex gap-6 text-xs text-packd-gray">
            <a href="#" className="hover:text-packd-text">Privacy</a>
            <a href="#" className="hover:text-packd-text">Terms</a>
            <a href="#" className="hover:text-packd-text">Contact</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.28; transform: scale(1.05); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
