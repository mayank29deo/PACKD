'use client';
import { useState, useEffect, useCallback } from 'react';

const STEPS = [
  {
    id: 'welcome',
    target: null,
    emoji: '👋',
    title: 'Welcome to PACKD',
    desc: "You're now part of a fitness-first community. Let us show you around in under a minute.",
    position: 'center',
  },
  {
    id: 'calories-hero',
    target: '[data-tour="calories"]',
    emoji: '🍎',
    badge: 'HERO FEATURE',
    title: 'AI Calorie Tracker',
    desc: 'The smartest way to track what you eat. Snap a photo or describe your meal by voice — AI does the rest instantly.',
    position: 'top',
  },
  {
    id: 'calories-photo',
    target: '[data-tour="calories"]',
    emoji: '📸',
    title: 'Photo Scan',
    desc: 'Point your camera at any meal. Our AI identifies every ingredient and returns calories, protein, carbs & fat in seconds.',
    position: 'top',
  },
  {
    id: 'calories-voice',
    target: '[data-tour="calories"]',
    emoji: '🎙️',
    title: 'Voice Log',
    desc: 'Just say "I had 2 rotis and dal" — supports English, Hindi, Tamil & Telugu. Great for logging on the go.',
    position: 'top',
  },
  {
    id: 'calories-today',
    target: '[data-tour="calories"]',
    emoji: '📊',
    title: 'Today\'s Dashboard',
    desc: 'The Today tab totals your calories and macros as you log meals throughout the day — protein, carbs and fat tracked in real time against your personal goal.',
    position: 'top',
  },
  {
    id: 'calories-insights',
    target: '[data-tour="calories"]',
    emoji: '💡',
    title: 'AI Insights',
    desc: 'The Insights tab analyses your weekly eating patterns and tells you exactly what activity — a 20-min run, a strength session — would close the gap between what you ate and your goal. Smart nudges, not generic advice.',
    position: 'top',
  },
  {
    id: 'calories-goal',
    target: '[data-tour="calories"]',
    emoji: '🎯',
    title: 'Stay On Target',
    desc: 'Whether you\'re cutting, bulking or maintaining — PACKD auto-calculates your daily calorie target from your profile and keeps a live score every time you log a meal.',
    position: 'top',
  },
  {
    id: 'home',
    target: '[data-tour="home"]',
    emoji: '🏠',
    title: 'Home Feed',
    desc: "See what your pack is up to — workouts, meals, achievements. Community keeps you consistent.",
    position: 'top',
  },
  {
    id: 'explore',
    target: '[data-tour="explore"]',
    emoji: '🧭',
    title: 'Explore',
    desc: 'Discover athletes, community events and fitness content from across PACKD. Find your people.',
    position: 'top',
  },
  {
    id: 'create',
    target: '[data-tour="create"]',
    emoji: '✨',
    title: 'Create & Share',
    desc: 'Post your workouts, meals and milestones. Build your presence and inspire your community.',
    position: 'top',
  },
  {
    id: 'pack',
    target: '[data-tour="pack"]',
    emoji: '👥',
    title: 'Your Pack',
    desc: 'Build or join a training pack. Train together, compete together, grow together.',
    position: 'top',
  },
  {
    id: 'me',
    target: '[data-tour="me"]',
    emoji: '⚙️',
    title: 'Your Profile',
    desc: 'Set your calorie goal, body stats and training preferences. Your dashboard for personal progress.',
    position: 'top',
  },
];

const PAD = 10;

