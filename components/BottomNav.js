'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── Custom icon set ──────────────────────────────────────────────────────────
// All icons: 24×24 viewBox, 1.6px strokes, one filled accent, active = #E8451A

/** Home — V-formation pack mark (3 dots + motion trails + connecting V-lines) */
function HomeIcon({ active }) {
  const c = active ? '#E8451A' : 'currentColor';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4.5" r="2.2" fill={c} />
      <circle cx="5.5" cy="11.5" r="2.2" fill={c} opacity={active ? 1 : 0.7} />
      <circle cx="18.5" cy="11.5" r="2.2" fill={c} opacity={active ? 1 : 0.7} />
      <rect x="11.2" y="8" width="1.6" height="3.2" rx="0.8" fill={c} opacity="0.35" />
      <rect x="4.7" y="15" width="1.6" height="2.8" rx="0.8" fill={c} opacity="0.25" />
      <rect x="17.7" y="15" width="1.6" height="2.8" rx="0.8" fill={c} opacity="0.25" />
      <line x1="10.2" y1="6.2" x2="6.8" y2="10" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      <line x1="13.8" y1="6.2" x2="17.2" y2="10" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** Explore — compass rose: outer ring + filled north arrow + faded south + centre dot */
function ExploreIcon({ active }) {
  const c = active ? '#E8451A' : 'currentColor';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" />
      {/* North — solid */}
      <path d="M12 4.5 L10.2 11 L12 9.6 L13.8 11 Z" fill={c} />
      {/* South — ghost */}
      <path d="M12 19.5 L10.2 13 L12 14.4 L13.8 13 Z" fill={c} opacity="0.3" />
      {/* East / West tick marks */}
      <line x1="20.5" y1="12" x2="19" y2="12" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      <line x1="3.5" y1="12" x2="5" y2="12" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
      <circle cx="12" cy="12" r="1.4" fill={c} />
    </svg>
  );
}

/** Create (FAB) — bold plus with a small spark dot at top-right */
function CreateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="4" x2="12" y2="20" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="18.5" cy="5.5" r="2" fill="white" opacity="0.6" />
    </svg>
  );
}

/** Calorie Tracker — apple silhouette with a small leaf and a lightning bolt */
function CalorieIcon({ active }) {
  const c = active ? '#E8451A' : 'currentColor';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Apple body */}
      <path
        d="M17.5 8.5C17.5 8.5 19 9.5 19 13C19 17 16.5 20.5 14 20.5C12.8 20.5 12 20 12 20C12 20 11.2 20.5 10 20.5C7.5 20.5 5 17 5 13C5 9.5 6.5 8.5 6.5 8.5C6.5 8.5 8 7.5 9.5 8C10.5 8.3 11.2 8.5 12 8.5C12.8 8.5 13.5 8.3 14.5 8C16 7.5 17.5 8.5 17.5 8.5Z"
        stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill={active ? `${c}22` : 'none'}
      />
      {/* Leaf/stem */}
      <path d="M12 8.5C12 8.5 12 6 14 4.5" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      {/* Lightning bolt inside */}
      <path d="M13 11 L10.5 14 H12.5 L11 17 L14 13.5 H12 Z" fill={c} opacity={active ? 1 : 0.8} />
    </svg>
  );
}

/** Pack tab — equilateral triangle of nodes connected by lines (network/crew) */
function PackIcon({ active }) {
  const c = active ? '#E8451A' : 'currentColor';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="4.5" x2="4.5" y2="18" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      <line x1="12" y1="4.5" x2="19.5" y2="18" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      <line x1="4.5" y1="18" x2="19.5" y2="18" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      {/* Top node — leader */}
      <circle cx="12" cy="4.5" r="2.4" fill={c} />
      {/* Bottom nodes */}
      <circle cx="4.5" cy="18" r="2.4" fill={c} opacity={active ? 0.85 : 0.65} />
      <circle cx="19.5" cy="18" r="2.4" fill={c} opacity={active ? 0.85 : 0.65} />
    </svg>
  );
}

/** Me — minimal person: solid head circle + open-arc shoulders */
function MeIcon({ active }) {
  const c = active ? '#E8451A' : 'currentColor';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Head */}
      <circle cx="12" cy="7" r="3" fill={c} />
      {/* Shoulders arc */}
      <path
        d="M5 20.5 C5 15.8 8.1 12.5 12 12.5 C15.9 12.5 19 15.8 19 20.5"
        stroke={c} strokeWidth="1.8" strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { href: '/feed',                      label: 'Home',    Icon: HomeIcon    },
  { href: '/explore',                   label: 'Explore', Icon: ExploreIcon },
  { href: '/create',                    label: 'Create',  Icon: CreateIcon, fab: true },
  { href: '/calories',                  label: 'Calories', Icon: CalorieIcon },
  { href: '/pack',                      label: 'Pack',    Icon: PackIcon    },
  { href: '/profile',                   label: 'Me',      Icon: MeIcon      },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-packd-card/95 backdrop-blur-md border-t border-packd-border">
      <div className="max-w-lg mx-auto flex items-end justify-around py-2">
        {TABS.map(({ href, label, Icon, fab }) => {
          const active = pathname === href || pathname.startsWith(href.split('?')[0] + '/') || pathname === href.split('?')[0];

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 pb-1 rounded-xl transition-all duration-150 relative ${
                active ? 'text-packd-orange' : 'text-packd-gray hover:text-packd-text'
              }`}
            >
              {fab ? (
                <span className="bg-packd-orange rounded-full w-11 h-11 flex items-center justify-center -mt-5 shadow-lg shadow-packd-orange/30">
                  <Icon />
                </span>
              ) : (
                <Icon active={active} />
              )}
              <span className="text-[9px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
