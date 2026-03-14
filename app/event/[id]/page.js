'use client';
import { useParams, useRouter } from 'next/navigation';
import { useApp, SPORT_COLORS } from '../../../lib/AppContext';
import BottomNav from '../../../components/BottomNav';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { events, rsvps, toggleRsvp, packs, joinedPacks, toggleJoinPack } = useApp();

  const event = events.find((e) => e.id === id);
  if (!event) {
    return (
      <div className="min-h-screen bg-packd-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-packd-gray">Event not found</p>
          <button onClick={() => router.back()} className="mt-4 packd-btn-ghost px-4 py-2 text-sm">← Go back</button>
        </div>
      </div>
    );
  }

  const isRsvped = rsvps[event.id];
  const spotsLeft = event.max - event.rsvp;
  const fillPct = Math.min((event.rsvp / event.max) * 100, 100);
  const relatedPack = packs.find((p) => p.id === event.organizerId);

  const sportColor = SPORT_COLORS[event.sport] || 'text-packd-gray bg-packd-border/30';

  return (
    <div className="min-h-screen bg-packd-bg pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur border-b border-packd-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-packd-gray hover:text-packd-text text-xl">←</button>
          <h1 className="text-sm font-bold text-white flex-1 truncate">{event.title}</h1>
          <button className="text-packd-gray hover:text-packd-text text-lg">⋯</button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Hero card */}
        <div className="packd-card overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-packd-orange to-packd-orange-light" />
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sportColor}`}>{event.sport}</span>
              <span className={`text-sm font-bold ${event.cost === 'Free' ? 'text-packd-green' : 'text-packd-gold'}`}>
                {event.cost}
              </span>
            </div>
            <h2 className="text-xl font-black text-white mb-4">{event.title}</h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-packd-card2 rounded-xl p-3">
                <p className="text-[10px] text-packd-gray mb-0.5">DATE & TIME</p>
                <p className="text-sm font-bold text-white">{event.time}</p>
              </div>
              <div className="bg-packd-card2 rounded-xl p-3">
                <p className="text-[10px] text-packd-gray mb-0.5">VENUE</p>
                <p className="text-sm font-bold text-white truncate">{event.venue}</p>
              </div>
              <div className="bg-packd-card2 rounded-xl p-3">
                <p className="text-[10px] text-packd-gray mb-0.5">LEVEL</p>
                <p className="text-sm font-bold text-white">{event.level}</p>
              </div>
              {event.distance && (
                <div className="bg-packd-card2 rounded-xl p-3">
                  <p className="text-[10px] text-packd-gray mb-0.5">DISTANCE</p>
                  <p className="text-sm font-bold text-white">{event.distance}</p>
                </div>
              )}
            </div>

            {/* Spots */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-packd-gray mb-1.5">
                <span>{event.rsvp} going</span>
                <span>{spotsLeft} spots left</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${fillPct}%` }} />
              </div>
            </div>

            <button
              onClick={() => toggleRsvp(event.id)}
              className={`w-full py-3.5 text-sm font-bold rounded-xl transition-all ${
                isRsvped
                  ? 'bg-packd-green/10 border-2 border-packd-green text-packd-green'
                  : spotsLeft === 0
                  ? 'bg-packd-card2 text-packd-gray cursor-not-allowed border border-packd-border'
                  : 'packd-btn-primary orange-glow'
              }`}
              disabled={spotsLeft === 0 && !isRsvped}
            >
              {isRsvped ? '✓ You\'re going! (Cancel RSVP)' : spotsLeft === 0 ? 'Event Full' : 'RSVP — Join Event'}
            </button>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="packd-card p-4">
            <h3 className="text-sm font-bold text-white mb-2">About this event</h3>
            <p className="text-sm text-packd-gray leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Location */}
        <div className="packd-card p-4">
          <h3 className="text-sm font-bold text-white mb-3">Location</h3>
          <div className="bg-packd-card2 rounded-xl h-32 flex items-center justify-center mb-3 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_40%_50%,_#E8451A,_transparent_60%)]" />
            <div className="text-center relative z-10">
              <p className="text-3xl mb-1">📍</p>
              <p className="text-xs font-semibold text-white">{event.venue}</p>
            </div>
          </div>
          <p className="text-sm text-packd-text font-medium">{event.venue}</p>
          <p className="text-xs text-packd-gray">{event.area}, Bangalore</p>
        </div>

        {/* Organizer pack */}
        {relatedPack && (
          <div className="packd-card p-4">
            <h3 className="text-sm font-bold text-white mb-3">Organized by</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-packd-card2 border border-packd-border flex items-center justify-center text-2xl">
                {relatedPack.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white">{relatedPack.name}</p>
                  {relatedPack.verified && <span className="text-packd-orange text-xs">✓</span>}
                </div>
                <p className="text-xs text-packd-gray">{relatedPack.sport} · {relatedPack.members} members</p>
              </div>
              <button
                onClick={() => toggleJoinPack(relatedPack.id)}
                className={joinedPacks[relatedPack.id]
                  ? 'text-xs font-semibold text-packd-green border border-packd-green rounded-xl px-3 py-1.5'
                  : 'packd-btn-ghost text-xs px-3 py-1.5'}
              >
                {joinedPacks[relatedPack.id] ? '✓ Member' : 'Join Pack'}
              </button>
            </div>
          </div>
        )}

        {/* Attendees preview */}
        <div className="packd-card p-4">
          <h3 className="text-sm font-bold text-white mb-3">Attendees ({event.rsvp})</h3>
          <div className="flex flex-wrap gap-2">
            {['A', 'R', 'P', 'S', 'V', 'K'].map((initial, i) => (
              <div key={i} className="w-9 h-9 rounded-full bg-packd-card2 border border-packd-border flex items-center justify-center text-xs font-bold text-packd-gray">
                {initial}
              </div>
            ))}
            {event.rsvp > 6 && (
              <div className="w-9 h-9 rounded-full bg-packd-card2 border border-packd-border flex items-center justify-center text-[10px] font-bold text-packd-gray">
                +{event.rsvp - 6}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