export default function GuidedTour() {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect]       = useState(null);
  const [mounted, setMounted] = useState(false);

  // Mount guard + localStorage check
  useEffect(() => {
    setMounted(true);
    try {
      if (!localStorage.getItem('packd_tour_done')) {
        const t = setTimeout(() => setVisible(true), 900);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  // Recalculate target rect whenever step changes
  const updateRect = useCallback(() => {
    const current = STEPS[step];
    if (!current?.target) { setRect(null); return; }
    const el = document.querySelector(current.target);
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [step]);

  useEffect(() => {
    if (!visible) return;
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [visible, updateRect]);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem('packd_tour_done', '1'); } catch {}
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  };

  const prev = () => { if (step > 0) setStep(s => s - 1); };

  if (!mounted || !visible) return null;

  const current  = STEPS[step];
  const isLast   = step === STEPS.length - 1;
  const isCenter = current.position === 'center' || !rect;

  // Tooltip position: above the highlight if space, else below
  const TOOLTIP_H = 220;
  const TOOLTIP_W = Math.min(340, (typeof window !== 'undefined' ? window.innerWidth : 400) - 32);
  let tooltipTop = 0;
  if (!isCenter && rect) {
    tooltipTop = rect.top - PAD - TOOLTIP_H - 16;
    if (tooltipTop < 20) tooltipTop = rect.bottom + PAD + 16;
  }

  return (
    <>
      {/* Inject keyframes for glow pulse */}
      <style>{`
        @keyframes tour-glow {
          0%,100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.78), 0 0 0 2px #E8451A, 0 0 18px 4px #E8451A55; }
          50%      { box-shadow: 0 0 0 9999px rgba(0,0,0,0.78), 0 0 0 2px #E8451A, 0 0 30px 8px #E8451A88; }
        }
        @keyframes tour-card-in {
          from { opacity: 0; transform: translateY(8px) translateX(-50%); }
          to   { opacity: 1; transform: translateY(0)   translateX(-50%); }
        }
        @keyframes tour-card-in-center {
          from { opacity: 0; transform: translate(-50%,-48%); }
          to   { opacity: 1; transform: translate(-50%,-50%); }
        }
      `}</style>

      {/* Backdrop — only rendered when no rect (center mode) since box-shadow handles it otherwise */}
      {isCenter && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.78)', zIndex: 9998 }} onClick={dismiss} />
      )}

      {/* Spotlight ring around target */}
      {rect && (
        <div style={{
          position: 'fixed',
          top:    rect.top    - PAD,
          left:   rect.left   - PAD,
          width:  rect.width  + PAD * 2,
          height: rect.height + PAD * 2,
          borderRadius: 14,
          zIndex: 9999,
          animation: 'tour-glow 2s ease-in-out infinite',
          pointerEvents: 'none',
          transition: 'top 0.35s, left 0.35s, width 0.35s, height 0.35s',
        }} />
      )}

      {/* Tooltip card */}
      <div style={isCenter ? {
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: TOOLTIP_W,
        zIndex: 10000,
        animation: 'tour-card-in-center 0.3s ease',
      } : {
        position: 'fixed',
        top: tooltipTop,
        left: '50%',
        transform: 'translateX(-50%)',
        width: TOOLTIP_W,
        zIndex: 10000,
        animation: 'tour-card-in 0.3s ease',
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #1a1a1a, #141414)',
          borderRadius: 22,
          padding: '22px 20px 18px',
          border: '1px solid #2a2a2a',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px #ffffff08',
        }}>

          {/* Progress dots + skip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  height: 5,
                  width: i === step ? 18 : 5,
                  borderRadius: 3,
                  backgroundColor: i === step ? '#E8451A' : i < step ? '#E8451A55' : '#2a2a2a',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
            <button onClick={dismiss} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#555', fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              padding: '4px 8px', borderRadius: 8,
            }}>
              SKIP
            </button>
          </div>

          {/* Badge */}
          {current.badge && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              backgroundColor: '#E8451A18', color: '#E8451A',
              fontSize: 9, fontWeight: 800, letterSpacing: 1.2,
              padding: '3px 9px', borderRadius: 20,
              border: '1px solid #E8451A35',
              marginBottom: 10,
            }}>
              ★ {current.badge}
            </div>
          )}

          {/* Emoji + title */}
          <div style={{ fontSize: 30, marginBottom: 6 }}>{current.emoji}</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            {current.title}
          </div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.65, marginBottom: 20 }}>
            {current.desc}
          </div>

          {/* Step counter + buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step > 0 && (
              <button onClick={prev} style={{
                background: '#1f1f1f', border: '1px solid #2a2a2a',
                color: '#888', borderRadius: 12, padding: '10px 14px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}>
                ←
              </button>
            )}
            <button onClick={next} style={{
              flex: 1,
              background: isLast
                ? 'linear-gradient(135deg, #E8451A, #ff6340)'
                : '#E8451A',
              border: 'none', color: '#fff', borderRadius: 12,
              padding: '12px', fontSize: 14, fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(232,69,26,0.35)',
            }}>
              {isLast ? "Let's go! 🚀" : `Next  ${step + 1}/${STEPS.length}`}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
