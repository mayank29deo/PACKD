'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BottomNav from '../../components/BottomNav';

// ─── Calculation helpers ──────────────────────────────────────────────────────
function calcDailyTarget(p) {
  const bmr = p.gender === 'female'
    ? 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161
    : 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5;
  const m = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = bmr * (m[p.activity_level] || 1.55);
  return Math.round(p.goal === 'lose' ? tdee - 500 : p.goal === 'gain' ? tdee + 300 : tdee);
}

function getMacroTargets(target, goal) {
  const r = goal === 'lose' ? { p: 0.35, c: 0.35, f: 0.30 }
    : goal === 'gain'       ? { p: 0.30, c: 0.50, f: 0.20 }
    :                         { p: 0.30, c: 0.40, f: 0.30 };
  return {
    protein: Math.round((target * r.p) / 4),
    carbs:   Math.round((target * r.c) / 4),
    fat:     Math.round((target * r.f) / 9),
  };
}

function calcFuelScore(consumed, target, macros, mt) {
  if (!consumed || !target) return 0;
  const calScore  = Math.max(0, 100 - (Math.abs(consumed - target) / target) * 150);
  const protScore = Math.min((macros.protein / Math.max(mt.protein, 1)) * 100, 100);
  const carbScore = Math.min((macros.carbs   / Math.max(mt.carbs,   1)) * 100, 100);
  const fatScore  = Math.min((macros.fat     / Math.max(mt.fat,     1)) * 100, 100);
  return Math.round(calScore * 0.4 + protScore * 0.35 + (carbScore + fatScore) / 2 * 0.25);
}

function getToday() { return new Date().toISOString().split('T')[0]; }

function getTodayLogs(logs) {
  const today = getToday();
  return logs.filter(l => new Date(l.logged_at).toISOString().split('T')[0] === today);
}

function calcStreak(logs) {
  if (!logs.length) return 0;
  let streak = 0;
  const check = new Date();
  while (true) {
    const d = check.toISOString().split('T')[0];
    if (!logs.some(l => new Date(l.logged_at).toISOString().split('T')[0] === d)) break;
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function ScanIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

function TodayIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 12V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 12L15.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  );
}

function InsightsIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M5 20V13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M9 20V9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M13 20V15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M17 20V5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Calorie Ring ─────────────────────────────────────────────────────────────
function CalorieRing({ consumed, target }) {
  const r    = 68;
  const circ = 2 * Math.PI * r;
  const pct  = target > 0 ? Math.min(consumed / target, 1) : 0;
  const isOver  = consumed > target;
  const offset  = circ * (1 - pct);
  const stroke  = isOver ? '#ef4444' : '#E8451A';
  return (
    <div className="relative flex items-center justify-center">
      <svg width="176" height="176" className="-rotate-90">
        <circle cx="88" cy="88" r={r} fill="none" stroke="#1e2020" strokeWidth="14"/>
        <circle cx="88" cy="88" r={r} fill="none"
          stroke={stroke} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 8px ${stroke}80)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center gap-0.5">
        <span className="text-[9px] tracking-widest text-packd-gray font-semibold uppercase">Consumed</span>
        <span className="text-4xl font-black text-white leading-none">{consumed.toLocaleString()}</span>
        <span className="text-xs text-packd-gray">of {target.toLocaleString()} kcal</span>
        <span className={`text-[10px] font-bold mt-1.5 px-2.5 py-0.5 rounded-full ${
          isOver ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
        }`}>
          {isOver
            ? `+${(consumed - target).toLocaleString()} over`
            : `${(target - consumed).toLocaleString()} remaining`}
        </span>
      </div>
    </div>
  );
}

// ─── Macro Bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, grams, targetGrams, color }) {
  const pct   = Math.min((grams / Math.max(targetGrams, 1)) * 100, 100);
  const isHit = grams >= targetGrams * 0.85;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-packd-gray">{label}</span>
        <span className="text-[11px] font-semibold">
          <span className={isHit ? 'text-emerald-400' : 'text-packd-text'}>{Math.round(grams)}g</span>
          <span className="text-packd-gray"> / {targetGrams}g</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-packd-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%`, transition: 'width 0.9s ease' }}/>
      </div>
    </div>
  );
}

// ─── Fuel Score Badge ─────────────────────────────────────────────────────────
function FuelBadge({ score }) {
  const cfg = score >= 90
    ? { label: 'Elite Fuel',    bg: 'bg-amber-500/15',    text: 'text-amber-400',    border: 'border-amber-500/30' }
    : score >= 70
    ? { label: 'On Track',      bg: 'bg-emerald-500/15',  text: 'text-emerald-400',  border: 'border-emerald-500/30' }
    : score >= 50
    ? { label: 'Getting There', bg: 'bg-packd-orange/10', text: 'text-packd-orange', border: 'border-packd-orange/30' }
    : { label: 'Needs Work',    bg: 'bg-packd-border/30', text: 'text-packd-gray',   border: 'border-packd-border' };
  return (
    <div className={`flex flex-col items-center p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <span className="text-2xl font-black text-white leading-none">{score}</span>
      <span className={`text-[10px] font-bold mt-0.5 ${cfg.text}`}>{cfg.label}</span>
      <span className="text-[9px] text-packd-gray mt-0.5">Fuel Score</span>
    </div>
  );
}

