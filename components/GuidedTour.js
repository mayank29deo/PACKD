'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─── Tour steps ────────────────────────────────────────────────────────────────
// navigateTo  : route to push before showing step (null = stay)
// clickBefore : selector to click after nav (tab switch etc.)
// target      : selector to spotlight
// arrow       : 'up' | 'down' | 'left' | 'right' | null (auto)
// position    : 'center' | 'above' | 'below' (relative to target)

const STEPS = [
  {
    id: 'welcome',
    navigateTo: null,
    target: null,
    position: 'center',
    emoji: '👋',
    title: 'Welcome to PACKD',
    desc: "Your AI-powered fitness companion. Let's take a 60-second tour so you know exactly where everything lives.",
  },
  {
    id: 'cal-intro',
    navigateTo: '/calories',
    clickBefore: '[data-tour="cal-tab-scan"]',
    target: '[data-tour="cal-tabs"]',
    position: 'below',
    emoji: '🍎',
    badge: 'HERO FEATURE',
    title: 'Calorie Tracker',
    desc: 'Three tabs — Scan, Today, and Insights. This is your nutrition command centre. Let\'s walk through each one.',
  },
  {
    id: 'cal-scan-toggle',
    navigateTo: '/calories',
    clickBefore: '[data-tour="cal-tab-scan"]',
    target: '[data-tour="cal-scan-toggle"]',
    position: 'below',
    emoji: '📸',
    title: 'Snap or Speak',
    desc: 'Switch between Photo and Voice. Snap a photo of your meal for instant AI analysis — or speak it out in English, Hindi, Tamil or Telugu.',
  },
  {
    id: 'cal-today',
    navigateTo: '/calories',
    clickBefore: '[data-tour="cal-tab-today"]',
    target: '[data-tour="cal-tabs"]',
    position: 'below',
    emoji: '📊',
    title: 'Today\'s Dashboard',
    desc: 'Every meal you log appears here — calories, protein, carbs and fat tracked live against your personal daily goal. Your running score for the day.',
  },
  {
    id: 'cal-insights',
    navigateTo: '/calories',
    clickBefore: '[data-tour="cal-tab-insights"]',
    target: '[data-tour="cal-tabs"]',
    position: 'below',
    emoji: '💡',
    title: 'AI Insights',
    desc: 'PACKD analyses your weekly patterns and recommends exactly what activity — a 20-min run, a strength session — would close the gap to your goal. Not generic advice — your numbers, your plan.',
  },
  {
    id: 'cal-goal',
    navigateTo: '/calories',
    clickBefore: '[data-tour="cal-tab-scan"]',
    target: '[data-tour="cal-tabs"]',
    position: 'below',
    emoji: '🎯',
    title: 'Your Goal, Auto-Calculated',
    desc: 'PACKD reads your profile — weight, height, activity level, goal (cut / maintain / bulk) — and sets your daily calorie target automatically. Log meals and watch the ring fill.',
  },
  {
    id: 'home',
    navigateTo: '/feed',
    target: '[data-tour="home"]',
    position: 'above',
    emoji: '🏠',
    title: 'Home Feed',
    desc: 'See what your pack is doing — workouts, meals, milestones. Community is the fastest way to stay consistent.',
  },
  {
    id: 'explore',
    navigateTo: '/explore',
    target: '[data-tour="explore"]',
    position: 'above',
    emoji: '🧭',
    title: 'Explore',
    desc: 'Discover athletes, community events and fitness content across PACKD. Find your people here.',
  },
  {
    id: 'create',
    navigateTo: null,
    target: '[data-tour="create"]',
    position: 'above',
    emoji: '✨',
    title: 'Create & Share',
    desc: 'Post your meals, workouts and wins. Your journey can inspire someone else\'s.',
  },
  {
    id: 'pack',
    navigateTo: '/pack',
    target: '[data-tour="pack"]',
    position: 'above',
    emoji: '👥',
    title: 'Your Pack',
    desc: 'Build or join a training pack. Train together, compete together, grow together.',
  },
  {
    id: 'me',
    navigateTo: '/profile',
    target: '[data-tour="me"]',
    position: 'above',
    emoji: '⚙️',
    title: 'Your Profile',
    desc: 'Set your calorie goal, body stats and training preferences. Your hub for personal progress.',
  },
];

