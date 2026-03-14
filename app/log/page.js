'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/AppContext';

const SPORT_ICONS = {
  Running: '🏃', Cycling: '🚴', Football: '⚽', Yoga: '🧘', Swimming: '🏊',
  CrossFit: '🏋️', Basketball: '🏀', Tennis: '🎾', Hiking: '🥾', Badminton: '🏸',
  Boxing: '🥊', Other: '💪',
};

const SPORT_XP = {
  Running: 280, Cycling: 240, Football: 200, Yoga: 120, Swimming: 260,
  CrossFit: 350, Basketball: 180, Tennis: 160, Hiking: 220, Badminton: 150,
  Boxing: 300, Other: 150,
};

export default function LogActivityPage() {
  const router = useRouter();
  const { logActivity, user } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    type: '', title: '', duration: '', distance: '', pace: '', notes: '',
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [logged, setLogged] = useState(false);
  const fileRef = useRef(null);

  function update(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  function handleLog() {
    const xp = SPORT_XP[form.type] || 150;
    logActivity({
      type: form.type,
      title: form.title || `${form.type} Session`,
      distance: form.distance ? `${form.distance} km` : '',
      pace: form.pace || `${form.duration} min`,
      xp,
      icon: SPORT_ICONS[form.type] || '💪',
    });
    setLogged(true);
  }

  if (logged) {
    const xp = SPORT_XP[form.type] || 150;
    return (
      <div className="min-h-screen bg-packd-bg flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4 animate-bounce">{SPORT_ICONS[form.type] || '💪'}</div>
        <h2 className="text-2xl font-black text-white mb-1">Activity Logged!</h2>
        <p className="text-packd-gray text-sm mb-4">Keep the streak going, {user.name.split(' ')[0]}!</p>
        <div className="packd-card p-4 mb-6 w-full max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">{form.title || `${form.type} Session`}</span>
            <span className="text-packd-orange font-black">+{xp} XP</span>
          </div>
          {form.distance && <p className="text-xs text-packd-gray">📏 {form.distance} km</p>}
          {form.duration && <p className="text-xs text-packd-gray">⏱️ {form.duration} min</p>}
          <div className="mt-3 pt-3 border-t border-packd-border flex items-center justify-between">
            <span className="text-xs text-packd-gray">Total XP</span>
            <span className="text-sm font-black text-packd-orange">{(user.xp + xp).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => { setLogged(false); setForm({ type: '', title: '', duration: '', distance: '', pace: '', notes: '' }); setStep(0); }} className="flex-1 packd-btn-ghost py-3 text-sm">
            Log Another
          </button>
          <button onClick={() => router.push('/profile')} className="flex-1 packd-btn-primary py-3 text-sm">
            View Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-packd-bg pb-10">
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur border-b border-packd-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)} className="text-packd-gray hover:text-packd-text text-xl">←</button>
          ) : (
            <button onClick={() => router.back()} className="text-packd-gray hover:text-packd-text text-xl">←</button>
          )}
          <h1 className="text-lg font-black text-white flex-1">Log Activity</h1>
          <span className="text-xs text-packd-gray">{step + 1}/2</span>
        </div>
        <div className="max-w-lg mx-auto mt-3">
          <div className="flex gap-1">
            {[0, 1].map((i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= step ? 'bg-packd-orange' : 'bg-packd-border'}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-black text-white mb-2">What did you do?</h2>
            <p className="text-packd-gray text-sm mb-6">Select the sport or activity type.</p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(SPORT_ICONS).map(([sport, icon]) => (
                <button
                  key={sport}
                  onClick={() => { update('type', sport); setStep(1); }}
                  className={`py-4 px-2 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
                    form.type === sport
                      ? 'bg-packd-orange/10 border-packd-orange'
                      : 'bg-packd-card border-packd-border hover:border-packd-orange/50'
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-semibold text-packd-text">{sport}</span>
                  <span className="text-[10px] text-packd-orange font-bold">+{SPORT_XP[sport]} XP</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{SPORT_ICONS[form.type]}</span>
              <div>
                <h2 className="text-xl font-black text-white">{form.type}</h2>
                <p className="text-xs text-packd-orange font-semibold">+{SPORT_XP[form.type]} XP on completion</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-packd-gray mb-1 block">Activity title (optional)</label>
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder={`e.g. Morning ${form.type}`}
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-packd-gray mb-1 block">Duration (min)</label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => update('duration', e.target.value)}
                  placeholder="45"
                  className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text focus:outline-none focus:border-packd-orange transition-colors"
                />
              </div>
              {['Running', 'Cycling', 'Swimming', 'Hiking'].includes(form.type) && (
                <div>
                  <label className="text-xs text-packd-gray mb-1 block">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.distance}
                    onChange={(e) => update('distance', e.target.value)}
                    placeholder="10.0"
                    className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text focus:outline-none focus:border-packd-orange transition-colors"
                  />
                </div>
              )}
              {['Running', 'Cycling'].includes(form.type) && (
                <div>
                  <label className="text-xs text-packd-gray mb-1 block">Pace (min/km)</label>
                  <input
                    value={form.pace}
                    onChange={(e) => update('pace', e.target.value)}
                    placeholder="5:30"
                    className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-packd-gray mb-1 block">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="How did it feel? Any PRs?"
                rows={2}
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors resize-none"
              />
            </div>

            {/* Photo upload */}
            <div>
              <label className="text-xs text-packd-gray mb-1 block">Add a photo (optional)</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPhotoPreview(URL.createObjectURL(file));
                }}
              />
              {photoPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-packd-border">
                  <img src={photoPreview} alt="Activity" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center"
                  >×</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-packd-border rounded-2xl py-5 flex flex-col items-center gap-2 text-packd-gray hover:border-packd-orange hover:text-packd-orange transition-all"
                >
                  <span className="text-2xl">📷</span>
                  <span className="text-xs font-semibold">Tap to add photo</span>
                </button>
              )}
            </div>

            <button
              onClick={handleLog}
              className="w-full packd-btn-primary py-3.5 text-sm font-bold orange-glow mt-2"
            >
              ⚡ Log Activity (+{SPORT_XP[form.type]} XP)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
