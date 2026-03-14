'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp, SPORT_COLORS } from '../../lib/AppContext';
import BottomNav from '../../components/BottomNav';

const SPORTS_FILTER = ['All', 'Running', 'Cycling', 'Football', 'Yoga', 'Swimming', 'CrossFit', 'Basketball', 'Tennis', 'Hiking'];
const VIEW_MODES = ['Events', 'Packs', 'Venues'];

const VENUES = [
  { name: 'Cubbon Park', sport: 'Running / Cycling', rating: 4.9, reviews: 284, area: 'Central', tags: ['Free', 'Open 24/7'] },
  { name: 'Playo Arena Indiranagar', sport: 'Football / Basketball', rating: 4.7, reviews: 156, area: 'Indiranagar', tags: ['₹150/hr', 'Floodlights'] },
  { name: 'Lalbagh Gardens', sport: 'Yoga / Walking', rating: 4.8, reviews: 312, area: 'South BLR', tags: ['Free', 'Morning only'] },
  { name: 'Ulsoor Lake', sport: 'Swimming / Cycling', rating: 4.5, reviews: 89, area: 'Central', tags: ['Free', 'Seasonal'] },
  { name: 'Koramangala Indoor Stadium', sport: 'Basketball / Badminton', rating: 4.6, reviews: 201, area: 'Koramangala', tags: ['₹200/hr', 'AC'] },
  { name: 'CrossFit Bangalore HSR', sport: 'CrossFit / HIIT', rating: 4.8, reviews: 143, area: 'HSR Layout', tags: ['₹300/session', 'Coaches'] },
];

export default function ExplorePage() {
  const { events, packs, rsvps, toggleRsvp, joinedPacks, toggleJoinPack } = useApp();
  const [sport, setSport] = useState('All');
  const [view, setView] = useState('Events');
  const [search, setSearch] = useState('');

  const filteredEvents = events.filter((e) => {
    const matchSport = sport === 'All' || e.sport === sport;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || (e.area || '').toLowerCase().includes(search.toLowerCase());
    return matchSport && matchSearch;
  });

  const filteredPacks = packs.filter((p) => {
    const matchSport = sport === 'All' || p.sport === sport;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchSport && matchSearch;
  });

  return (
    <div className="min-h-screen bg-packd-bg pb-24">
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur border-b border-packd-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-black text-white mb-3">Explore</h1>
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-packd-gray text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events, packs, venues…"
              className="w-full bg-packd-card border border-packd-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-packd-card rounded-xl p-1 mb-3">
            {VIEW_MODES.map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  view === m ? 'bg-packd-orange text-white' : 'text-packd-gray hover:text-packd-text'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SPORTS_FILTER.map((s) => (
              <button key={s} onClick={() => setSport(s)} className={sport === s ? 'sport-pill-active whitespace-nowrap' : 'sport-pill whitespace-nowrap'}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {view === 'Events' && (
          <div className="space-y-3">
            <p className="text-xs text-packd-gray">{filteredEvents.length} events near you</p>
            {filteredEvents.map((ev) => (
              <Link key={ev.id} href={`/event/${ev.id}`} className="block packd-card card-hover p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SPORT_COLORS[ev.sport] || 'text-packd-gray bg-packd-border'}`}>
                    {ev.sport}
                  </span>
                  <span className={`text-xs font-semibold ${ev.cost === 'Free' ? 'text-packd-green' : 'text-packd-gold'}`}>
                    {ev.cost}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{ev.title}</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-packd-gray mb-3">
                  <span>📍 {ev.venue} · {ev.area}</span>
                  <span>🕐 {ev.time}</span>
                  {ev.distance && <span>📏 {ev.distance}</span>}
                  <span>🎯 {ev.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="h-1 bg-packd-border rounded-full overflow-hidden w-20">
                        <div className="h-full bg-packd-orange rounded-full" style={{ width: `${(ev.rsvp / ev.max) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-packd-gray">{ev.rsvp}/{ev.max}</span>
                    </div>
                    <span className="text-[10px] text-packd-gray">{ev.max - ev.rsvp} spots left</span>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); toggleRsvp(ev.id); }}
                    className={rsvps[ev.id] ? 'text-xs font-semibold text-packd-green border border-packd-green rounded-xl px-3 py-1.5' : 'packd-btn-primary text-xs px-3 py-1.5'}
                  >
                    {rsvps[ev.id] ? '✓ Going' : 'RSVP'}
                  </button>
                </div>
              </Link>
            ))}
            {filteredEvents.length === 0 && (
              <div className="text-center py-12 text-packd-gray">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">No events found</p>
                <Link href="/create" className="text-packd-orange text-xs mt-1 block">Create one →</Link>
              </div>
            )}
          </div>
        )}

        {view === 'Packs' && (
          <div className="space-y-3">
            <p className="text-xs text-packd-gray">{filteredPacks.length} packs in Bangalore</p>
            {filteredPacks.map((pack) => (
              <div key={pack.id} className="packd-card card-hover p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-packd-card2 border border-packd-border flex items-center justify-center text-2xl flex-shrink-0">
                  {pack.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-bold text-white truncate">{pack.name}</span>
                    {pack.verified && <span className="text-packd-orange text-xs flex-shrink-0">✓</span>}
                  </div>
                  <p className="text-xs text-packd-gray">{pack.sport} · {pack.level}</p>
                  <p className="text-xs text-packd-gray">{pack.area} · {pack.members} members</p>
                </div>
                <button
                  onClick={() => toggleJoinPack(pack.id)}
                  className={joinedPacks[pack.id] ? 'text-xs font-semibold text-packd-green border border-packd-green rounded-xl px-3 py-2 flex-shrink-0' : 'packd-btn-ghost text-xs px-3 py-2 flex-shrink-0'}
                >
                  {joinedPacks[pack.id] ? '✓ Joined' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        )}

        {view === 'Venues' && (
          <div className="space-y-3">
            <p className="text-xs text-packd-gray">Community-rated venues near you</p>
            <div className="packd-card rounded-2xl overflow-hidden h-48 flex items-center justify-center bg-packd-card2 relative">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_40%,_#E8451A,_transparent_50%),radial-gradient(circle_at_70%_70%,_#3fb950,_transparent_40%)]" />
              <div className="text-center relative z-10">
                <p className="text-4xl mb-2">🗺️</p>
                <p className="text-sm font-semibold text-white">Interactive Map</p>
                <p className="text-xs text-packd-gray">Bangalore venue map</p>
              </div>
            </div>
            {VENUES.map((v) => (
              <div key={v.name} className="packd-card card-hover p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-bold text-white">{v.name}</h3>
                  <span className="text-xs text-packd-gold font-semibold flex-shrink-0 ml-2">★ {v.rating}</span>
                </div>
                <p className="text-xs text-packd-gray mb-2">{v.sport} · {v.area} · {v.reviews} reviews</p>
                <div className="flex gap-2 flex-wrap">
                  {v.tags.map((t) => (
                    <span key={t} className="text-[10px] bg-packd-card2 text-packd-gray rounded-full px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
