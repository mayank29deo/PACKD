'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/AppContext';
import BottomNav from '../../components/BottomNav';

const SPORTS = ['Running', 'Cycling', 'Football', 'Yoga', 'Swimming', 'CrossFit', 'Basketball', 'Tennis', 'Hiking', 'Badminton', 'Boxing', 'Other'];
const LEVELS = ['All levels', 'Beginner', 'Intermediate', 'Advanced', 'Rx / Competitive'];
const STEPS = ['Type', 'Details', 'Venue', 'Settings', 'Preview'];

export default function CreatePage() {
  const router = useRouter();
  const { user } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    sport: '', title: '', date: '', time: '', duration: '60',
    venue: '', area: '', level: 'All levels', max: '20', cost: 'Free', description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const coverFileRef = useRef(null);

  function update(k, v) { setForm((p) => ({ ...p, [k]: v })); }
  function next() { if (step < STEPS.length - 1) setStep((s) => s + 1); }
  function back() { if (step > 0) setStep((s) => s - 1); }

  async function handlePublish() {
    setPublishing(true);
    // Build ISO date_time from date + time fields
    const date_time = form.date && form.time
      ? new Date(`${form.date}T${form.time}`).toISOString()
      : form.date
        ? new Date(`${form.date}T07:00:00`).toISOString()
        : new Date().toISOString();

    await fetch('/api/community-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title || `${form.sport} Event`,
        sport: form.sport || 'Sports',
        description: form.description,
        venue: form.venue || 'TBD',
        area: form.area,
        city: 'Bangalore',
        date_time,
        cost: form.cost || 'Free',
        max_attendees: parseInt(form.max) || null,
      }),
    }).catch(() => {});

    setPublishing(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-packd-bg flex flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-white mb-2">Event Created!</h2>
        <p className="text-packd-gray text-sm mb-1">Your event is live. +200 XP earned!</p>
        <p className="text-xs text-packd-gray mb-6">Athletes in Bangalore will see it in Explore.</p>
        <div className="packd-card p-5 w-full max-w-sm mb-6 text-left">
          <h3 className="text-sm font-bold text-white mb-3">{form.title || 'Your Event'}</h3>
          <div className="space-y-1.5 text-xs text-packd-gray">
            <p>🏅 {form.sport}</p>
            <p>📅 {form.date} · {form.time}</p>
            <p>📍 {form.venue}{form.area ? `, ${form.area}` : ''}</p>
            <p>🎯 {form.level}</p>
            <p>👥 0/{form.max} going</p>
            <p className={form.cost === 'Free' ? 'text-packd-green' : 'text-packd-gold'}>💰 {form.cost}</p>
          </div>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={() => router.push('/explore')} className="flex-1 packd-btn-ghost py-3 text-sm">View in Explore</button>
          <button onClick={() => router.push('/feed')} className="flex-1 packd-btn-primary py-3 text-sm">Back to Feed →</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-packd-bg pb-24">
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur border-b border-packd-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 ? (
            <button onClick={back} className="text-packd-gray hover:text-packd-text text-xl">←</button>
          ) : (
            <button onClick={() => router.back()} className="text-packd-gray hover:text-packd-text text-xl">←</button>
          )}
          <h1 className="text-lg font-black text-white flex-1">Create Event</h1>
          <span className="text-xs text-packd-gray">{step + 1}/{STEPS.length}</span>
        </div>
        <div className="max-w-lg mx-auto mt-3">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-packd-orange' : 'bg-packd-border'}`} />
              </div>
            ))}
          </div>
          <p className="text-xs text-packd-gray mt-2">{STEPS[step]}</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-black text-white mb-2">What sport is this for?</h2>
            <p className="text-packd-gray text-sm mb-6">Your event will be shown to athletes who follow this sport.</p>
            <div className="grid grid-cols-3 gap-2">
              {SPORTS.map((s) => (
                <button key={s} onClick={() => update('sport', s)}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    form.sport === s ? 'bg-packd-orange border-packd-orange text-white' : 'bg-packd-card border-packd-border text-packd-gray hover:border-packd-orange hover:text-packd-text'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white mb-1">Event details</h2>
            <div>
              <label className="text-xs text-packd-gray mb-1 block">Event title *</label>
              <input value={form.title} onChange={(e) => update('title', e.target.value)}
                placeholder={`e.g. Sunday ${form.sport} @ Cubbon Park`}
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-packd-gray mb-1 block">Date *</label>
                <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)}
                  className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text focus:outline-none focus:border-packd-orange transition-colors" />
              </div>
              <div>
                <label className="text-xs text-packd-gray mb-1 block">Time *</label>
                <input type="time" value={form.time} onChange={(e) => update('time', e.target.value)}
                  className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text focus:outline-none focus:border-packd-orange transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-xs text-packd-gray mb-1 block">Duration (minutes)</label>
              <input type="number" value={form.duration} onChange={(e) => update('duration', e.target.value)}
                placeholder="60" className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text focus:outline-none focus:border-packd-orange transition-colors" />
            </div>
            <div>
              <label className="text-xs text-packd-gray mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                placeholder="Tell people what to expect, what to bring…" rows={3}
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors resize-none" />
            </div>
            {/* Cover photo */}
            <div>
              <label className="text-xs text-packd-gray mb-1 block">Cover photo (optional)</label>
              <input ref={coverFileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setCoverPhoto(URL.createObjectURL(file));
                }}
              />
              {coverPhoto ? (
                <div className="relative rounded-2xl overflow-hidden border border-packd-border">
                  <img src={coverPhoto} alt="Cover" className="w-full h-36 object-cover" />
                  <button type="button" onClick={() => setCoverPhoto(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center">×</button>
                </div>
              ) : (
                <button type="button" onClick={() => coverFileRef.current?.click()}
                  className="w-full border border-dashed border-packd-border rounded-2xl py-5 flex flex-col items-center gap-2 text-packd-gray hover:border-packd-orange hover:text-packd-orange transition-all">
                  <span className="text-2xl">🖼️</span>
                  <span className="text-xs font-semibold">Add cover photo</span>
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white mb-1">Where is it?</h2>
            <div>
              <label className="text-xs text-packd-gray mb-1 block">Venue name *</label>
              <input value={form.venue} onChange={(e) => update('venue', e.target.value)}
                placeholder="e.g. Cubbon Park Main Gate"
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors" />
            </div>
            <div>
              <label className="text-xs text-packd-gray mb-1 block">Area / Neighbourhood</label>
              <input value={form.area} onChange={(e) => update('area', e.target.value)}
                placeholder="e.g. Koramangala, HSR Layout…"
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors" />
            </div>
            <div className="packd-card rounded-2xl h-40 flex items-center justify-center bg-packd-card2">
              <div className="text-center"><p className="text-3xl mb-2">📍</p><p className="text-xs text-packd-gray">Tap to pin on map</p></div>
            </div>
            <p className="text-xs text-packd-gray">Popular: Cubbon Park · Lalbagh · Nandi Hills · Ulsoor Lake · Playo Arenas</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white mb-1">Event settings</h2>
            <div>
              <label className="text-xs text-packd-gray mb-2 block">Skill level</label>
              <div className="space-y-2">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => update('level', l)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      form.level === l ? 'bg-packd-orange/10 border-packd-orange text-packd-orange' : 'bg-packd-card border-packd-border text-packd-gray'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-packd-gray mb-1 block">Max participants</label>
              <input type="number" value={form.max} onChange={(e) => update('max', e.target.value)}
                className="w-full bg-packd-card border border-packd-border rounded-xl px-4 py-3 text-sm text-packd-text focus:outline-none focus:border-packd-orange transition-colors" />
            </div>
            <div>
              <label className="text-xs text-packd-gray mb-1 block">Cost per person</label>
              <div className="flex gap-2 flex-wrap">
                {['Free', '₹100', '₹200', '₹500', 'Custom'].map((c) => (
                  <button key={c} onClick={() => update('cost', c)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      form.cost === c ? 'bg-packd-orange border-packd-orange text-white' : 'bg-packd-card border-packd-border text-packd-gray'
                    }`}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-black text-white mb-4">Preview your event</h2>
            <div className="packd-card p-5 mb-4 orange-glow overflow-hidden">
              {coverPhoto && (
                <div className="-mx-5 -mt-5 mb-4">
                  <img src={coverPhoto} alt="Cover" className="w-full h-36 object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-packd-orange bg-packd-orange/10">{form.sport || 'Sport'}</span>
                <span className={`text-xs font-semibold ${form.cost === 'Free' ? 'text-packd-green' : 'text-packd-gold'}`}>{form.cost}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{form.title || 'Event Title'}</h3>
              <div className="space-y-1.5 text-xs text-packd-gray mb-3">
                <p>📅 {form.date || 'Date TBD'} · {form.time || 'Time TBD'} · {form.duration} min</p>
                <p>📍 {form.venue || 'Venue TBD'}{form.area ? `, ${form.area}` : ''}</p>
                <p>🎯 {form.level || 'All levels'}</p>
                <p>👥 0/{form.max} spots</p>
              </div>
              {form.description && <p className="text-xs text-packd-text leading-relaxed">{form.description}</p>}
            </div>
            <div className="packd-card p-4 mb-4 flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-sm font-bold text-white">Publishing earns +200 XP</p>
                <p className="text-xs text-packd-gray">Help grow the community by sharing events</p>
              </div>
            </div>
            <p className="text-xs text-packd-gray text-center mb-4">Ready to publish? Athletes in Bangalore will see this event.</p>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step < STEPS.length - 1 ? (
            <button onClick={next} disabled={step === 0 && !form.sport}
              className="flex-1 packd-btn-primary py-3 text-sm disabled:opacity-50">
              Continue →
            </button>
          ) : (
            <button onClick={handlePublish} disabled={publishing} className="flex-1 packd-btn-primary py-3 text-sm orange-glow disabled:opacity-50">
              {publishing ? 'Publishing…' : '🚀 Publish Event'}
            </button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
