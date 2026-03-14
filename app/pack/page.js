'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp, SPORT_COLORS } from '../../lib/AppContext';
import BottomNav from '../../components/BottomNav';

const LEADERBOARD = [
  { rank: 1, name: 'Arjun M.', xp: 4820, badge: '🏆', avatar: 'A' },
  { rank: 2, name: 'Priya S.', xp: 4150, badge: '🥈', avatar: 'P' },
  { rank: 3, name: 'Rahul K.', xp: 3940, badge: '🥉', avatar: 'R' },
  { rank: 4, name: 'Sneha D.', xp: 3210, badge: null, avatar: 'S' },
  { rank: 5, name: 'Vikram N.', xp: 2980, badge: null, avatar: 'V' },
  { rank: 6, name: 'Ananya T.', xp: 2750, badge: null, avatar: 'A' },
  { rank: 7, name: 'Rohan P.', xp: 2600, badge: null, avatar: 'R' },
  { rank: 8, name: 'You', xp: 2840, badge: null, avatar: 'Y', isMe: true },
];

const PACK_TABS = ['Feed', 'Events', 'Members', 'Leaderboard'];

export default function PackPage() {
  const { packs, events, joinedPacks, toggleJoinPack, rsvps, toggleRsvp, user } = useApp();
  const [tab, setTab] = useState('Feed');

  // Use the first joined pack or the first pack
  const myPackId = Object.keys(joinedPacks).find((id) => joinedPacks[id]) || packs[0]?.id;
  const pack = packs.find((p) => p.id === myPackId) || packs[0];

  const packEvents = events.filter((e) => e.organizerId === pack?.id).slice(0, 4);

  const sortedLB = [...LEADERBOARD].sort((a, b) => b.xp - a.xp);

  const PACK_FEED = [
    { id: 'pf1', user: 'Arjun M.', avatar: 'A', action: `Set a new PB! 10K in 45:22 🔥`, time: '30m ago', likes: 18 },
    { id: 'pf2', user: 'Priya S.', avatar: 'P', action: `Who's joining this weekend? I'm bringing energy gels 🤝`, time: '2h ago', likes: 9 },
    { id: 'pf3', user: 'Rahul K.', avatar: 'R', action: 'Completed the monthly challenge! 💯', time: '5h ago', likes: 34 },
  ];

  if (!pack) {
    return (
      <div className="min-h-screen bg-packd-bg flex flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="text-4xl mb-3">👥</p>
        <h2 className="text-xl font-black text-white mb-2">No Pack Yet</h2>
        <p className="text-packd-gray text-sm mb-6">Join a pack to see their feed, events, and leaderboard.</p>
        <Link href="/explore?view=Packs" className="packd-btn-primary px-6 py-3 text-sm">Find a Pack →</Link>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-packd-bg pb-24">
      {/* Pack Hero */}
      <div className="relative bg-card-gradient border-b border-packd-border">
        <div className="absolute inset-0 bg-orange-glow opacity-40 pointer-events-none" />
        <div className="relative max-w-lg mx-auto px-4 pt-12 pb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-packd-orange flex items-center justify-center text-3xl flex-shrink-0">
              {pack.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-white">{pack.name}</h1>
                {pack.verified && <span className="text-packd-orange text-sm">✓</span>}
              </div>
              <p className="text-xs text-packd-gray mb-1">{pack.sport} · {pack.level}</p>
              <p className="text-xs text-packd-gray">📍 {pack.area}</p>
            </div>
            <button
              onClick={() => toggleJoinPack(pack.id)}
              className={joinedPacks[pack.id] ? 'text-xs font-semibold text-packd-green border border-packd-green rounded-xl px-4 py-2 flex-shrink-0' : 'packd-btn-primary text-xs px-4 py-2 flex-shrink-0'}
            >
              {joinedPacks[pack.id] ? '✓ Member' : 'Join Pack'}
            </button>
          </div>
          <p className="text-sm text-packd-gray italic mb-4">"{pack.tagline}"</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { v: pack.members, l: 'Members' },
              { v: pack.events, l: 'Events' },
              { v: `${pack.streak}🔥`, l: 'Streak' },
              { v: `${(pack.xp / 1000).toFixed(0)}K`, l: 'Total XP' },
            ].map(({ v, l }) => (
              <div key={l} className="bg-packd-card/50 rounded-xl py-2">
                <p className="text-base font-black text-white">{v}</p>
                <p className="text-[10px] text-packd-gray">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-packd-bg border-b border-packd-border">
        <div className="max-w-lg mx-auto px-4 flex gap-1 py-2">
          {PACK_TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${tab === t ? 'bg-packd-orange text-white' : 'text-packd-gray hover:text-packd-text'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {tab === 'Feed' && (
          <div className="space-y-3">
            {PACK_FEED.map((p) => (
              <div key={p.id} className="packd-card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-packd-orange/20 border border-packd-orange/30 flex items-center justify-center text-sm font-bold text-packd-orange">{p.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{p.user}</p>
                    <p className="text-xs text-packd-gray">{p.time}</p>
                  </div>
                </div>
                <p className="text-sm text-packd-text mb-3">{p.action}</p>
                <div className="flex gap-4 text-xs text-packd-gray">
                  <button className="hover:text-packd-orange transition-colors">❤️ {p.likes}</button>
                  <button className="hover:text-packd-text transition-colors">💬 Reply</button>
                </div>
              </div>
            ))}
            <button className="w-full packd-btn-ghost py-3 text-sm">+ Post to Pack</button>
          </div>
        )}

        {tab === 'Events' && (
          <div className="space-y-3">
            {packEvents.length > 0 ? packEvents.map((ev) => (
              <Link key={ev.id} href={`/event/${ev.id}`} className="block packd-card p-4">
                <h3 className="text-sm font-bold text-white mb-1">{ev.title}</h3>
                <div className="text-xs text-packd-gray mb-3">
                  <p>🕐 {ev.time}</p>
                  <p>📍 {ev.venue}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-1 bg-packd-border rounded-full w-32 overflow-hidden mb-1">
                      <div className="h-full bg-packd-orange rounded-full" style={{ width: `${(ev.rsvp / ev.max) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-packd-gray">{ev.rsvp}/{ev.max} going</p>
                  </div>
                  <button
                    onClick={(e) => { e.preventDefault(); toggleRsvp(ev.id); }}
                    className={rsvps[ev.id] ? 'text-xs font-semibold text-packd-green border border-packd-green rounded-xl px-3 py-1.5' : 'packd-btn-primary text-xs px-3 py-1.5'}
                  >
                    {rsvps[ev.id] ? '✓ Going' : 'RSVP'}
                  </button>
                </div>
              </Link>
            )) : (
              <div className="text-center py-10 text-packd-gray">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm">No upcoming events</p>
                <Link href="/create" className="text-packd-orange text-xs mt-1 block">Create one →</Link>
              </div>
            )}
          </div>
        )}

        {tab === 'Members' && (
          <div className="space-y-2">
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-packd-gray text-sm">🔍</span>
              <input placeholder="Search members…" className="w-full bg-packd-card border border-packd-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-packd-text placeholder-packd-gray focus:outline-none focus:border-packd-orange transition-colors" />
            </div>
            {LEADERBOARD.map((m) => (
              <div key={m.name + m.rank} className={`packd-card p-3 flex items-center gap-3 ${m.isMe ? 'border-packd-orange/40' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${m.isMe ? 'bg-packd-orange text-white' : 'bg-packd-card2 text-packd-gray'}`}>
                  {m.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{m.name}{m.isMe && ' (You)'}</p>
                  <p className="text-xs text-packd-gray">{m.xp.toLocaleString()} XP</p>
                </div>
                {m.badge && <span className="text-lg">{m.badge}</span>}
              </div>
            ))}
          </div>
        )}

        {tab === 'Leaderboard' && (
          <div>
            <div className="text-center mb-6">
              <p className="text-xs text-packd-gray mb-1">March Sprint</p>
              <h2 className="text-lg font-black text-white">Monthly Leaderboard</h2>
              <p className="text-xs text-packd-gray mt-1">Resets Apr 1 · Your rank: <span className="text-packd-orange font-bold">#8</span></p>
            </div>
            {/* Top 3 podium */}
            <div className="flex items-end justify-center gap-2 mb-6 h-32">
              {[sortedLB[1], sortedLB[0], sortedLB[2]].map((m, i) => {
                const heights = ['h-24', 'h-32', 'h-20'];
                const colors = ['bg-packd-gray/30', 'bg-packd-gold/20', 'bg-packd-orange/20'];
                return (
                  <div key={m.name + i} className={`flex-1 ${heights[i]} ${colors[i]} rounded-t-2xl flex flex-col items-center justify-end p-2 border-t border-packd-border`}>
                    <p className="text-lg font-black text-white">{i === 1 ? '🏆' : i === 0 ? '🥈' : '🥉'}</p>
                    <p className="text-xs font-bold text-white truncate w-full text-center">{m.name}</p>
                    <p className="text-[10px] text-packd-gray">{(m.xp / 1000).toFixed(1)}K</p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              {sortedLB.map((m, i) => (
                <div key={m.name + i} className={`packd-card p-3 flex items-center gap-3 ${m.isMe ? 'border-packd-orange/50 bg-packd-orange/5' : ''}`}>
                  <span className={`text-sm font-black w-6 text-center ${i < 3 ? 'text-packd-gold' : 'text-packd-gray'}`}>{i + 1}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${m.isMe ? 'bg-packd-orange text-white' : 'bg-packd-card2 text-packd-gray'}`}>
                    {m.avatar}
                  </div>
                  <p className="flex-1 text-sm font-semibold text-white">{m.name}{m.isMe && <span className="text-packd-orange text-xs"> (You)</span>}</p>
                  <p className="text-sm font-bold text-packd-gold">{m.xp.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
