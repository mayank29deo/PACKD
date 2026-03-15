'use client';
import { useState, useRef } from 'react';
import BottomNav from '../../components/BottomNav';

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

function ScanIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export default function CaloriesPage() {
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
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    setResult(null); setError(null);
    setPreview(URL.createObjectURL(file));
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (ev) => setImageData(ev.target.result.split(',')[1]);
    reader.readAsDataURL(file);
  }

  async function analyse() {
    if (!imageData) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, mimeType }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Analysis failed');
      setResult(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null); setImageData(null); setMimeType(null);
    setResult(null); setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  const maxMacro = result ? Math.max(result.macros.protein, result.macros.carbs, result.macros.fat, 1) : 1;

  return (
    <div className="min-h-screen bg-packd-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur-md border-b border-packd-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-packd-orange/15 flex items-center justify-center text-packd-orange flex-shrink-0">
            <ScanIcon size={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-white leading-tight">Calorie Tracker</h1>
            <p className="text-[11px] text-packd-gray">AI-powered food scanner</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Upload zone */}
        {!preview ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full packd-card border-2 border-dashed border-packd-border hover:border-packd-orange transition-colors p-10 flex flex-col items-center gap-4 text-packd-gray hover:text-packd-orange"
          >
            <div className="w-16 h-16 rounded-2xl bg-packd-orange/10 flex items-center justify-center text-packd-orange">
              <ScanIcon size={32} />
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
            <img src={preview} alt="Food" className="w-full max-h-72 object-cover" />
            <button
              onClick={reset}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur rounded-full flex items-center justify-center text-white text-sm hover:bg-black/80 transition-colors"
            >✕</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

        {/* Analyse button */}
        {imageData && !result && !loading && (
          <button onClick={analyse} className="w-full packd-btn-primary py-4 text-sm flex items-center justify-center gap-2">
            <ScanIcon size={18} />
            Analyse Calories
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="packd-card p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-packd-orange border-t-transparent animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Analysing your meal…</p>
              <p className="text-xs text-packd-gray mt-1">Claude AI is crunching the numbers</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="packd-card p-4 border border-red-400/30">
            <p className="text-sm text-red-400 font-semibold">Oops!</p>
            <p className="text-xs text-packd-gray mt-1">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            {/* Calorie hero */}
            <div className="packd-card p-5">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-bold text-white">{result.meal}</p>
                <ConfidenceBadge level={result.confidence} />
              </div>
              <p className="text-xs text-packd-gray mb-4">{result.servingNote}</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-black text-gradient leading-none">{result.totalCalories}</span>
                <span className="text-packd-gray text-sm pb-1">kcal</span>
              </div>
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

            {/* Coming soon teaser */}
            <div className="packd-card p-4 border border-packd-border/60 bg-packd-card2/30">
              <p className="text-xs font-bold text-packd-gray uppercase tracking-widest mb-2">Coming Soon</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-packd-gray">
                  <span className="w-4 h-4 rounded-full bg-packd-border flex items-center justify-center text-[9px]">📊</span>
                  Daily calorie & macro history
                </div>
                <div className="flex items-center gap-2 text-xs text-packd-gray">
                  <span className="w-4 h-4 rounded-full bg-packd-border flex items-center justify-center text-[9px]">🎯</span>
                  Goal alignment — Gain · Lose · Maintain
                </div>
                <div className="flex items-center gap-2 text-xs text-packd-gray">
                  <span className="w-4 h-4 rounded-full bg-packd-border flex items-center justify-center text-[9px]">💡</span>
                  AI insights based on your scan history
                </div>
              </div>
            </div>

            <button onClick={reset} className="w-full packd-btn-ghost py-3 text-sm">
              Scan another meal
            </button>

            <p className="text-center text-[10px] text-packd-gray pb-2">
              Estimates only — actual values may vary. Consult a nutritionist for precise guidance.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