const PAD = 10;
const CARD_W = 320;

export default function GuidedTour() {
  const router  = useRouter();
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect]       = useState(null);
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    try {
      if (!localStorage.getItem('packd_tour_done')) {
        const t = setTimeout(() => setVisible(true), 900);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  // ── Resolve target rect after nav + clickBefore ────────────────────────────
  const resolveStep = useCallback(async (s) => {
    const current = STEPS[s];
    if (!current) return;

    // Navigate if needed
    if (current.navigateTo) {
      router.push(current.navigateTo);
      await delay(500); // wait for page to render
    }

    // Click a tab / button before spotlighting
    if (current.clickBefore) {
      const btn = document.querySelector(current.clickBefore);
      if (btn) {
        btn.click();
        await delay(300);
      }
    }

    // Find target
    if (!current.target) { setRect(null); return; }
    let el = document.querySelector(current.target);
    // Retry once if not found yet (route may still be painting)
    if (!el) { await delay(300); el = document.querySelector(current.target); }
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      await delay(200);
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [router]);

  useEffect(() => {
    if (!visible) return;
    resolveStep(step);
  }, [visible, step, resolveStep]);

  // Re-measure on resize
  useEffect(() => {
    if (!visible) return;
    const onResize = () => resolveStep(stepRef.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [visible, resolveStep]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem('packd_tour_done', '1'); } catch {}
  };

  const next = async () => {
    if (animating) return;
    if (step < STEPS.length - 1) {
      setAnimating(true);
      setRect(null); // clear so spotlight fades while transitioning
      await delay(250);
      setStep(s => s + 1);
      setAnimating(false);
    } else {
      dismiss();
    }
  };

  const prev = async () => {
    if (animating || step === 0) return;
    setAnimating(true);
    setRect(null);
    await delay(250);
    setStep(s => s - 1);
    setAnimating(false);
  };

  if (!mounted || !visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isCenter = current.position === 'center' || !rect;

  // ── Tooltip positioning ───────────────────────────────────────────────────
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 400;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const CARD_H_EST = 240;
  const ARROW_SIZE = 10;

  let cardStyle = {};
  let arrowStyle = {};
  let arrowDir = null; // 'up' | 'down'

  if (!isCenter && rect) {
    const centreX = rect.left + rect.width / 2;
    let left = Math.max(16, Math.min(centreX - CARD_W / 2, vw - CARD_W - 16));

    if (current.position === 'above') {
      // Tooltip above element, arrow pointing down toward element
      const top = rect.top - PAD - CARD_H_EST - ARROW_SIZE - 8;
      cardStyle = { position: 'fixed', top: Math.max(12, top), left, width: CARD_W };
      arrowDir  = 'down';
      arrowStyle = {
        position: 'fixed',
        top: Math.max(12, top) + CARD_H_EST,
        left: centreX - ARROW_SIZE,
        width: 0, height: 0,
        borderLeft:  `${ARROW_SIZE}px solid transparent`,
        borderRight: `${ARROW_SIZE}px solid transparent`,
        borderTop:   `${ARROW_SIZE}px solid #1f1f1f`,
      };
    } else {
      // Tooltip below element, arrow pointing up toward element
      const top = rect.bottom + PAD + ARROW_SIZE + 8;
      cardStyle = { position: 'fixed', top: Math.min(top, vh - CARD_H_EST - 16), left, width: CARD_W };
      arrowDir  = 'up';
      arrowStyle = {
        position: 'fixed',
        top: rect.bottom + PAD + 8,
        left: centreX - ARROW_SIZE,
        width: 0, height: 0,
        borderLeft:  `${ARROW_SIZE}px solid transparent`,
        borderRight: `${ARROW_SIZE}px solid transparent`,
        borderBottom: `${ARROW_SIZE}px solid #1f1f1f`,
      };
    }
  }

  return (
    <>
      <style>{`
        @keyframes tour-pulse {
          0%,100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.80), 0 0 0 2px #E8451A, 0 0 20px 4px #E8451A55; }
          50%      { box-shadow: 0 0 0 9999px rgba(0,0,0,0.80), 0 0 0 3px #E8451A, 0 0 36px 10px #E8451A80; }
        }
        @keyframes tour-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tour-center-in {
          from { opacity: 0; transform: translate(-50%,-46%); }
          to   { opacity: 1; transform: translate(-50%,-50%); }
        }
        .tour-card { animation: tour-fade-in 0.3s ease both; }
        .tour-card-center { animation: tour-center-in 0.3s ease both; }
      `}</style>

      {/* Full-screen dark backdrop (for center steps) */}
      {isCenter && (
        <div
          onClick={dismiss}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.80)', zIndex: 9990 }}
        />
      )}

      {/* Spotlight ring — animates to target rect */}
      {rect && (
        <div style={{
          position: 'fixed',
          top:    rect.top    - PAD,
          left:   rect.left   - PAD,
          width:  rect.width  + PAD * 2,
          height: rect.height + PAD * 2,
          borderRadius: 14,
          zIndex: 9991,
          pointerEvents: 'none',
          animation: 'tour-pulse 2s ease-in-out infinite',
          transition: 'top 0.4s ease, left 0.4s ease, width 0.4s ease, height 0.4s ease',
        }} />
      )}

      {/* Arrow */}
      {!isCenter && rect && arrowDir && (
        <div style={{ ...arrowStyle, zIndex: 9992, pointerEvents: 'none', transition: 'top 0.4s ease, left 0.4s ease' }} />
      )}

      {/* Tooltip card */}
      {isCenter ? (
        <div className="tour-card-center" style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: Math.min(CARD_W, vw - 32),
          zIndex: 9993,
        }}>
          <TourCard
            current={current} step={step} total={STEPS.length}
            isLast={isLast} onNext={next} onPrev={prev} onSkip={dismiss}
          />
        </div>
      ) : (
        rect && (
          <div className="tour-card" style={{ ...cardStyle, zIndex: 9993 }}>
            <TourCard
              current={current} step={step} total={STEPS.length}
              isLast={isLast} onNext={next} onPrev={prev} onSkip={dismiss}
            />
          </div>
        )
      )}
    </>
  );
}

// ─── Card UI ──────────────────────────────────────────────────────────────────
function TourCard({ current, step, total, isLast, onNext, onPrev, onSkip }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #1c1c1c 0%, #141414 100%)',
      borderRadius: 20,
      padding: '18px 18px 16px',
      border: '1px solid #2a2a2a',
      boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>
      {/* Header row: dots + skip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              height: 4,
              width: i === step ? 20 : 4,
              borderRadius: 2,
              backgroundColor: i === step ? '#E8451A' : i < step ? '#E8451A50' : '#2a2a2a',
              transition: 'all 0.35s ease',
            }} />
          ))}
        </div>
        <button onClick={onSkip} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
          padding: '3px 6px', borderRadius: 6,
        }}>SKIP</button>
      </div>

      {/* Badge */}
      {current.badge && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          backgroundColor: '#E8451A15', color: '#E8451A',
          fontSize: 9, fontWeight: 800, letterSpacing: 1.4,
          padding: '3px 8px', borderRadius: 20,
          border: '1px solid #E8451A30',
          marginBottom: 10,
        }}>
          ★ {current.badge}
        </div>
      )}

      {/* Emoji + title */}
      <div style={{ fontSize: 26, marginBottom: 5 }}>{current.emoji}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 7, lineHeight: 1.3 }}>
        {current.title}
      </div>
      <div style={{ fontSize: 12.5, color: '#777', lineHeight: 1.65, marginBottom: 16 }}>
        {current.desc}
      </div>

      {/* Step counter + buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {step > 0 && (
          <button onClick={onPrev} style={{
            background: '#1f1f1f', border: '1px solid #2e2e2e',
            color: '#666', borderRadius: 10, padding: '9px 12px',
            fontSize: 13, cursor: 'pointer', fontWeight: 700,
            flexShrink: 0,
          }}>←</button>
        )}
        <button onClick={onNext} style={{
          flex: 1,
          background: isLast
            ? 'linear-gradient(135deg, #E8451A 0%, #ff6136 100%)'
            : '#E8451A',
          border: 'none', color: '#fff', borderRadius: 10,
          padding: '10px 14px', fontSize: 13, fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 3px 14px rgba(232,69,26,0.4)',
          letterSpacing: 0.3,
        }}>
          {isLast ? "Let's go! 🚀" : `Next  ${step + 1} / ${total}`}
        </button>
      </div>
    </div>
  );
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