// ─── Week Chart ───────────────────────────────────────────────────────────────
function WeekChart({ weekDays, target }) {
  const maxCal = Math.max(...weekDays.map(d => d.calories), target * 1.3, 500);
  const today  = getToday();
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28 relative">
        <div
          className="absolute left-0 right-0 border-t border-dashed border-packd-orange/50 pointer-events-none"
          style={{ bottom: `${(target / maxCal) * 100}%` }}
        />
        {weekDays.map((day, i) => {
          const h       = day.calories > 0 ? Math.max((day.calories / maxCal) * 100, 4) : 2;
          const isToday = day.date === today;
          const isOver  = day.calories > target && day.calories > 0;
          const bg      = day.calories === 0 ? '#1e2020'
            : isOver    ? '#ef444460'
            : isToday   ? '#E8451A'
            :              '#E8451A55';
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              {day.calories > 0 && (
                <span className="text-[8px] text-packd-gray leading-none">
                  {(day.calories / 1000).toFixed(1)}k
                </span>
              )}
              <div className="w-full rounded-t-sm" style={{ height: `${h}%`, backgroundColor: bg }}/>
              <span className={`text-[9px] leading-none ${isToday ? 'text-packd-orange font-bold' : 'text-packd-gray'}`}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <div className="w-4 border-t border-dashed border-packd-orange/50"/>
        <span className="text-[10px] text-packd-gray">Target {target.toLocaleString()} kcal/day</span>
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event }) {
  const ic = event.intensity === 'high'   ? 'text-red-400 bg-red-500/10'
    : event.intensity === 'medium'        ? 'text-amber-400 bg-amber-500/10'
    :                                       'text-emerald-400 bg-emerald-500/10';
  return (
    <Link href="/explore"
      className="packd-card p-3.5 flex items-start gap-3 hover:border-packd-orange/40 transition-colors block">
      <span className="text-xl mt-0.5 flex-shrink-0">{event.emoji || '🏃'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-sm font-bold text-white">{event.name}</p>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${ic}`}>
            {event.intensity}
          </span>
        </div>
        <p className="text-[11px] text-packd-gray leading-relaxed">{event.reason}</p>
      </div>
    </Link>
  );
}

// ─── Sign In Prompt ───────────────────────────────────────────────────────────
function SignInPrompt({ feature }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-packd-orange/10 flex items-center justify-center text-packd-orange mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="text-base font-black text-white mb-2">Sign in to unlock {feature}</h3>
      <p className="text-xs text-packd-gray mb-5 leading-relaxed max-w-xs">
        Track meals, monitor your macros, and get AI-powered insights tailored to your goal.
      </p>
      <Link href="/auth/login" className="packd-btn-primary px-8 py-3 text-sm">
        Sign In to PACKD
      </Link>
    </div>
  );
}

// ─── Onboarding Flow ──────────────────────────────────────────────────────────
function OnboardingFlow({ onComplete, onSkip }) {
  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [data,   setData]   = useState({
    age: '', gender: 'male', height_cm: '', weight_kg: '',
    goal: 'maintain', target_weight_kg: '', activity_level: 'moderate',
  });

  function set(k, v) { setData(d => ({ ...d, [k]: v })); }

  const step1Valid = data.age && data.height_cm && data.weight_kg;
  const step2Valid = data.goal && data.activity_level && (data.goal === 'maintain' || data.target_weight_kg);

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...data,
        age:              Number(data.age),
        height_cm:        Number(data.height_cm),
        weight_kg:        Number(data.weight_kg),
        target_weight_kg: Number(data.target_weight_kg) || Number(data.weight_kg),
      };
      const res = await fetch('/api/calories/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (j.data) onComplete(j.data);
    } finally {
      setSaving(false);
    }
  }

  const goals = {
    lose:     { emoji: '🔥', label: 'Lose Weight',  desc: 'Calorie deficit + cardio' },
    maintain: { emoji: '⚖️', label: 'Maintain',     desc: 'Balanced nutrition' },
    gain:     { emoji: '💪', label: 'Gain Muscle',  desc: 'Calorie surplus + strength' },
  };

  const activities = [
    { id: 'sedentary',   label: 'Sedentary',   desc: 'Desk job, little exercise' },
    { id: 'light',       label: 'Light',        desc: '1–3 days/week' },
    { id: 'moderate',    label: 'Moderate',     desc: '3–5 days/week' },
    { id: 'active',      label: 'Active',       desc: '6–7 days/week' },
    { id: 'very_active', label: 'Very Active',  desc: 'Physical job or 2× daily' },
  ];

  return (
    <div className="min-h-screen bg-packd-bg flex flex-col pb-8">
      <div className="max-w-lg mx-auto w-full px-4 pt-8 flex-1">

        {/* Progress bar */}
        <div className="mb-7">
          <div className="h-1 rounded-full bg-packd-border mb-1.5">
            <div className="h-full rounded-full bg-packd-orange transition-all duration-500"
              style={{ width: step === 1 ? '50%' : '100%' }}/>
          </div>
          <p className="text-xs text-packd-gray">Step {step} of 2</p>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-black text-white">Your body stats</h1>
              <p className="text-sm text-packd-gray mt-1">Used to calculate your personal calorie target</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-2 block">Age</label>
              <input type="number" value={data.age} onChange={e => set('age', e.target.value)}
                placeholder="25" min="10" max="100"
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-packd-orange transition-colors"/>
            </div>

            <div>
              <label className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-2 block">Gender</label>
              <div className="flex gap-2">
                {['male', 'female', 'other'].map(g => (
                  <button key={g} onClick={() => set('gender', g)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                      data.gender === g
                        ? 'bg-packd-orange text-white'
                        : 'bg-packd-card border border-packd-border text-packd-gray hover:border-packd-orange/50'
                    }`}>{g}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-2 block">Height (cm)</label>
                <input type="number" value={data.height_cm} onChange={e => set('height_cm', e.target.value)}
                  placeholder="175"
                  className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-packd-orange transition-colors"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-2 block">Weight (kg)</label>
                <input type="number" value={data.weight_kg} onChange={e => set('weight_kg', e.target.value)}
                  placeholder="70"
                  className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-packd-orange transition-colors"/>
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!step1Valid}
              className="w-full packd-btn-primary py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              Continue →
            </button>
            {onSkip && (
              <button onClick={onSkip}
                className="w-full text-xs text-packd-gray py-2 hover:text-packd-text transition-colors">
                Skip for now (scanner only)
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-black text-white">Your goal</h1>
              <p className="text-sm text-packd-gray mt-1">We'll align your targets and event suggestions</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.entries(goals).map(([k, v]) => (
                <button key={k} onClick={() => set('goal', k)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    data.goal === k
                      ? 'border-packd-orange bg-packd-orange/10'
                      : 'border-packd-border bg-packd-card hover:border-packd-orange/40'
                  }`}>
                  <div className="text-2xl mb-1">{v.emoji}</div>
                  <div className="text-xs font-bold text-white leading-tight">{v.label}</div>
                  <div className="text-[9px] text-packd-gray mt-0.5 leading-tight">{v.desc}</div>
                </button>
              ))}
            </div>

            {data.goal !== 'maintain' && (
              <div>
                <label className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-2 block">
                  Target Weight (kg)
                </label>
                <input type="number" value={data.target_weight_kg}
                  onChange={e => set('target_weight_kg', e.target.value)}
                  placeholder={data.goal === 'lose' ? 'e.g. 65' : 'e.g. 80'}
                  className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-packd-orange transition-colors"/>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-2 block">Activity Level</label>
              <div className="space-y-1.5">
                {activities.map(a => (
                  <button key={a.id} onClick={() => set('activity_level', a.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      data.activity_level === a.id
                        ? 'border-packd-orange bg-packd-orange/10'
                        : 'border-packd-border bg-packd-card hover:border-packd-orange/40'
                    }`}>
                    <span className={`text-sm font-semibold ${data.activity_level === a.id ? 'text-white' : 'text-packd-text'}`}>
                      {a.label}
                    </span>
                    <span className="text-xs text-packd-gray">{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="packd-btn-ghost py-4 px-6 text-sm">
                ← Back
              </button>
              <button onClick={save} disabled={saving || !step2Valid}
                className="flex-1 packd-btn-primary py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                {saving ? 'Saving…' : 'Start Tracking →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Today Tab ────────────────────────────────────────────────────────────────
function TodayTab({ todayLogs, todayCalories, todayMacros, dailyTarget, macroTargets, fuelScore, historyLoading }) {
  if (historyLoading) {
    return (
      <div className="flex justify-center pt-14">
        <div className="w-8 h-8 rounded-full border-2 border-packd-orange border-t-transparent animate-spin"/>
      </div>
    );
  }

  const remaining = dailyTarget - todayCalories;
  const isOver    = todayCalories > dailyTarget;

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Calorie ring + Fuel Score */}
      <div className="packd-card p-5 flex flex-col items-center gap-3">
        <CalorieRing consumed={todayCalories} target={dailyTarget}/>
        {fuelScore !== null && todayCalories > 0 && (
          <div className="w-full max-w-[180px]">
            <FuelBadge score={fuelScore}/>
          </div>
        )}
        {todayCalories === 0 && (
          <p className="text-xs text-packd-gray">Scan a meal to start your day</p>
        )}
      </div>

      {/* Macro bars */}
      <div className="packd-card p-4 space-y-3.5">
        <p className="text-[10px] font-bold text-packd-gray uppercase tracking-widest">Macros Today</p>
        <MacroBar label="Protein" grams={todayMacros.protein} targetGrams={macroTargets.protein} color="bg-packd-orange"/>
        <MacroBar label="Carbs"   grams={todayMacros.carbs}   targetGrams={macroTargets.carbs}   color="bg-amber-500"/>
        <MacroBar label="Fat"     grams={todayMacros.fat}     targetGrams={macroTargets.fat}      color="bg-emerald-500"/>
      </div>

      {/* Meals list */}
      <div className="packd-card p-4">
        <p className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-3">
          Today&apos;s Meals
          {todayLogs.length > 0 && <span className="text-packd-orange ml-1">({todayLogs.length})</span>}
        </p>
        {todayLogs.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-sm text-packd-gray">No meals logged today</p>
            <p className="text-xs text-packd-gray/60 mt-1">Switch to Scan tab to log your first meal</p>
          </div>
        ) : (
          <div className="divide-y divide-packd-border/50">
            {todayLogs.map((log, i) => (
              <div key={log.id || i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-white">{log.meal_name}</p>
                  <p className="text-[11px] text-packd-gray mt-0.5">
                    P {Math.round(log.protein_g)}g · C {Math.round(log.carbs_g)}g · F {Math.round(log.fat_g)}g
                  </p>
                </div>
                <span className="text-sm font-bold text-packd-orange ml-3 flex-shrink-0">
                  {log.total_calories} kcal
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coach tip */}
      {todayCalories > 0 && (
        <div className={`packd-card p-4 border ${
          isOver ? 'border-red-500/20 bg-red-500/5' : 'border-packd-orange/20 bg-packd-orange/5'
        }`}>
          <p className="text-[10px] font-bold text-packd-orange uppercase tracking-widest mb-1.5">Coach Tip</p>
          <p className="text-sm text-packd-text leading-relaxed">
            {isOver
              ? `You're ${Math.abs(remaining).toLocaleString()} kcal over today. A 20-min walk burns ~130 kcal — consider a light evening session to offset it.`
              : remaining < dailyTarget * 0.25
              ? `Almost at your target! ${remaining.toLocaleString()} kcal left. ${todayMacros.protein < macroTargets.protein * 0.7 ? 'Prioritise a high-protein snack for your last meal.' : 'Great balance today — stay consistent.'}`
              : `${remaining.toLocaleString()} kcal remaining. ${todayMacros.protein < macroTargets.protein * 0.6 ? "You're low on protein — aim for a high-protein meal next." : "You're on track — keep it going!"}`
            }
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Insights Tab ─────────────────────────────────────────────────────────────
function InsightsTab({ insights, insightsLoading, dailyTarget, onRefresh }) {
  if (insightsLoading) {
    return (
      <div className="px-4 py-12 flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-packd-orange border-t-transparent animate-spin"/>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">AI Coach is analysing your week…</p>
          <p className="text-xs text-packd-gray mt-1">Checking your calorie data and goal progress</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-packd-orange/10 flex items-center justify-center text-packd-orange mx-auto mb-4">
          <InsightsIcon size={28}/>
        </div>
        <p className="text-sm font-bold text-white mb-1">No insights yet</p>
        <p className="text-xs text-packd-gray leading-relaxed max-w-xs mx-auto">
          Log meals over a couple of days and your AI coach will analyse your weekly progress here.
        </p>
      </div>
    );
  }

  const gradeColor = insights.weekGrade?.startsWith('A') ? 'text-emerald-400'
    : insights.weekGrade?.startsWith('B')               ? 'text-amber-400'
    :                                                      'text-red-400';

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Grade + AI Coach */}
      <div className="packd-card p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex flex-col items-center flex-shrink-0">
            <span className={`text-5xl font-black leading-none ${gradeColor}`}>{insights.weekGrade}</span>
            <span className="text-[9px] text-packd-gray mt-1 uppercase tracking-widest">This Week</span>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-packd-orange uppercase tracking-widest mb-1.5">AI Coach</p>
            <p className="text-sm text-packd-text leading-relaxed">{insights.coachMessage}</p>
          </div>
        </div>
        <div className="bg-packd-bg rounded-xl p-3.5 border border-packd-border/60">
          <p className="text-[9px] font-bold text-packd-gray uppercase tracking-widest mb-1">Trajectory</p>
          <p className="text-sm text-packd-text leading-relaxed">{insights.trajectoryMessage}</p>
        </div>
      </div>

      {/* Stats row */}
      {insights.avgCalories != null && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Avg Daily',  value: insights.avgCalories?.toLocaleString(),                                                                                unit: 'kcal', alert: false },
            { label: 'Target',     value: dailyTarget?.toLocaleString(),                                                                                         unit: 'kcal', alert: false },
            { label: 'Difference', value: insights.avgCalories > dailyTarget ? `+${(insights.avgCalories - dailyTarget).toLocaleString()}` : `-${(dailyTarget - insights.avgCalories).toLocaleString()}`, unit: 'kcal', alert: insights.avgCalories > dailyTarget },
          ].map(s => (
            <div key={s.label} className="packd-card p-3 text-center">
              <p className={`text-lg font-black leading-none ${s.alert ? 'text-red-400' : 'text-white'}`}>{s.value}</p>
              <p className="text-[9px] text-packd-gray mt-0.5">{s.unit}</p>
              <p className="text-[9px] text-packd-gray mt-1 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 7-day chart */}
      {insights.weekDays && (
        <div className="packd-card p-4">
          <p className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-4">Last 7 Days</p>
          <WeekChart weekDays={insights.weekDays} target={dailyTarget}/>
        </div>
      )}

      {/* Event suggestions */}
      {insights.events?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-packd-gray uppercase tracking-widest">Suggested for You</p>
            <Link href="/explore" className="text-xs text-packd-orange">See all events →</Link>
          </div>
          {insights.events.map((ev, i) => <EventCard key={i} event={ev}/>)}
        </div>
      )}

      <div className="flex flex-col items-center gap-2 pb-2">
        <button onClick={onRefresh}
          className="text-xs text-packd-orange/70 hover:text-packd-orange transition-colors">
          ↻ Refresh insights
        </button>
        <p className="text-[10px] text-packd-gray">Powered by AI ✦</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CaloriesPage() {
  const { data: session, status } = useSession();
  const isLoggedIn     = !!session?.user;
  const sessionLoading = status === 'loading';

  const fileRef        = useRef(null);
  const mediaRecRef    = useRef(null);
  const audioChunksRef = useRef([]);

  const [profile,        setProfile]        = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab,      setActiveTab]      = useState('scan');
  const [logs,           setLogs]           = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [insights,       setInsights]       = useState(null);
  const [insightsLoading,setInsightsLoading]= useState(false);

  // Scan mode: 'photo' | 'voice'
  const [scanMode,   setScanMode]   = useState('photo');

  // Photo scan state
  const [preview,    setPreview]    = useState(null);
  const [imageData,  setImageData]  = useState(null);
  const [mimeType,   setMimeType]   = useState(null);
  const [scanLoading,setScanLoading]= useState(false);
  const [result,     setResult]     = useState(null);
  const [scanError,  setScanError]  = useState(null);

  // Voice state
  const [isRecording,   setIsRecording]   = useState(false);
  const [recordSecs,    setRecordSecs]    = useState(0);
  const [voiceLoading,  setVoiceLoading]  = useState(false);
  const [voiceResult,   setVoiceResult]   = useState(null);   // { transcript, data }
  const [voiceError,    setVoiceError]    = useState(null);

  // Load profile on mount
  useEffect(() => {
    if (sessionLoading) return;
    if (!isLoggedIn) { setProfileLoading(false); return; }
    fetch('/api/calories/profile')
      .then(r => r.json())
      .then(j => { if (j.data) setProfile(j.data); else setShowOnboarding(true); })
      .catch(() => setShowOnboarding(true))
      .finally(() => setProfileLoading(false));
  }, [isLoggedIn, sessionLoading]);

  // Load meal history when profile ready
  useEffect(() => {
    if (!profile) return;
    setHistoryLoading(true);
    fetch('/api/calories/history?days=7')
      .then(r => r.json())
      .then(j => { if (j.data) setLogs(j.data); })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [profile]);

  function loadInsights(currentLogs) {
    if (!profile || insightsLoading) return;
    setInsightsLoading(true);
    fetch('/api/calories/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, weekLogs: currentLogs ?? logs }),
    })
      .then(r => r.json())
      .then(j => { if (j.data) setInsights(j.data); })
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  }

  // Auto-load insights when tab first opens
  useEffect(() => {
    if (activeTab === 'insights' && !insights && !insightsLoading && profile) {
      loadInsights(logs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setScanError('Please select an image file.'); return; }
    setResult(null); setScanError(null);
    setPreview(URL.createObjectURL(file));
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = ev => setImageData(ev.target.result.split(',')[1]);
    reader.readAsDataURL(file);
  }

  async function analyse() {
    if (!imageData) return;
    setScanLoading(true); setScanError(null); setResult(null);
    try {
      const res  = await fetch('/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, mimeType }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Analysis failed');
      setResult(json.data);
      if (isLoggedIn) {
        const newLog = {
          id:             'local_' + Date.now(),
          meal_name:      json.data.meal,
          total_calories: json.data.totalCalories,
          protein_g:      json.data.macros?.protein || 0,
          carbs_g:        json.data.macros?.carbs   || 0,
          fat_g:          json.data.macros?.fat     || 0,
          logged_at:      new Date().toISOString(),
        };
        setLogs(prev => [newLog, ...prev]);
        setInsights(null); // reset so insights re-fetch with fresh data
      }
    } catch (err) {
      setScanError(err.message);
    } finally {
      setScanLoading(false);
    }
  }

  function resetScan() {
    setPreview(null); setImageData(null); setMimeType(null);
    setResult(null); setScanError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  // ── Convert any audio blob → WAV (Reverie requires wav/ogg/mp3, not webm) ───
  async function blobToWav(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx    = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    await audioCtx.close();

    const numChannels  = audioBuffer.numberOfChannels;
    const sampleRate   = audioBuffer.sampleRate;
    const numSamples   = audioBuffer.length;
    const pcmData      = new Int16Array(numSamples * numChannels);

    for (let ch = 0; ch < numChannels; ch++) {
      const channel = audioBuffer.getChannelData(ch);
      for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, channel[i]));
        pcmData[i * numChannels + ch] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
    }

    const wavBuffer = new ArrayBuffer(44 + pcmData.byteLength);
    const view      = new DataView(wavBuffer);
    const write     = (off, val, len) => { for (let i = 0; i < len; i++) view.setUint8(off + i, (val >> (8 * i)) & 0xff); };
    const writeStr  = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };

    writeStr(0,  'RIFF');
    write(4,  36 + pcmData.byteLength, 4);
    writeStr(8,  'WAVE');
    writeStr(12, 'fmt ');
    write(16, 16, 4);               // PCM chunk size
    write(20, 1,  2);               // PCM format
    write(22, numChannels, 2);
    write(24, sampleRate,  4);
    write(28, sampleRate * numChannels * 2, 4); // byte rate
    write(32, numChannels * 2, 2);  // block align
    write(34, 16, 2);               // bits per sample
    writeStr(36, 'data');
    write(40, pcmData.byteLength, 4);
    new Int16Array(wavBuffer, 44).set(pcmData);

    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  // ── Voice recording ──────────────────────────────────────────────────────────
  async function startRecording() {
    setVoiceError(null); setVoiceResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        await submitVoice(blob, mimeType);
      };

      mediaRecRef.current = recorder;
      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      setRecordSecs(0);

      // Tick counter
      const tick = setInterval(() => {
        setRecordSecs(s => {
          if (s >= 59) { stopRecording(); clearInterval(tick); return s; }
          return s + 1;
        });
      }, 1000);
      mediaRecRef.current._tick = tick;
    } catch {
      setVoiceError('Microphone access denied. Please allow microphone permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      clearInterval(mediaRecRef.current._tick);
      mediaRecRef.current.stop();
      setIsRecording(false);
    }
  }

  async function submitVoice(blob, audioMime) {
    setVoiceLoading(true);
    try {
      // Convert to WAV — Reverie doesn't support webm/opus containers
      const wavBlob = await blobToWav(blob);
      const base64  = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(wavBlob);
      });

      const res  = await fetch('/api/calories/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: base64, mimeType: 'audio/wav' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Voice analysis failed');

      setVoiceResult(json);
      if (isLoggedIn) {
        const newLog = {
          id:             'local_v_' + Date.now(),
          meal_name:      json.data.meal,
          total_calories: json.data.totalCalories,
          protein_g:      json.data.macros?.protein || 0,
          carbs_g:        json.data.macros?.carbs   || 0,
          fat_g:          json.data.macros?.fat     || 0,
          logged_at:      new Date().toISOString(),
        };
        setLogs(prev => [newLog, ...prev]);
        setInsights(null);
      }
    } catch (err) {
      setVoiceError(err.message);
    } finally {
      setVoiceLoading(false);
    }
  }

  function resetVoice() {
    setVoiceResult(null); setVoiceError(null);
    setIsRecording(false); setRecordSecs(0);
  }

  // Derived
  const dailyTarget   = profile ? calcDailyTarget(profile) : 2000;
  const todayLogs     = getTodayLogs(logs);
  const todayCalories = todayLogs.reduce((s, l) => s + l.total_calories, 0);
  const todayMacros   = todayLogs.reduce(
    (acc, l) => ({ protein: acc.protein + (l.protein_g || 0), carbs: acc.carbs + (l.carbs_g || 0), fat: acc.fat + (l.fat_g || 0) }),
    { protein: 0, carbs: 0, fat: 0 }
  );
  const macroTargets = getMacroTargets(dailyTarget, profile?.goal || 'maintain');
  const fuelScore    = todayCalories > 0 ? calcFuelScore(todayCalories, dailyTarget, todayMacros, macroTargets) : null;
  const streak       = calcStreak(logs);
  const maxMacro     = result ? Math.max(result.macros.protein, result.macros.carbs, result.macros.fat, 1) : 1;

  if (sessionLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-packd-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-packd-orange border-t-transparent animate-spin"/>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={p => { setProfile(p); setShowOnboarding(false); }}
        onSkip={isLoggedIn ? undefined : () => setShowOnboarding(false)}
      />
    );
  }

  const TABS = [
    { id: 'scan',     label: 'Scan',     Icon: ScanIcon },
    { id: 'today',    label: 'Today',    Icon: TodayIcon },
    { id: 'insights', label: 'Insights', Icon: InsightsIcon },
  ];

  const goalLabel = profile?.goal === 'lose' ? '🔥 Lose'
    : profile?.goal === 'gain' ? '💪 Gain'
    : '⚖️ Maintain';

  return (
    <div className="min-h-screen bg-packd-bg pb-24">

      {/* ── Sticky header + tabs ── */}
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur-md border-b border-packd-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-packd-orange/15 flex items-center justify-center text-packd-orange flex-shrink-0">
              <ScanIcon size={18}/>
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-tight">Calorie Tracker</h1>
              <p className="text-[11px] text-packd-gray">
                {profile ? `${goalLabel} · ${dailyTarget.toLocaleString()} kcal/day` : 'AI-powered food scanner'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-packd-orange/10 px-2.5 py-1 rounded-full border border-packd-orange/20">
                <span className="text-sm">🔥</span>
                <span className="text-[11px] font-bold text-packd-orange">{streak}d</span>
              </div>
            )}
            {profile && (
              <button onClick={() => setShowOnboarding(true)} title="Edit profile"
                className="w-8 h-8 rounded-xl bg-packd-card border border-packd-border flex items-center justify-center text-packd-gray hover:text-white hover:border-packd-orange/50 transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 flex">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === id
                  ? 'border-packd-orange text-packd-orange'
                  : 'border-transparent text-packd-gray hover:text-packd-text'
              }`}>
              <Icon size={14}/>{label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto">

        {/* ── SCAN TAB ── */}
        {activeTab === 'scan' && (
          <div className="px-4 py-4 space-y-4">

            {/* Mode toggle: Photo / Voice */}
            <div className="flex bg-packd-card border border-packd-border rounded-xl p-1 gap-1">
              <button onClick={() => { setScanMode('photo'); resetVoice(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  scanMode === 'photo'
                    ? 'bg-packd-orange text-white'
                    : 'text-packd-gray hover:text-packd-text'
                }`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M9 5l1.5-2h3L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                Photo
              </button>
              <button onClick={() => { setScanMode('voice'); resetScan(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  scanMode === 'voice'
                    ? 'bg-packd-orange text-white'
                    : 'text-packd-gray hover:text-packd-text'
                }`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M12 18v4M9 22h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                Voice
              </button>
            </div>

            {/* ── VOICE MODE ── */}
            {scanMode === 'voice' && (
              <div className="space-y-4">
                {!voiceResult && !voiceLoading && (
                  <div className="packd-card p-8 flex flex-col items-center gap-5">
                    {/* Mic button */}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                        isRecording
                          ? 'bg-red-500 shadow-lg shadow-red-500/40'
                          : 'bg-packd-orange/15 border-2 border-packd-orange hover:bg-packd-orange/25'
                      }`}>
                      {isRecording && (
                        <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping"/>
                      )}
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                        className={isRecording ? 'text-white' : 'text-packd-orange'}>
                        <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <path d="M12 18v4M9 22h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </button>

                    {isRecording ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                          <span className="text-sm font-bold text-red-400">Recording</span>
                          <span className="text-sm font-mono text-red-400">
                            0:{String(recordSecs).padStart(2, '0')}
                          </span>
                        </div>
                        <p className="text-xs text-packd-gray text-center mt-1">
                          Tap to stop when done speaking
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">Describe what you ate</p>
                        <p className="text-xs text-packd-gray mt-1 leading-relaxed max-w-xs">
                          e.g. &quot;I had two rotis with dal, a cup of curd and a banana&quot;
                        </p>
                        <span className="inline-block mt-3 text-xs bg-packd-orange/10 text-packd-orange px-3 py-1.5 rounded-full font-semibold">
                          Powered by Whisper AI ✦
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {voiceLoading && (
                  <div className="packd-card p-8 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-packd-orange border-t-transparent animate-spin"/>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">Transcribing your voice…</p>
                      <p className="text-xs text-packd-gray mt-1">Then estimating calories</p>
                    </div>
                  </div>
                )}

                {voiceError && (
                  <div className="packd-card p-4 border border-red-400/30 bg-red-500/5">
                    <p className="text-sm font-semibold text-red-400">Voice analysis failed</p>
                    <p className="text-xs text-packd-gray mt-1">{voiceError}</p>
                    <button onClick={resetVoice} className="text-xs text-packd-orange mt-2 hover:underline">Try again</button>
                  </div>
                )}

                {voiceResult && (
                  <div className="space-y-3">
                    {/* Transcript card */}
                    <div className="packd-card p-4 border border-packd-orange/20 bg-packd-orange/5">
                      <p className="text-[10px] font-bold text-packd-orange uppercase tracking-widest mb-1.5">You said</p>
                      <p className="text-sm text-packd-text italic leading-relaxed">&quot;{voiceResult.transcript}&quot;</p>
                    </div>

                    {/* Calorie result — same card layout as photo */}
                    <div className="packd-card p-5">
                      <div className="flex items-start justify-between mb-1 gap-2">
                        <p className="text-sm font-bold text-white leading-tight">{voiceResult.data.meal}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 bg-amber-500/15 text-amber-400 border-amber-500/30">
                          Ballpark estimate
                        </span>
                      </div>
                      {voiceResult.data.servingNote && (
                        <p className="text-xs text-packd-gray mb-4">{voiceResult.data.servingNote}</p>
                      )}
                      <div className="flex items-end gap-2 mb-5">
                        <span className="text-5xl font-black text-packd-orange leading-none">
                          {voiceResult.data.totalCalories}
                        </span>
                        <span className="text-packd-gray text-sm pb-1">kcal</span>
                      </div>
                      <div className="space-y-2.5">
                        {(() => {
                          const m = voiceResult.data.macros;
                          const mx = Math.max(m.protein, m.carbs, m.fat, 1);
                          return [
                            { label: 'Protein', grams: m.protein, color: 'bg-packd-orange' },
                            { label: 'Carbs',   grams: m.carbs,   color: 'bg-amber-500' },
                            { label: 'Fat',     grams: m.fat,     color: 'bg-emerald-500' },
                          ].map(({ label, grams, color }) => (
                            <div key={label} className="flex items-center gap-2">
                              <span className="text-[11px] text-packd-gray w-14 flex-shrink-0">{label}</span>
                              <div className="flex-1 h-2 rounded-full bg-packd-border overflow-hidden">
                                <div className={`h-full rounded-full ${color}`}
                                  style={{ width: `${(grams / mx) * 100}%`, transition: 'width 0.7s ease' }}/>
                              </div>
                              <span className="text-[11px] font-semibold text-packd-text w-10 text-right">{grams}g</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {voiceResult.data.items?.length > 0 && (
                      <div className="packd-card p-4">
                        <p className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-3">Breakdown</p>
                        <div className="space-y-2.5">
                          {voiceResult.data.items.map((item, i) => (
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

                    {voiceResult.data.athleteTip && (
                      <div className="packd-card p-4 border border-packd-orange/20 bg-packd-orange/5">
                        <p className="text-[10px] font-bold text-packd-orange uppercase tracking-widest mb-1.5">Athlete Tip</p>
                        <p className="text-sm text-packd-text leading-relaxed">{voiceResult.data.athleteTip}</p>
                      </div>
                    )}

                    {isLoggedIn ? (
                      <div className="packd-card p-3.5 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <p className="text-xs text-emerald-400 font-semibold">Meal logged — check Today tab</p>
                      </div>
                    ) : (
                      <div className="packd-card p-3.5 border border-packd-border/60 flex items-center justify-between gap-2">
                        <p className="text-xs text-packd-gray">Sign in to save your meal history</p>
                        <Link href="/auth/login" className="text-xs text-packd-orange font-semibold flex-shrink-0">Sign in →</Link>
                      </div>
                    )}

                    <button onClick={resetVoice} className="w-full packd-btn-ghost py-3 text-sm">
                      Record another meal
                    </button>
                    <p className="text-center text-[10px] text-packd-gray pb-1">
                      Ballpark estimates based on verbal description — actual values may vary.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── PHOTO MODE ── */}
            {scanMode === 'photo' && (
              !preview ? (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full packd-card border-2 border-dashed border-packd-border hover:border-packd-orange transition-colors p-10 flex flex-col items-center gap-4 text-packd-gray hover:text-packd-orange">
                  <div className="w-16 h-16 rounded-2xl bg-packd-orange/10 flex items-center justify-center text-packd-orange">
                    <ScanIcon size={30}/>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-packd-text">Snap or upload a food photo</p>
                    <p className="text-xs text-packd-gray mt-1">JPG, PNG, WebP · Meals, snacks, anything</p>
                  </div>
                  <span className="text-xs bg-packd-orange/10 text-packd-orange px-3 py-1.5 rounded-full font-semibold">
                    Powered by AI ✦
                  </span>
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={preview} alt="Food preview" className="w-full max-h-72 object-cover"/>
                  <button onClick={resetScan}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                    ✕
                  </button>
                </div>
              )
            )}

            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handleFile}/>

            {scanMode === 'photo' && imageData && !result && !scanLoading && (
              <button onClick={analyse}
                className="w-full packd-btn-primary py-4 text-sm flex items-center justify-center gap-2">
                <ScanIcon size={18}/> Analyse Calories
              </button>
            )}

            {scanMode === 'photo' && scanLoading && (
              <div className="packd-card p-8 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-packd-orange border-t-transparent animate-spin"/>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Analysing your meal…</p>
                  <p className="text-xs text-packd-gray mt-1">AI is crunching the macros</p>
                </div>
              </div>
            )}

            {scanMode === 'photo' && scanError && (
              <div className="packd-card p-4 border border-red-400/30 bg-red-500/5">
                <p className="text-sm font-semibold text-red-400">Analysis failed</p>
                <p className="text-xs text-packd-gray mt-1">{scanError}</p>
                <button onClick={resetScan} className="text-xs text-packd-orange mt-2 hover:underline">Try again</button>
              </div>
            )}

            {scanMode === 'photo' && result && (
              <div className="space-y-3">

                <div className="packd-card p-5">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <p className="text-sm font-bold text-white leading-tight">{result.meal}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      result.confidence === 'high'   ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : result.confidence === 'medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      :                                   'bg-packd-border/30 text-packd-gray border-packd-border'
                    }`}>
                      {result.confidence === 'high' ? 'High confidence' : result.confidence === 'medium' ? 'Approx' : 'Low confidence'}
                    </span>
                  </div>
                  {result.servingNote && <p className="text-xs text-packd-gray mb-4">{result.servingNote}</p>}

                  <div className="flex items-end gap-2 mb-5">
                    <span className="text-5xl font-black text-packd-orange leading-none">{result.totalCalories}</span>
                    <span className="text-packd-gray text-sm pb-1">kcal</span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: 'Protein', grams: result.macros.protein, color: 'bg-packd-orange' },
                      { label: 'Carbs',   grams: result.macros.carbs,   color: 'bg-amber-500' },
                      { label: 'Fat',     grams: result.macros.fat,     color: 'bg-emerald-500' },
                    ].map(({ label, grams, color }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-[11px] text-packd-gray w-14 flex-shrink-0">{label}</span>
                        <div className="flex-1 h-2 rounded-full bg-packd-border overflow-hidden">
                          <div className={`h-full rounded-full ${color}`}
                            style={{ width: `${(grams / maxMacro) * 100}%`, transition: 'width 0.7s ease' }}/>
                        </div>
                        <span className="text-[11px] font-semibold text-packd-text w-10 text-right">{grams}g</span>
                      </div>
                    ))}
                  </div>
                </div>

                {result.items?.length > 0 && (
                  <div className="packd-card p-4">
                    <p className="text-[10px] font-bold text-packd-gray uppercase tracking-widest mb-3">Breakdown</p>
                    <div className="space-y-2.5">
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

                {result.athleteTip && (
                  <div className="packd-card p-4 border border-packd-orange/20 bg-packd-orange/5">
                    <p className="text-[10px] font-bold text-packd-orange uppercase tracking-widest mb-1.5">Athlete Tip</p>
                    <p className="text-sm text-packd-text leading-relaxed">{result.athleteTip}</p>
                  </div>
                )}

                {isLoggedIn ? (
                  <div className="packd-card p-3.5 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <p className="text-xs text-emerald-400 font-semibold">
                      Meal logged — check Today tab for your daily totals
                    </p>
                  </div>
                ) : (
                  <div className="packd-card p-3.5 border border-packd-border/60 flex items-center justify-between gap-2">
                    <p className="text-xs text-packd-gray">Sign in to save your meal history</p>
                    <Link href="/auth/login" className="text-xs text-packd-orange font-semibold flex-shrink-0">Sign in →</Link>
                  </div>
                )}

                <button onClick={resetScan} className="w-full packd-btn-ghost py-3 text-sm">
                  Scan another meal
                </button>
                <p className="text-center text-[10px] text-packd-gray pb-1">
                  Estimates only — actual values may vary.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TODAY TAB ── */}
        {activeTab === 'today' && (
          isLoggedIn
            ? <TodayTab
                todayLogs={todayLogs}
                todayCalories={todayCalories}
                todayMacros={todayMacros}
                dailyTarget={dailyTarget}
                macroTargets={macroTargets}
                fuelScore={fuelScore}
                historyLoading={historyLoading}
              />
            : <SignInPrompt feature="daily tracking"/>
        )}

        {/* ── INSIGHTS TAB ── */}
        {activeTab === 'insights' && (
          isLoggedIn
            ? <InsightsTab
                insights={insights}
                insightsLoading={insightsLoading}
                dailyTarget={dailyTarget}
                onRefresh={() => { setInsights(null); loadInsights(logs); }}
              />
            : <SignInPrompt feature="weekly insights"/>
        )}

      </div>

      <BottomNav/>
    </div>
  );
}
