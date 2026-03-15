'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp, SPORT_COLORS, COMMUNITY_POSTS } from '../../lib/AppContext';
import BottomNav from '../../components/BottomNav';
import SwipeEventStack from '../../components/SwipeEventStack';

const FEED_TABS = ['For You', 'Following', 'Discover'];

function formatSecs(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ─── Video trimmer modal ─────────────────────────────────────────────────────
function VideoTrimmer({ file, duration, onConfirm, onCancel }) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(45, duration));
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const selectedDuration = endTime - startTime;
  const isValid = selectedDuration >= 3 && selectedDuration <= 45;
  const pct = (t) => `${((t / duration) * 100).toFixed(2)}%`;

  const handleStartChange = (v) => {
    const val = Math.min(parseFloat(v), endTime - 3);
    setStartTime(val);
    if (endTime > val + 45) setEndTime(val + 45);
    if (videoRef.current) videoRef.current.currentTime = val;
  };

  const handleEndChange = (v) => {
    const raw = parseFloat(v);
    const clamped = Math.min(Math.max(raw, startTime + 3), Math.min(startTime + 45, duration));
    setEndTime(clamped);
  };

  const handlePreviewToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current?.currentTime >= endTime) {
      videoRef.current.pause();
      videoRef.current.currentTime = startTime;
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <button onClick={onCancel} className="text-xs font-semibold text-packd-gray px-2 py-1.5">
          Cancel
        </button>
        <div className="text-center">
          <p className="text-sm font-black text-white">Trim Clip</p>
          <p className="text-[10px] text-packd-gray">Select a 3–45 second segment</p>
        </div>
        <button
          onClick={() => isValid && onConfirm(previewUrl, startTime, endTime, selectedDuration)}
          disabled={!isValid}
          className="text-xs font-black text-packd-orange px-2 py-1.5 disabled:opacity-30"
        >
          Use Clip ✓
        </button>
      </div>

      {/* Video preview */}
      <div className="flex-1 flex items-center justify-center bg-black min-h-0">
        <video
          ref={videoRef}
          src={previewUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          playsInline
          className="max-w-full max-h-full"
        />
      </div>

      {/* Controls panel */}
      <div className="bg-packd-bg border-t border-packd-border px-4 py-5 flex-shrink-0">
        {/* Timeline bar */}
        <div className="relative h-7 mb-5 select-none">
          {/* Base track */}
          <div className="absolute top-2 left-0 right-0 h-3 bg-packd-card2 rounded-full" />
          {/* Selected range highlight */}
          <div
            className="absolute top-2 h-3 bg-packd-orange/50 rounded-full"
            style={{ left: pct(startTime), width: `${((endTime - startTime) / duration) * 100}%` }}
          />
          {/* Start handle */}
          <div
            className="absolute top-0 w-1.5 h-7 bg-packd-orange rounded-full shadow-lg"
            style={{ left: pct(startTime), transform: 'translateX(-50%)' }}
          />
          {/* End handle */}
          <div
            className="absolute top-0 w-1.5 h-7 bg-packd-orange rounded-full shadow-lg"
            style={{ left: pct(endTime), transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Start slider */}
        <div className="mb-3">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-packd-gray font-semibold">Start</span>
            <span className="text-packd-text font-bold">{formatSecs(startTime)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, duration - 3).toFixed(1)}
            step={0.5}
            value={startTime}
            onChange={(e) => handleStartChange(e.target.value)}
            className="w-full h-1.5 rounded-full appearance-none bg-packd-card2 accent-packd-orange cursor-pointer"
          />
        </div>

        {/* End slider */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-packd-gray font-semibold">End</span>
            <span className="text-packd-text font-bold">{formatSecs(endTime)}</span>
          </div>
          <input
            type="range"
            min={(startTime + 3).toFixed(1)}
            max={Math.min(startTime + 45, duration).toFixed(1)}
            step={0.5}
            value={endTime}
            onChange={(e) => handleEndChange(e.target.value)}
            className="w-full h-1.5 rounded-full appearance-none bg-packd-card2 accent-packd-orange cursor-pointer"
          />
        </div>

        {/* Duration pill + preview button */}
        <div className="flex items-center justify-between">
          <div className={`px-3 py-1.5 rounded-full text-xs font-black ${
            isValid ? 'bg-packd-orange/15 text-packd-orange' : 'bg-red-400/15 text-red-400'
          }`}>
            {formatSecs(selectedDuration)}
            {!isValid && selectedDuration < 3 && <span className="font-normal"> · min 3s</span>}
            {!isValid && selectedDuration > 45 && <span className="font-normal"> · max 45s</span>}
          </div>
          <button
            onClick={handlePreviewToggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-packd-card2 border border-packd-border text-xs font-semibold text-packd-text hover:border-packd-orange/40 transition-colors"
          >
            {isPlaying ? '⏸ Pause' : '▶ Preview'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SPORT_EMOJI = {
  Running: '🏃', Cycling: '🚴', Football: '⚽', Yoga: '🧘', Swimming: '🏊',
  CrossFit: '🏋️', Basketball: '🏀', Tennis: '🎾', Hiking: '🥾',
  Badminton: '🏸', Fitness: '💪', All: '⚡', Other: '💪',
};

// ─── Media grid for photo posts ─────────────────────────────────────────────
function PhotoGrid({ urls }) {
  const count = urls.length;
  if (count === 1) {
    return (
      <div className="rounded-xl overflow-hidden mb-3 aspect-video bg-packd-card2">
        <img src={urls[0]} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden mb-3">
        {urls.map((u, i) => (
          <div key={i} className="aspect-square bg-packd-card2">
            <img src={u} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }
  // 3 or 4: first image tall on the left, rest stacked on right
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden mb-3">
      <div className="row-span-2 bg-packd-card2">
        <img src={urls[0]} alt="" className="w-full h-full object-cover" />
      </div>
      {urls.slice(1, 4).map((u, i) => (
        <div key={i} className="relative aspect-square bg-packd-card2">
          <img src={u} alt="" className="w-full h-full object-cover" />
          {i === 2 && urls.length > 4 && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-black text-lg">
              +{urls.length - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Post composer ───────────────────────────────────────────────────────────
const SPORT_OPTIONS = ['All','Running','Cycling','Football','Yoga','Swimming','CrossFit','Basketball','Tennis','Hiking','Badminton','Fitness'];

function PostComposer() {
  const { user, createPost } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [sport, setSport] = useState('All');
  const [mediaFiles, setMediaFiles] = useState([]); // { file, previewUrl, type, duration?, trimStart?, trimEnd? }
  const [mediaType, setMediaType] = useState(null); // 'photo' | 'video'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [trimFile, setTrimFile] = useState(null); // { file, duration } — open trimmer
  const photoRef = useRef(null);
  const videoRef = useRef(null);

  const checkVideoDuration = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(vid.duration); };
      vid.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Cannot read video')); };
      vid.src = url;
    });

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    if (!files.length) return;
    setMediaFiles(files.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f), type: 'photo' })));
    setMediaType('photo');
    setError('');
    e.target.value = '';
  };

  const handleVideo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    try {
      const dur = await checkVideoDuration(file);
      if (dur < 3) {
        setError(`Video is too short (${Math.round(dur)}s). Minimum is 3 seconds.`);
        return;
      }
      if (dur <= 45) {
        // Valid length — use directly
        setMediaFiles([{ file, previewUrl: URL.createObjectURL(file), type: 'video', duration: Math.round(dur) }]);
        setMediaType('video');
        setError('');
      } else {
        // Too long — open trimmer so user can pick a segment
        setTrimFile({ file, duration: dur });
        setExpanded(true); // make sure composer is open behind the modal
      }
    } catch {
      setError('Could not read video. Try a different file.');
    }
  };

  // Called when user confirms a trim selection
  const handleTrimConfirm = (previewUrl, trimStart, trimEnd, selectedDuration) => {
    setMediaFiles([{
      file: trimFile.file,
      previewUrl,
      type: 'video',
      duration: Math.round(selectedDuration),
      trimStart,
      trimEnd,
    }]);
    setMediaType('video');
    setTrimFile(null);
    setError('');
  };

  const removeMedia = (i) => {
    const next = mediaFiles.filter((_, idx) => idx !== i);
    setMediaFiles(next);
    if (!next.length) setMediaType(null);
  };

  const handlePost = async () => {
    if (!text.trim() && !mediaFiles.length) return;
    setUploading(true);
    setError('');
    try {
      const uploadedUrls = [];
      for (const m of mediaFiles) {
        const fd = new FormData();
        fd.append('file', m.file);
        fd.append('type', m.type);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const d = await res.json();
        if (d.error) throw new Error(d.error);
        // For trimmed videos, append HTML5 media fragment so the player
        // automatically seeks to the selected segment (no server-side ffmpeg needed)
        const url = (m.type === 'video' && m.trimStart !== undefined)
          ? `${d.url}#t=${m.trimStart.toFixed(1)},${m.trimEnd.toFixed(1)}`
          : d.url;
        uploadedUrls.push(url);
      }
      createPost({ content: text.trim(), sport, mediaUrls: uploadedUrls, mediaType });
      setText(''); setMediaFiles([]); setMediaType(null); setSport('All'); setExpanded(false);
    } catch (err) {
      setError(err.message || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const canPost = (text.trim() || mediaFiles.length > 0) && !uploading;

  return (
    <>
      {/* Video trimmer modal — shown when user picks a video > 45s */}
      {trimFile && (
        <VideoTrimmer
          file={trimFile.file}
          duration={trimFile.duration}
          onConfirm={handleTrimConfirm}
          onCancel={() => setTrimFile(null)}
        />
      )}

    <div className="packd-card p-4">
      {/* Collapsed: single row */}
      {!expanded ? (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(true)}>
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border-2 border-packd-orange/40">
            {user.googleAvatar
              ? <img src={user.googleAvatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-packd-orange flex items-center justify-center text-sm font-black text-white">{user.avatar}</div>
            }
          </div>
          <div className="flex-1 bg-packd-card2 rounded-xl px-4 py-2.5 text-sm text-packd-gray/70 border border-packd-border hover:border-packd-orange/40 transition-colors">
            Share a moment, workout, or event recap…
          </div>
          <button className="w-9 h-9 rounded-xl bg-packd-orange/15 flex items-center justify-center text-packd-orange text-lg font-bold hover:bg-packd-orange/25 transition-colors">
            📷
          </button>
        </div>
      ) : (
        /* Expanded composer */
        <div>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border-2 border-packd-orange/40">
              {user.googleAvatar
                ? <img src={user.googleAvatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-packd-orange flex items-center justify-center text-sm font-black text-white">{user.avatar}</div>
              }
            </div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your workout, event recap, or moment with the community…"
              rows={3}
              className="flex-1 bg-transparent text-sm text-packd-text placeholder-packd-gray/60 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Media previews */}
          {mediaFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {mediaFiles.map((m, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden bg-packd-card2 border border-packd-border flex-shrink-0">
                  {m.type === 'photo'
                    ? <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                    : <video src={m.previewUrl} className="w-full h-full object-cover" muted playsInline />
                  }
                  {m.type === 'video' && (
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                      {m.trimStart !== undefined && <span>✂</span>}
                      {m.duration}s
                    </div>
                  )}
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-500 transition-colors"
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          {/* Toolbar */}
          <div className="flex items-center gap-2 border-t border-packd-border pt-3">
            {/* Photo pick */}
            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
            <button
              onClick={() => { setMediaType('photo'); photoRef.current?.click(); }}
              disabled={mediaType === 'video'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-packd-gray hover:bg-packd-card2 hover:text-packd-text transition-colors disabled:opacity-40"
              title="Add photos (up to 4)"
            >
              📷 Photo
            </button>

            {/* Video pick */}
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />
            <button
              onClick={() => { setMediaType('video'); videoRef.current?.click(); }}
              disabled={mediaType === 'photo'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-packd-gray hover:bg-packd-card2 hover:text-packd-text transition-colors disabled:opacity-40"
              title="Add a video clip (3–45 seconds)"
            >
              🎥 Video <span className="text-[9px] opacity-60">≤45s or trim</span>
            </button>

            {/* Sport tag */}
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="ml-auto bg-packd-card2 border border-packd-border text-xs text-packd-gray rounded-xl px-2 py-1.5 focus:outline-none focus:border-packd-orange cursor-pointer"
            >
              {SPORT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <button
              onClick={() => { setExpanded(false); setError(''); }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-packd-gray hover:bg-packd-card2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={!canPost}
              className="px-4 py-1.5 rounded-xl text-xs font-black bg-packd-orange text-white hover:bg-packd-orange-light transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {uploading ? (
                <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />Posting…</>
              ) : 'Post'}
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

// ─── Post card ───────────────────────────────────────────────────────────────
function PostCard({ post }) {
  const { postLikes, togglePostLike } = useApp();
  const liked = postLikes[post.id];
  const likeCount = post.likes + (liked ? 1 : 0);
  const [showComments, setShowComments] = useState(false);

  const avatarIsEmoji = post.avatar.length > 1 || !post.avatar.match(/[A-Z]/);

  return (
    <div className="packd-card overflow-hidden">
      {/* Post type accent */}
      {post.isTip && (
        <div className="bg-packd-gold/10 border-b border-packd-gold/20 px-4 py-1.5 flex items-center gap-2">
          <span className="text-xs font-bold text-packd-gold">💡 EXPERT TIP</span>
        </div>
      )}
      {post.isChallenge && (
        <div className="bg-packd-orange/10 border-b border-packd-orange/20 px-4 py-1.5 flex items-center gap-2">
          <span className="text-xs font-bold text-packd-orange">🏆 COMMUNITY CHALLENGE</span>
        </div>
      )}
      {post.type === 'milestone' && (
        <div className="bg-packd-green/10 border-b border-packd-green/20 px-4 py-1.5 flex items-center gap-2">
          <span className="text-xs font-bold text-packd-green">🎉 PACK MILESTONE</span>
        </div>
      )}

      <div className="p-4">
        {/* Author row */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            avatarIsEmoji ? 'bg-packd-card2 border border-packd-border text-lg' : `${post.avatarColor} text-white`
          }`}>
            {post.googleAvatar
              ? <img src={post.googleAvatar} alt={post.user} className="w-full h-full object-cover" />
              : post.avatar
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-white">{post.user}</span>
              {post.isPack && <span className="text-[10px] bg-packd-orange/20 text-packd-orange px-1.5 py-0.5 rounded-full font-semibold">PACK</span>}
              {post.sport && post.sport !== 'All' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${SPORT_COLORS[post.sport] || 'text-packd-gray bg-packd-border/40'}`}>
                  {post.sport}
                </span>
              )}
            </div>
            <p className="text-[11px] text-packd-gray">{post.time}</p>
          </div>
          {post.xp && (
            <span className="text-xs font-black text-packd-orange flex-shrink-0">+{post.xp} XP</span>
          )}
        </div>

        {/* Content */}
        {post.content && (
          <p className="text-sm text-packd-text leading-relaxed mb-3">{post.content}</p>
        )}

        {/* Photo grid */}
        {post.mediaUrls?.length > 0 && post.mediaType === 'photo' && (
          <PhotoGrid urls={post.mediaUrls} />
        )}

        {/* Video player */}
        {post.mediaUrls?.length > 0 && post.mediaType === 'video' && (
          <div className="rounded-xl overflow-hidden mb-3 bg-black aspect-video">
            <video
              src={post.mediaUrls[0]}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full"
            />
          </div>
        )}

        {/* Event CTA if post has an event */}
        {post.eventId && (
          <Link href={`/event/${post.eventId}`}
            className="flex items-center gap-2 bg-packd-card2 border border-packd-orange/30 rounded-xl px-3 py-2.5 mb-3 hover:border-packd-orange transition-colors">
            <span className="text-base">📅</span>
            <span className="text-xs font-semibold text-packd-orange flex-1">View & RSVP to this event →</span>
          </Link>
        )}

        {/* Challenge CTA */}
        {post.isChallenge && (
          <button className="w-full packd-btn-primary py-2.5 text-xs font-bold mb-3">
            Join Challenge →
          </button>
        )}
      </div>

      {/* Reactions row */}
      <div className="border-t border-packd-border px-4 py-2 flex items-center gap-1">
        <button
          onClick={() => togglePostLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            liked
              ? 'bg-red-400/15 text-red-400'
              : 'text-packd-gray hover:bg-packd-card2 hover:text-red-400'
          }`}
        >
          <span className="text-sm">{liked ? '❤️' : '🤍'}</span>
          {likeCount}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-packd-gray hover:bg-packd-card2 hover:text-packd-text transition-all"
        >
          <span className="text-sm">💬</span>
          {post.comments}
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-packd-gray hover:bg-packd-card2 hover:text-packd-text transition-all">
          <span className="text-sm">↗</span> Share
        </button>
        {post.dmUserId && (
          <Link href={`/messages/${post.dmUserId}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-packd-gray hover:bg-packd-card2 hover:text-packd-orange transition-all ml-auto">
            <span className="text-sm">💬</span> DM
          </Link>
        )}
      </div>

      {/* Comments mini-section */}
      {showComments && (
        <div className="border-t border-packd-border px-4 py-3 bg-packd-card2/50">
          <div className="flex gap-2 items-center">
            <div className="w-6 h-6 rounded-full bg-packd-orange flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">A</div>
            <input
              placeholder="Add a comment…"
              className="flex-1 bg-transparent text-xs text-packd-gray placeholder-packd-gray/60 focus:outline-none border-b border-packd-border/60 pb-1 focus:border-packd-orange transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { user, activityFeed, unreadCount, theme, toggleTheme, feedPosts } = useApp();
  const [activeTab, setActiveTab] = useState('For You');
  const [showSwipe, setShowSwipe] = useState(false);

  const xpPercent = Math.min(((user.xp % 1000) / 1000) * 100, 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user.name.split(' ')[0];

  // DB posts first, then static seed posts
  const forYouFeed = [...feedPosts, ...COMMUNITY_POSTS];

  return (
    <div className="min-h-screen bg-packd-bg pb-24">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-packd-bg/95 backdrop-blur-md border-b border-packd-border">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-0">
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-packd-gray">{greeting},</p>
              <p className="text-base font-black text-white">Hey, {firstName} 👋</p>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-9 h-9 rounded-full bg-packd-card border border-packd-border flex items-center justify-center text-packd-gray hover:text-packd-text transition-colors"
              >
                {theme === 'light' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                    <line x1="12" y1="2" x2="12" y2="5"   stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="2"  y1="12" x2="5"  y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="4.9"  y1="4.9"  x2="7"  y2="7"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="17"   y1="17"   x2="19.1" y2="19.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="4.9"  y1="19.1" x2="7"  y2="17"    stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="17"   y1="7"    x2="19.1" y2="4.9"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              <Link href="/notifications"
                className="relative w-9 h-9 rounded-full bg-packd-card border border-packd-border flex items-center justify-center text-base text-packd-gray hover:text-packd-text transition-colors">
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-packd-orange rounded-full text-[9px] font-black text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/profile"
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-packd-orange/50 flex-shrink-0">
                {user.googleAvatar ? (
                  <img src={user.googleAvatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-packd-orange flex items-center justify-center text-sm font-black text-white">{user.avatar}</div>
                )}
              </Link>
            </div>
          </div>

          {/* XP / streak compact bar */}
          <div className="flex items-center gap-3 mb-3 bg-packd-card rounded-2xl px-3 py-2.5 border border-packd-border">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-packd-gray">Lv {user.level} · {user.levelName}</span>
                <span className="text-[10px] text-packd-orange font-bold">{user.xp.toLocaleString()} XP</span>
              </div>
              <div className="xp-bar"><div className="xp-fill" style={{ width: `${xpPercent}%` }} /></div>
            </div>
            <div className="w-px h-6 bg-packd-border" />
            <div className="text-center">
              <p className="text-base font-black text-packd-orange leading-none">{user.streak}🔥</p>
              <p className="text-[9px] text-packd-gray">streak</p>
            </div>
            <button onClick={() => router.push('/log')}
              className="bg-packd-orange text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl whitespace-nowrap hover:bg-packd-orange-light transition-colors">
              + Log
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-0">
            {FEED_TABS.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-2 text-xs font-bold rounded-t-xl transition-all ${
                  activeTab === t
                    ? 'text-packd-orange border-b-2 border-packd-orange'
                    : 'text-packd-gray hover:text-packd-text'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">

        {/* FOR YOU TAB */}
        {activeTab === 'For You' && (
          <>
            {/* Swipe discovery banner */}
            <div
              onClick={() => setShowSwipe((s) => !s)}
              className="packd-card p-4 border-packd-orange/30 bg-gradient-to-r from-packd-orange/5 to-transparent cursor-pointer hover:border-packd-orange/60 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-packd-orange/20 flex items-center justify-center text-xl flex-shrink-0">
                  {showSwipe ? '✕' : '👆'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{showSwipe ? 'Hide event discovery' : 'Discover events — swipe to decide'}</p>
                  <p className="text-xs text-packd-gray">Swipe right = going · left = not now</p>
                </div>
                <span className="text-packd-orange text-lg">{showSwipe ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Swipe stack */}
            {showSwipe && (
              <div className="packd-card p-4">
                <SwipeEventStack />
              </div>
            )}

            {/* Post composer */}
            <PostComposer />

            {/* Community posts feed */}
            {forYouFeed.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Load more indicator */}
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-2 text-xs text-packd-gray">
                <div className="w-1.5 h-1.5 rounded-full bg-packd-orange animate-ping" />
                You're all caught up for now
              </div>
            </div>
          </>
        )}

        {/* FOLLOWING TAB */}
        {activeTab === 'Following' && (
          <>
            <div className="packd-card p-4 text-center">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm font-bold text-white mb-1">Pack Activity</p>
              <p className="text-xs text-packd-gray mb-4">Posts from packs you've joined</p>
            </div>
            {activityFeed.map((act) => (
              <div key={act.id} className="packd-card p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-packd-card2 border border-packd-border flex items-center justify-center text-sm font-bold text-packd-orange flex-shrink-0">
                  {act.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white">{act.user}</span>
                    {act.badge && <span>{act.badge}</span>}
                    <span className="text-[11px] text-packd-gray ml-auto">{act.time}</span>
                  </div>
                  <p className="text-xs text-packd-text">{act.action}</p>
                  <span className={`text-xs font-semibold mt-1 inline-block ${SPORT_COLORS[act.sport] || 'text-packd-gray'}`}>
                    {act.sport} · +{act.xp} XP
                  </span>
                </div>
              </div>
            ))}
            <button onClick={() => router.push('/log')}
              className="w-full packd-card card-hover p-4 border-dashed flex items-center justify-center gap-2 text-packd-gray hover:text-packd-text hover:border-packd-orange transition-all">
              <span className="text-lg">⚡</span>
              <span className="text-sm font-semibold">Log today's activity</span>
            </button>
          </>
        )}

        {/* DISCOVER TAB */}
        {activeTab === 'Discover' && (
          <>
            <div className="bg-gradient-to-br from-packd-orange/10 to-transparent packd-card p-5 border-packd-orange/30">
              <p className="text-xs text-packd-orange font-bold uppercase tracking-widest mb-1">Event Discovery</p>
              <h2 className="text-lg font-black text-white mb-1">Find your next event</h2>
              <p className="text-xs text-packd-gray mb-4">Swipe right to RSVP, left to skip. We'll resurface skipped events later.</p>
            </div>
            <div className="packd-card p-4">
              <SwipeEventStack />
            </div>
            <div className="text-center py-2">
              <Link href="/explore" className="text-xs text-packd-orange font-semibold hover:underline">
                Browse all events in Explore →
              </Link>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
