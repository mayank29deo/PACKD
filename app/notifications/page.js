'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/AppContext';
import BottomNav from '../../components/BottomNav';

const NOTIF_ICONS = {
  event: '📅',
  xp: '⚡',
  pack: '👥',
  challenge: '🏆',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, markAllNotificationsRead, unreadCount } = useApp();

  return (
    <div className="min-h-screen bg-packd-bg pb-24">
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur border-b border-packd-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-packd-gray hover:text-packd-text text-xl">←</button>
          <h1 className="text-lg font-black text-white flex-1">Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={markAllNotificationsRead} className="text-xs text-packd-orange font-semibold hover:underline">
              Mark all read
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-packd-gray text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`packd-card p-4 flex items-start gap-3 transition-all ${!n.read ? 'border-packd-orange/30 bg-packd-orange/5' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                  n.type === 'xp' ? 'bg-packd-orange/20' :
                  n.type === 'event' ? 'bg-blue-400/20' :
                  n.type === 'pack' ? 'bg-packd-green/20' :
                  'bg-packd-gold/20'
                }`}>
                  {NOTIF_ICONS[n.type] || '🔔'}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-packd-text leading-snug">{n.text}</p>
                  <p className="text-xs text-packd-gray mt-1">{n.time}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-packd-orange flex-shrink-0 mt-1" />}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
