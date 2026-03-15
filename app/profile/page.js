'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp, SPORT_COLORS } from '../../lib/AppContext';
import BottomNav from '../../components/BottomNav';

const ALL_BADGES = [
  { id: 1, icon: '🏃', name: 'First 5K', desc: 'Completed your first 5K run', earned: true },
  { id: 2, icon: '🔥', name: 'Week Warrior', desc: '7-day activity streak', earned: true },
  { id: 3, icon: '🤝', name: 'Pack Founder', desc: 'Created your first pack', earned: true },
  { id: 4, icon: '⚡', name: 'Speed Demon', desc: 'Sub-5:00/km pace achieved', earned: true },
  { id: 5, icon: '🌄', name: 'Early Bird', desc: '10 workouts before 7 AM', earned: true },
  { id: 6, icon: '💯', name: '100K Club', desc: 'Run 100K in a month', earned: false },
  { id: 7, icon: '🏆', name: 'Podium', desc: 'Top 3 in pack leaderboard', earned: false },
  { id: 8, icon: '🌍', name: 'Explorer', desc: 'Train in 10 different venues', earned: false },
];

const PROFILE_TABS = ['Activity', 'Badges', 'Stats', 'Nutrition'];

// ─── Calorie Scanner ──────────────────────────────────────────────────────────

