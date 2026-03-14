'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/AppContext';
import BottomNav from '../../components/BottomNav';

export default function MessagesPage() {
  const router = useRouter();
  const { conversations, user, unreadMessages } = useApp();
  const [search, setSearch] = useState('');

  const convList = Object.values(conversations).filter((c) =>
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: unread first, then by most recent message
  const sorted = [...convList].sort((a, b) => {
    if (a.unread !== b.unread) return b.unread - a.unread;
    return 0;
  });

  return (
    <div className="min-h-screen bg-packd-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur-md border-b border-packd-border px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-black text-white">Messages</h1>
            {unreadMessages > 0 && (
              <span className="bg-packd-orange text-white text-xs font-black px-2.5 py-1 rounded-full">
                {unreadMessages} new
              </span>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-packd-gray text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full bg-packd-card border border-packd-border rounded-2xl pl-9 pr-4 py-2.5 text-sm text-packd-text placeholder-packd-gray/60 focus:outline-none focus:border-packd-orange transition-colors"
            />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-3 space-y-1">
        {sorted.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-white font-bold mb-1">No conversations yet</p>
            <p className="text-packd-gray text-sm">Connect with athletes from your pack!</p>
          </div>
        )}

        {sorted.map((conv) => {
          const lastMsg = conv.messages[conv.messages.length - 1];
          return (
            <Link
              key={conv.user.id}
              href={`/messages/${conv.user.id}`}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-packd-card transition-all active:scale-[0.99]"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white ${conv.user.avatarColor}`}>
                  {conv.user.avatar}
                </div>
                {conv.user.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-packd-green border-2 border-packd-bg" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-bold ${conv.unread ? 'text-white' : 'text-packd-text'}`}>
                    {conv.user.name}
                  </span>
                  <span className="text-[10px] text-packd-gray flex-shrink-0">{lastMsg?.time}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs truncate ${conv.unread ? 'text-packd-text font-semibold' : 'text-packd-gray'}`}>
                    {lastMsg ? (lastMsg.fromMe ? `You: ${lastMsg.imageUrl ? '📷 Photo' : lastMsg.text}` : (lastMsg.imageUrl ? '📷 Photo' : lastMsg.text)) : 'No messages yet'}
                  </p>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-packd-orange text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold mt-0.5 inline-block ${
                  conv.user.sport === 'Running' ? 'text-packd-orange' :
                  conv.user.sport === 'Yoga' ? 'text-purple-400' :
                  conv.user.sport === 'CrossFit' ? 'text-red-400' :
                  conv.user.sport === 'Swimming' ? 'text-cyan-400' :
                  conv.user.sport === 'Hiking' ? 'text-emerald-400' :
                  'text-packd-gray'
                }`}>
                  {conv.user.sport}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* New DM hint */}
      <div className="max-w-lg mx-auto px-4 pt-2">
        <div className="packd-card p-4 flex items-center gap-3 border-dashed border-packd-border/60">
          <div className="w-10 h-10 rounded-2xl bg-packd-card2 border border-packd-border flex items-center justify-center text-xl">
            ➕
          </div>
          <div>
            <p className="text-sm font-semibold text-packd-text">Message an athlete</p>
            <p className="text-xs text-packd-gray">Find athletes in pack pages or events</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
