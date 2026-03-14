'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useApp, SPORT_COLORS } from '../lib/AppContext';

function EventSwipeCard({ event, onSwipeRight, onSwipeLeft, onSkip, isTop, nextEvent }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swiping, setSwiping] = useState(null); // 'right' | 'left' | null
  const startPos = useRef({ x: 0, y: 0 });
  const { rsvps } = useApp();

  const THRESHOLD = 90;

  const handleStart = useCallback((clientX, clientY) => {
    if (!isTop) return;
    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  }, [isTop]);

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDragging) return;
    setOffset({ x: clientX - startPos.current.x, y: clientY - startPos.current.y });
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offset.x > THRESHOLD) {
      setSwiping('right');
      setTimeout(() => { onSwipeRight(event); setSwiping(null); setOffset({ x: 0, y: 0 }); }, 350);
    } else if (offset.x < -THRESHOLD) {
      setSwiping('left');
      setTimeout(() => { onSwipeLeft(event); setSwiping(null); setOffset({ x: 0, y: 0 }); }, 350);
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }, [isDragging, offset.x, event, onSwipeRight, onSwipeLeft]);

  const rotation = isTop ? offset.x * 0.07 : 0;
  const translateX = swiping === 'right' ? 500 : swiping === 'left' ? -500 : isTop ? offset.x : 0;
  const translateY = isTop ? offset.y * 0.15 : 0;
  const scale = isTop ? 1 : 0.94;
  const cardOpacity = swiping ? 0 : 1;

  const showGoing = isTop && (swiping === 'right' || offset.x > 50);
  const showSkip = isTop && (swiping === 'left' || offset.x < -50);
  const goingOpacity = Math.min(Math.abs(offset.x) / THRESHOLD, 1);

  const sportColor = SPORT_COLORS[event.sport] || 'text-packd-gray bg-packd-border/30';

  return (
    <div
      className="absolute inset-0"
      style={{
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        opacity: cardOpacity,
        zIndex: isTop ? 10 : 5,
        cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: isTop ? 'none' : 'auto',
        userSelect: 'none',
      }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => { e.preventDefault(); handleStart(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchMove={(e) => { e.preventDefault(); handleMove(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={handleEnd}
    >
      <div className="w-full h-full bg-packd-card rounded-3xl border border-packd-border overflow-hidden flex flex-col">
        {/* Color strip at top based on sport */}
        <div className={`h-1.5 w-full ${
          event.sport === 'Running' ? 'bg-packd-orange' :
          event.sport === 'Cycling' ? 'bg-blue-400' :
          event.sport === 'Yoga' ? 'bg-purple-400' :
          event.sport === 'Football' ? 'bg-packd-green' :
          event.sport === 'CrossFit' ? 'bg-red-400' :
          event.sport === 'Swimming' ? 'bg-cyan-400' :
          event.sport === 'Hiking' ? 'bg-emerald-400' :
          event.sport === 'Basketball' ? 'bg-packd-gold' :
          'bg-packd-orange'
        }`} />

        <div className="flex-1 p-5 flex flex-col">
          {/* Sport + Cost badges */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${sportColor}`}>{event.sport}</span>
            <span className={`text-sm font-black ${event.cost === 'Free' ? 'text-packd-green' : 'text-packd-gold'}`}>{event.cost}</span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-white leading-tight mb-2">{event.title}</h3>

          {/* Description */}
          {event.description && (
            <p className="text-xs text-packd-gray leading-relaxed mb-4 flex-1">{event.description}</p>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-packd-card2 rounded-xl p-2.5">
              <p className="text-[10px] text-packd-gray mb-0.5">WHEN</p>
              <p className="text-xs font-bold text-white">{event.time}</p>
            </div>
            <div className="bg-packd-card2 rounded-xl p-2.5">
              <p className="text-[10px] text-packd-gray mb-0.5">WHERE</p>
              <p className="text-xs font-bold text-white truncate">{event.venue}</p>
            </div>
            <div className="bg-packd-card2 rounded-xl p-2.5">
              <p className="text-[10px] text-packd-gray mb-0.5">LEVEL</p>
              <p className="text-xs font-bold text-white">{event.level}</p>
            </div>
            <div className="bg-packd-card2 rounded-xl p-2.5">
              <p className="text-[10px] text-packd-gray mb-0.5">SPOTS</p>
              <p className="text-xs font-bold text-white">{event.max - event.rsvp} left</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-packd-gray mb-1">
              <span>{event.rsvp} going</span>
              <span>{event.max} max</span>
            </div>
            <div className="h-1.5 bg-packd-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-packd-orange to-packd-orange-light rounded-full transition-all"
                style={{ width: `${Math.min((event.rsvp / event.max) * 100, 100)}%` }} />
            </div>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-packd-orange/20 flex items-center justify-center text-[10px] font-bold text-packd-orange">
              {event.organizer?.[0] || 'P'}
            </div>
            <p className="text-[11px] text-packd-gray">{event.organizer}</p>
          </div>
        </div>

        {/* Swipe hint footer */}
        {isTop && (
          <div className="px-5 pb-4 flex items-center justify-center gap-2">
            <span className="text-[10px] text-packd-gray/60">← skip</span>
            <div className="flex-1 h-px bg-packd-border/40" />
            <span className="text-[10px] text-packd-gray/60">swipe</span>
            <div className="flex-1 h-px bg-packd-border/40" />
            <span className="text-[10px] text-packd-gray/60">going →</span>
          </div>
        )}
      </div>

      {/* GOING overlay */}
      {showGoing && (
        <div className="absolute top-6 left-5 pointer-events-none"
          style={{ opacity: goingOpacity }}>
          <div className="border-[3px] border-packd-green rounded-xl px-3 py-1 rotate-[-18deg]">
            <p className="text-packd-green font-black text-lg tracking-wide">GOING ✓</p>
          </div>
        </div>
      )}

      {/* SKIP overlay */}
      {showSkip && (
        <div className="absolute top-6 right-5 pointer-events-none"
          style={{ opacity: goingOpacity }}>
          <div className="border-[3px] border-red-400 rounded-xl px-3 py-1 rotate-[18deg]">
            <p className="text-red-400 font-black text-lg tracking-wide">SKIP ✗</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SwipeEventStack() {
  const { getSwipeableEvents, swipeEventRight, swipeEventLeft, rsvps, resetHiddenPool, swipedLeft } = useApp();
  const [localIdx, setLocalIdx] = useState(0);
  const [showRefill, setShowRefill] = useState(false);

  const swipeableEvents = getSwipeableEvents();
  const visibleEvents = swipeableEvents.slice(localIdx, localIdx + 2);
  const topEvent = visibleEvents[0];
  const nextEvent = visibleEvents[1];

  const hiddenCount = Object.values(swipedLeft).filter(Boolean).length;

  function handleSwipeRight(event) {
    swipeEventRight(event.id);
    setLocalIdx((i) => i + 1);
  }

  function handleSwipeLeft(event) {
    swipeEventLeft(event.id);
    setLocalIdx((i) => i + 1);
  }

  // Out of events to show
  if (!topEvent) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-3">🎉</div>
        <p className="text-white font-bold text-base mb-1">You've seen everything!</p>
        <p className="text-packd-gray text-xs mb-4">
          {hiddenCount > 0 ? `${hiddenCount} skipped events waiting` : 'New events drop every day'}
        </p>
        {hiddenCount > 0 && (
          <button
            onClick={() => { resetHiddenPool(); setLocalIdx(0); setShowRefill(false); }}
            className="packd-btn-ghost text-xs px-4 py-2.5"
          >
            Show {hiddenCount} skipped events
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="select-none">
      {/* Progress dots */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-packd-gray">{localIdx + 1} of {swipeableEvents.length} events</p>
        {hiddenCount > 0 && (
          <button
            onClick={() => { resetHiddenPool(); setLocalIdx(0); }}
            className="text-[11px] text-packd-gray/70 hover:text-packd-orange transition-colors"
          >
            +{hiddenCount} hidden
          </button>
        )}
      </div>

      {/* Card stack */}
      <div className="relative h-[340px]">
        {nextEvent && (
          <EventSwipeCard
            key={nextEvent.id + '-next'}
            event={nextEvent}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            isTop={false}
          />
        )}
        {topEvent && (
          <EventSwipeCard
            key={topEvent.id + '-top'}
            event={topEvent}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            isTop={true}
            nextEvent={nextEvent}
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-5 mt-5">
        <button
          onClick={() => handleSwipeLeft(topEvent)}
          className="w-14 h-14 rounded-full bg-packd-card border-2 border-red-400/40 flex items-center justify-center text-2xl hover:border-red-400 hover:bg-red-400/10 transition-all active:scale-95 shadow-lg"
        >
          ✗
        </button>
        <button
          onClick={() => handleSwipeLeft(topEvent)}
          className="w-10 h-10 rounded-full bg-packd-card border border-packd-border flex items-center justify-center text-sm text-packd-gray hover:border-packd-orange hover:text-packd-orange transition-all active:scale-95"
        >
          ↩
        </button>
        <button
          onClick={() => handleSwipeRight(topEvent)}
          className="w-14 h-14 rounded-full bg-packd-card border-2 border-packd-green/40 flex items-center justify-center text-2xl hover:border-packd-green hover:bg-packd-green/10 transition-all active:scale-95 shadow-lg"
        >
          ✓
        </button>
      </div>

      <p className="text-center text-[10px] text-packd-gray/50 mt-2">
        Swipe or use buttons · Right = Going · Left = Not now
      </p>
    </div>
  );
}