function MacroBar({ label, grams, color, max }) {
  const pct = Math.min((grams / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-packd-gray w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-packd-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
      </div>
      <span className="text-[11px] font-semibold text-packd-text w-10 text-right">{grams}g</span>
    </div>
  );
}

function ConfidenceBadge({ level }) {
  const styles = {
    high:   'bg-packd-green/15 text-packd-green border-packd-green/30',
    medium: 'bg-packd-gold/15 text-packd-gold border-packd-gold/30',
    low:    'bg-packd-gray/15 text-packd-gray border-packd-gray/30',
  };
  const labels = { high: 'High confidence', medium: 'Approx estimate', low: 'Low confidence' };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[level] || styles.low}`}>
      {labels[level] || 'Estimate'}
    </span>
  );
}

function ScanIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function NutritionTab() {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setResult(null);
    setError(null);
    setPreview(URL.createObjectURL(file));
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (ev) => {
      // Strip the data URL prefix to get raw base64
      const base64 = ev.target.result.split(',')[1];
      setImageData(base64);
    };
    reader.readAsDataURL(file);
  }

  async function analyse() {
    if (!imageData) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, mimeType }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Analysis failed');
      }
      setResult(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setImageData(null);
    setMimeType(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  const maxMacro = result ? Math.max(result.macros.protein, result.macros.carbs, result.macros.fat, 1) : 1;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="packd-card p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-packd-orange/15 flex items-center justify-center text-packd-orange flex-shrink-0">
          <ScanIcon />
        </div>
        <div>
          <p className="text-sm font-bold text-white">AI Food Scanner</p>
          <p className="text-xs text-packd-gray leading-relaxed">
            Snap your meal — get a ballpark calorie &amp; macro breakdown powered by Claude AI.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      {!preview ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full packd-card border-2 border-dashed border-packd-border hover:border-packd-orange transition-colors p-8 flex flex-col items-center gap-3 text-packd-gray hover:text-packd-orange"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity="0.5" />
            <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-semibold">Tap to upload a food photo</p>
            <p className="text-xs text-packd-gray mt-1">JPG, PNG, WebP · Your meals, snacks, anything</p>
          </div>
        </button>
      ) : (
        <div className="relative rounded-2xl overflow-hidden">
          <img src={preview} alt="Food" className="w-full max-h-64 object-cover" />
          <button
            onClick={reset}
            className="absolute top-2 right-2 w-7 h-7 bg-packd-bg/80 backdrop-blur rounded-full flex items-center justify-center text-packd-gray hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* Analyse button */}
      {imageData && !result && !loading && (
        <button onClick={analyse} className="w-full packd-btn-primary py-3.5 text-sm flex items-center justify-center gap-2">
          <ScanIcon />
          Analyse Calories
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="packd-card p-6 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-packd-orange border-t-transparent animate-spin" />
          <p className="text-sm text-packd-gray text-center">Claude is analysing your meal…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="packd-card p-4 border border-red-400/30">
          <p className="text-sm text-red-400 font-semibold">Oops!</p>
          <p className="text-xs text-packd-gray mt-1">{error}</p>
          {error.includes('API key') && (
            <p className="text-xs text-packd-orange mt-2">
              Add your Anthropic API key to <code className="bg-packd-card2 px-1 rounded">.env.local</code> and restart the server.
            </p>
          )}
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="space-y-3 animate-slide-up">
          {/* Calorie hero */}
          <div className="packd-card p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-bold text-white">{result.meal}</p>
              <ConfidenceBadge level={result.confidence} />
            </div>
            <p className="text-xs text-packd-gray mb-4">{result.servingNote}</p>

            {/* Big calorie number */}
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-black text-gradient leading-none">
                {result.totalCalories}
              </span>
              <span className="text-packd-gray text-sm pb-1">kcal</span>
            </div>

            {/* Macro bars */}
            <div className="space-y-2.5">
              <MacroBar label="Protein" grams={result.macros.protein} color="bg-packd-orange" max={maxMacro} />
              <MacroBar label="Carbs"   grams={result.macros.carbs}   color="bg-packd-gold"   max={maxMacro} />
              <MacroBar label="Fat"     grams={result.macros.fat}     color="bg-packd-green"  max={maxMacro} />
            </div>
          </div>

          {/* Item breakdown */}
          {result.items?.length > 0 && (
            <div className="packd-card p-4">
              <p className="text-xs font-bold text-packd-gray uppercase tracking-widest mb-3">Breakdown</p>
              <div className="space-y-2">
                {result.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{item.name}</p>
                      {item.portion && <p className="text-[11px] text-packd-gray">{item.portion}</p>}
                    </div>
                    <span className="text-sm font-semibold text-packd-orange">{item.calories} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Athlete tip */}
          {result.athleteTip && (
            <div className="packd-card p-4 border border-packd-orange/20 bg-packd-orange/5">
              <p className="text-xs font-bold text-packd-orange uppercase tracking-widest mb-1">Athlete Tip</p>
              <p className="text-sm text-packd-text leading-relaxed">{result.athleteTip}</p>
            </div>
          )}

          {/* Scan another */}
          <button
            onClick={reset}
            className="w-full packd-btn-ghost py-3 text-sm"
          >
            Scan another meal
          </button>

          <p className="text-center text-[10px] text-packd-gray">
            Estimates only — actual values may vary. Consult a nutritionist for precise guidance.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, myActivityLog, packs, joinedPacks } = useApp();
  const [tab, setTab] = useState(() => {
    const t = searchParams.get('tab');
    return PROFILE_TABS.includes(t) ? t : 'Activity';
  });

  const xpPercent = Math.min(((user.xp % 1000) / 1000) * 100, 100);
  const myPacks = packs.filter((p) => joinedPacks[p.id]);
  const earnedBadges = ALL_BADGES.filter((b) => b.earned).length;

  const weekData = [40, 75, 20, 90, 60, 100, 45];

  return (
    <div className="min-h-screen bg-packd-bg pb-24">
      {/* Profile Hero */}
      <div className="relative bg-card-gradient">
        <div className="absolute inset-0 bg-orange-glow opacity-30 pointer-events-none" />
        <div className="relative max-w-lg mx-auto px-4 pt-12 pb-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="relative">
              {user.googleAvatar ? (
                <img src={user.googleAvatar} alt={user.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-packd-orange/40" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-packd-orange flex items-center justify-center text-3xl font-black text-white">
                  {user.avatar}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-packd-gold text-xs text-packd-bg font-black rounded-full w-6 h-6 flex items-center justify-center">
                {user.level}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-black text-white">{user.name}</h1>
              <p className="text-xs text-packd-gray mb-1">Level {user.level} · {user.levelName} · @{user.username}</p>
              <p className="text-xs text-packd-orange font-semibold">{(user.sports || []).join(' · ')}</p>
              {user.bio && <p className="text-xs text-packd-gray mt-1">{user.bio}</p>}
            </div>
            <Link href="/settings" className="packd-btn-ghost text-xs px-3 py-2">Edit</Link>
          </div>

          {/* XP Progress */}
          <div className="bg-packd-bg/40 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-2xl font-black text-white">{user.xp.toLocaleString()}</span>
                <span className="text-packd-gray text-sm"> XP</span>
              </div>
              <span className="text-xs text-packd-gray">{(user.xpToNext - user.xp).toLocaleString()} XP to Lv {user.level + 1}</span>
            </div>
            <div className="xp-bar"><div className="xp-fill" style={{ width: `${xpPercent}%` }} /></div>
            <div className="flex justify-between text-[10px] text-packd-gray mt-1.5">
              <span>Level {user.level}</span>
              <span>Level {user.level + 1} · Pack Alpha</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: `${user.streak}🔥`, l: 'Streak' },
              { v: user.totalSessions, l: 'Sessions' },
              { v: Math.round(user.totalKm), l: 'km Total' },
              { v: earnedBadges, l: 'Badges' },
            ].map(({ v, l }) => (
              <div key={l} className="bg-packd-card/50 rounded-xl py-2 text-center">
                <p className="text-sm font-black text-white">{v}</p>
                <p className="text-[10px] text-packd-gray">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-packd-bg border-b border-packd-border">
        <div className="max-w-lg mx-auto px-4 flex gap-1 py-2">
          {PROFILE_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${tab === t ? 'bg-packd-orange text-white' : 'text-packd-gray hover:text-packd-text'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {tab === 'Activity' && (
          <div className="space-y-3">
            {myActivityLog.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">🏃</p>
                <p className="text-packd-gray text-sm mb-4">No activities logged yet</p>
                <Link href="/log" className="packd-btn-primary px-6 py-2.5 text-sm inline-block">Log your first activity</Link>
              </div>
            ) : (
              myActivityLog.map((a) => (
                <div key={a.id} className="packd-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-packd-card2 flex items-center justify-center text-lg flex-shrink-0">{a.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-bold text-white">{a.title}</p>
                        <span className="text-xs text-packd-orange font-semibold">+{a.xp} XP</span>
                      </div>
                      <p className="text-xs text-packd-gray">{a.date}</p>
                      <div className="flex gap-3 mt-2 text-xs text-packd-gray">
                        {a.distance && <span>📏 {a.distance}</span>}
                        <span>⏱️ {a.pace}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <Link href="/log" className="w-full packd-btn-primary py-3 text-sm flex items-center justify-center gap-2">
              <span>⚡</span> Log Activity
            </Link>
          </div>
        )}

        {tab === 'Badges' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-packd-gray">{earnedBadges} earned · {ALL_BADGES.length - earnedBadges} to unlock</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ALL_BADGES.map((b) => (
                <div key={b.id} className={`packd-card p-4 ${!b.earned ? 'opacity-40' : ''}`}>
                  <div className="text-3xl mb-2">{b.icon}</div>
                  <p className="text-sm font-bold text-white mb-1">{b.name}</p>
                  <p className="text-xs text-packd-gray leading-relaxed">{b.desc}</p>
                  {b.earned
                    ? <div className="mt-2 text-xs text-packd-green font-semibold">✓ Earned</div>
                    : <div className="mt-2 text-xs text-packd-gray">🔒 Locked</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Distance', value: `${Math.round(user.totalKm)} km`, icon: '📏' },
                { label: 'Workouts', value: user.totalSessions, icon: '💪' },
                { label: 'Events Joined', value: user.eventsJoined, icon: '📅' },
                { label: 'Packs', value: user.packsCount, icon: '👥' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="packd-card p-4 text-center">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-xl font-black text-white">{value}</p>
                  <p className="text-xs text-packd-gray">{label}</p>
                </div>
              ))}
            </div>

            <div className="packd-card p-4">
              <h3 className="text-sm font-bold text-white mb-4">This Week</h3>
              <div className="flex items-end gap-2 h-20">
                {weekData.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg bg-packd-orange/80" style={{ height: `${h}%` }} />
                    <span className="text-[9px] text-packd-gray">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="packd-card p-4">
              <h3 className="text-sm font-bold text-white mb-3">Your Packs</h3>
              {myPacks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-packd-gray mb-2">You haven't joined any packs yet</p>
                  <Link href="/explore" className="text-packd-orange text-xs">Browse packs →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {myPacks.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-packd-card2 flex items-center justify-center text-base flex-shrink-0">{p.icon}</div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{p.name}</p>
                        <p className="text-[10px] text-packd-gray">Member · {p.members} members</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Nutrition' && <NutritionTab />}
      </div>

      <BottomNav />
    </div>
  );
}
