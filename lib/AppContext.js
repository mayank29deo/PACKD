'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const AppContext = createContext(null);

const DEFAULT_USER = {
  id: 'u1',
  name: 'Athlete One',
  username: 'athlete1',
  avatar: 'A',
  email: 'athlete@packd.app',
  level: 7,
  levelName: 'Trailblazer',
  xp: 2840,
  xpToNext: 3520,
  streak: 14,
  sports: ['Running', 'Yoga', 'CrossFit'],
  totalKm: 284,
  totalSessions: 63,
  eventsJoined: 18,
  packsCount: 3,
  bio: 'Morning runner. Yoga enthusiast. Coffee addict.',
  area: 'Koramangala',
  loggedIn: false,
};

const DEFAULT_EVENTS = [
  { id: 'e1', sport: 'Running', title: 'Sunday Long Run @ Cubbon Park', time: 'Sun 7:00 AM', date: '2026-03-15', distance: '12 km', organizer: 'Koramangala Runners', organizerId: 'p1', rsvp: 22, max: 30, level: 'All paces', cost: 'Free', venue: 'Cubbon Park', area: 'Central', description: 'Weekly long run for all pace groups. Meet at the main gate. Bring water and your best energy!', createdBy: 'Arjun M.' },
  { id: 'e2', sport: 'Cycling', title: 'Nandi Hills Sunrise Ride', time: 'Sat 4:30 AM', date: '2026-03-14', distance: '80 km', organizer: 'BLR Cycling Club', organizerId: 'p2', rsvp: 14, max: 20, level: 'Intermediate', cost: '₹200', venue: 'Nandi Hills Base', area: 'Outskirts', description: 'Climb to the summit before sunrise. Epic views guaranteed. Bike must be in good condition.', createdBy: 'BLR Cycling Club' },
  { id: 'e3', sport: 'Football', title: '5-a-side League Night', time: 'Fri 7:00 PM', date: '2026-03-13', distance: '', organizer: 'Indiranagar FC', organizerId: 'p3', rsvp: 18, max: 20, level: 'Casual', cost: '₹150', venue: 'Playo Arena', area: 'Indiranagar', description: 'Weekly 5-a-side matches. Teams balanced on the spot. Great for socializing!', createdBy: 'Indiranagar FC' },
  { id: 'e4', sport: 'Yoga', title: 'Sunrise Flow @ Lalbagh', time: 'Sat 6:00 AM', date: '2026-03-14', distance: '', organizer: 'Bangalore Yoga Collective', organizerId: 'p4', rsvp: 35, max: 50, level: 'All levels', cost: 'Free', venue: 'Lalbagh Gardens', area: 'South BLR', description: 'Start your weekend with a peaceful outdoor yoga session. Mats provided for first-timers.', createdBy: 'Bangalore Yoga Collective' },
  { id: 'e5', sport: 'Swimming', title: 'Open Water 2K', time: 'Sun 6:30 AM', date: '2026-03-15', distance: '2 km', organizer: 'Ulsoor Swim Club', organizerId: 'p5', rsvp: 8, max: 15, level: 'Advanced', cost: '₹100', venue: 'Ulsoor Lake', area: 'Central', description: 'Open water swim for experienced swimmers only. Life guards present.', createdBy: 'Ulsoor Swim Club' },
  { id: 'e6', sport: 'Basketball', title: '3x3 Pickup Game', time: 'Sat 5:00 PM', date: '2026-03-14', distance: '', organizer: 'Koramangala Hoopers', organizerId: 'p6', rsvp: 10, max: 12, level: 'Casual', cost: 'Free', venue: 'Koramangala Courts', area: 'Koramangala', description: 'Casual 3x3 pickup games. All skill levels welcome. First come first play.', createdBy: 'Koramangala Hoopers' },
  { id: 'e7', sport: 'CrossFit', title: 'Partner WOD Saturday', time: 'Sat 8:00 AM', date: '2026-03-14', distance: '', organizer: 'HSR CrossFit Community', organizerId: 'p7', rsvp: 16, max: 20, level: 'Rx / Scaled', cost: '₹300', venue: 'CrossFit Bangalore', area: 'HSR', description: 'Bring a partner and crush the WOD together. Both Rx and scaled options available.', createdBy: 'HSR CrossFit' },
  { id: 'e8', sport: 'Hiking', title: 'Skandagiri Night Trek', time: 'Sat 11:00 PM', date: '2026-03-14', distance: '8 km', organizer: 'BLR Trekkers', organizerId: 'p8', rsvp: 28, max: 40, level: 'Moderate', cost: '₹500', venue: 'Skandagiri', area: 'Outskirts', description: 'Night trek to catch the sunrise from the summit. Transport arranged from Majestic.', createdBy: 'BLR Trekkers' },
  { id: 'e9', sport: 'Tennis', title: 'Mixed Doubles Knockout', time: 'Sun 7:30 AM', date: '2026-03-15', distance: '', organizer: 'Koramangala Tennis Club', organizerId: 'p9', rsvp: 12, max: 16, level: 'Intermediate', cost: '₹200', venue: 'KSCA Courts', area: 'Koramangala', description: 'Round-robin tournament format. Bring your own racket.', createdBy: 'KTC' },
  { id: 'e10', sport: 'Badminton', title: 'Friday Evening Shuttle', time: 'Fri 6:00 PM', date: '2026-03-13', distance: '', organizer: 'BLR Shuttlers', organizerId: 'p10', rsvp: 20, max: 24, level: 'All levels', cost: '₹100', venue: 'Nexus Mall Courts', area: 'Whitefield', description: 'Casual badminton evening. Shuttles provided. Bring your racket.', createdBy: 'BLR Shuttlers' },
];

const DEFAULT_PACKS = [
  { id: 'p1', name: 'Koramangala Runners', sport: 'Running', members: 312, level: 'All levels', area: 'Koramangala', verified: true, tagline: 'We run, we sweat, we conquer — together.', streak: 22, xp: 148200, events: 48, icon: '🏃' },
  { id: 'p2', name: 'BLR Cycling Club', sport: 'Cycling', members: 184, level: 'Intermediate+', area: 'Citywide', verified: true, tagline: 'Pedal harder, go farther.', streak: 15, xp: 92000, events: 31, icon: '🚴' },
  { id: 'p3', name: 'Indiranagar FC', sport: 'Football', members: 97, level: 'Casual', area: 'Indiranagar', verified: false, tagline: 'The beautiful game, every week.', streak: 8, xp: 41200, events: 24, icon: '⚽' },
  { id: 'p4', name: 'Bangalore Yoga Collective', sport: 'Yoga', members: 541, level: 'All levels', area: 'South BLR', verified: true, tagline: 'Find stillness together.', streak: 31, xp: 201000, events: 62, icon: '🧘' },
  { id: 'p5', name: 'HSR CrossFit Community', sport: 'CrossFit', members: 63, level: 'Rx / Scaled', area: 'HSR Layout', verified: false, tagline: 'Forged in fire, built together.', streak: 12, xp: 38400, events: 19, icon: '💪' },
];

// Rich community posts for the Reddit-style feed
export const COMMUNITY_POSTS = [
  { id: 'cp1', type: 'activity', user: 'Arjun M.', avatar: 'A', avatarColor: 'bg-packd-orange', sport: 'Running', content: 'New PB! 10K in 45:22 at Cubbon Park this morning 🔥 Pace 4:32/km. The 5AM crew never disappoints. Who else hit a PB this week?', xp: 420, time: '23m ago', likes: 47, comments: 12, image: null, verified: false, dmUserId: 'arjun' },
  { id: 'cp2', type: 'event_announce', user: 'Koramangala Runners', avatar: '🏃', avatarColor: 'bg-packd-card2', sport: 'Running', content: 'Our monthly 5K time trial is BACK this Saturday at 7 AM, Lalbagh Gardens. All paces welcome. 12 spots remaining — RSVP now before it fills up!', xp: null, time: '1h ago', likes: 89, comments: 23, eventId: 'e1', isPack: true },
  { id: 'cp3', type: 'activity', user: 'Priya S.', avatar: 'P', avatarColor: 'bg-purple-500', sport: 'Yoga', content: '60 days of unbroken practice ✨ Morning yoga at Lalbagh has genuinely changed my life. If you\'re on the fence about joining the collective — just show up once. That\'s all it takes.', xp: 280, time: '2h ago', likes: 134, comments: 31, image: null, dmUserId: 'priya' },
  { id: 'cp4', type: 'milestone', user: 'BLR Cycling Club', avatar: '🚴', avatarColor: 'bg-blue-500', sport: 'Cycling', content: '🎉 We just crossed 10,000 km as a pack this month! That\'s Bangalore to London on two wheels. Massive shoutout to our early risers who grind it out at 4:30 AM every Saturday!', xp: null, time: '3h ago', likes: 203, comments: 44, isPack: true },
  { id: 'cp5', type: 'activity', user: 'Rahul K.', avatar: 'R', avatarColor: 'bg-packd-green', sport: 'CrossFit', content: 'Fran in 3:47 Rx today. Legs are jelly. Worth it 💪 If anyone wants a partner WOD this weekend, HSR CrossFit Saturday 8AM — come find me!', xp: 350, time: '4h ago', likes: 62, comments: 18, dmUserId: 'rahul' },
  { id: 'cp6', type: 'tip', user: 'Coach Vikram', avatar: 'V', avatarColor: 'bg-packd-gold', sport: 'Running', content: '💡 Pro tip for Bangalore runners: Cubbon Park at 5:30 AM has virtually zero traffic and the air quality is at its best for the day. Your lungs will thank you. The 6:30 AM crowd is 3x bigger and 30% more pollution exposure.', xp: null, time: '5h ago', likes: 178, comments: 52, isTip: true },
  { id: 'cp7', type: 'activity', user: 'Sneha M.', avatar: 'S', avatarColor: 'bg-cyan-500', sport: 'Swimming', content: 'Open water swim at Ulsoor Lake was MAGICAL this morning 🌊 Water temp perfect, visibility decent. Anyone else training for the 2K event on Sunday? DM me!', xp: 200, time: '6h ago', likes: 41, comments: 9, dmUserId: 'sneha' },
  { id: 'cp8', type: 'challenge', user: 'PACKD Community', avatar: '⚡', avatarColor: 'bg-packd-orange', sport: 'All', content: '🏆 MARCH MADNESS CHALLENGE is live! Log 20 activities in March and unlock the exclusive "Iron March" badge. 1,247 athletes already participating. You in?', xp: null, time: '8h ago', likes: 312, comments: 87, isChallenge: true },
  { id: 'cp9', type: 'activity', user: 'Ananya T.', avatar: 'A', avatarColor: 'bg-pink-500', sport: 'Badminton', content: 'First time playing competitive badminton and I went 3-1 in the league night 😭🏸 Thanks to everyone at BLR Shuttlers for being so welcoming to a complete beginner!', xp: 150, time: '10h ago', likes: 93, comments: 27 },
  { id: 'cp10', type: 'pack_update', user: 'Bangalore Yoga Collective', avatar: '🧘', avatarColor: 'bg-purple-500', sport: 'Yoga', content: 'We\'re opening a new batch for sunrise yoga at Lalbagh starting March 20! Limited to 30 spots. No experience needed — we\'ve had doctors, engineers, and retired army officers all practice together ❤️', xp: null, time: '12h ago', likes: 156, comments: 61, isPack: true },
  { id: 'cp11', type: 'activity', user: 'Rohan P.', avatar: 'R', avatarColor: 'bg-orange-400', sport: 'Football', content: 'Scored a hat-trick in the 5-a-side league last night 🔥⚽ Indiranagar FC is absolutely cooking right now — we\'ve won 4 in a row. Come watch us (or play against us) this Friday 7PM!', xp: 280, time: '14h ago', likes: 71, comments: 22 },
  { id: 'cp12', type: 'tip', user: 'Dr. Meera K.', avatar: 'M', avatarColor: 'bg-teal-500', sport: 'Fitness', content: '🩺 Sports medicine perspective: 80% of running injuries are from doing too much too soon. Increase weekly mileage by max 10%. Your future self will run marathons while your impatient friends are stuck with knee pain.', xp: null, time: '1d ago', likes: 289, comments: 94, isTip: true },
  { id: 'cp13', type: 'activity', user: 'Karthik B.', avatar: 'K', avatarColor: 'bg-indigo-500', sport: 'Hiking', content: 'Skandagiri summit at 5:17 AM, temperature 8°C, fog clearing just as the sun came up. Some moments are worth the 11 PM bus ride 🌅', xp: 320, time: '1d ago', likes: 187, comments: 43 },
  { id: 'cp14', type: 'event_announce', user: 'BLR Trekkers', avatar: '🥾', avatarColor: 'bg-emerald-500', sport: 'Hiking', content: 'NEW trek alert! Savandurga full moon night climb — April 5th. Transport from Majestic at 10 PM. Limited to 35 people. Bring a headlamp and layers! Link to register in bio 👇', xp: null, time: '1d ago', likes: 122, comments: 38, isPack: true },
];

const DEFAULT_ACTIVITIES = [
  { id: 'a1', user: 'Priya S.', avatar: 'P', sport: 'Yoga', action: 'Completed 45-min flow', xp: 120, time: '1h ago' },
  { id: 'a2', user: 'Rahul K.', avatar: 'R', sport: 'Running', action: '10K in 52:14 · Pace 5:13/km', xp: 280, time: '2h ago', badge: '🏅' },
  { id: 'a3', user: 'Sneha M.', avatar: 'S', sport: 'CrossFit', action: 'WOD: Fran · 3:47 Rx', xp: 350, time: '3h ago' },
  { id: 'a4', user: 'Arjun M.', avatar: 'A', sport: 'Swimming', action: '2km open water · Ulsoor Lake', xp: 200, time: '5h ago', badge: '🔥' },
];

const DEFAULT_NOTIFICATIONS = [
  { id: 'n1', type: 'event', text: 'Sunday Long Run is tomorrow at 7:00 AM', time: '2h ago', read: false },
  { id: 'n2', type: 'xp', text: 'You earned +280 XP for your morning run!', time: '4h ago', read: false },
  { id: 'n3', type: 'pack', text: 'Arjun M. liked your activity post', time: '5h ago', read: true },
  { id: 'n4', type: 'challenge', text: '12 days left in the July 100K Challenge', time: '1d ago', read: true },
];

const DEFAULT_CONVERSATIONS = {
  arjun: {
    user: { id: 'arjun', name: 'Arjun M.', avatar: 'A', avatarColor: 'bg-packd-orange', sport: 'Running', online: true },
    messages: [
      { id: 'm1', text: 'Hey! Great run this morning 🏃', fromMe: false, time: '7:32 AM' },
      { id: 'm2', text: 'Thanks! That Cubbon loop was 🔥 You killed it too', fromMe: true, time: '7:45 AM' },
      { id: 'm3', text: 'Coming to the Sunday long run?', fromMe: false, time: '8:02 AM' },
    ],
    unread: 1,
  },
  priya: {
    user: { id: 'priya', name: 'Priya S.', avatar: 'P', avatarColor: 'bg-purple-500', sport: 'Yoga', online: false },
    messages: [
      { id: 'm4', text: 'Your 60-day streak post was so inspiring!', fromMe: true, time: 'Yesterday' },
      { id: 'm5', text: 'Thank you! It really changed my morning routine 🧘', fromMe: false, time: 'Yesterday' },
    ],
    unread: 0,
  },
  rahul: {
    user: { id: 'rahul', name: 'Rahul K.', avatar: 'R', avatarColor: 'bg-packd-green', sport: 'CrossFit', online: true },
    messages: [
      { id: 'm6', text: 'Partner WOD this Saturday? HSR CrossFit 8AM 💪', fromMe: false, time: '2h ago' },
    ],
    unread: 1,
  },
  sneha: {
    user: { id: 'sneha', name: 'Sneha M.', avatar: 'S', avatarColor: 'bg-cyan-500', sport: 'Swimming', online: false },
    messages: [
      { id: 'm7', text: 'DM me about the open water 2K training!', fromMe: false, time: '1d ago' },
      { id: 'm8', text: "Yes! I'm training for it. What's your target time?", fromMe: true, time: '1d ago' },
      { id: 'm9', text: 'Aiming for sub-35 min. We should do a practice swim together 🌊', fromMe: false, time: '1d ago' },
    ],
    unread: 0,
  },
  karthik: {
    user: { id: 'karthik', name: 'Karthik B.', avatar: 'K', avatarColor: 'bg-indigo-500', sport: 'Hiking', online: false },
    messages: [
      { id: 'm10', text: 'That Skandagiri summit photo was insane 🌅', fromMe: true, time: '2d ago' },
      { id: 'm11', text: 'Come on the next one! April 5th Savandurga night trek', fromMe: false, time: '2d ago' },
    ],
    unread: 0,
  },
};

const DEFAULT_MY_ACTIVITY_LOG = [
  { id: 'al1', type: 'Running', title: '10K Morning Run', distance: '10.2 km', pace: '5:13/km', xp: 280, date: 'Today', icon: '🏃' },
  { id: 'al2', type: 'Running', title: 'Recovery Easy Run', distance: '5.5 km', pace: '6:02/km', xp: 120, date: 'Yesterday', icon: '🏃' },
  { id: 'al3', type: 'Yoga', title: '45-min Flow Session', distance: '', pace: '45 min', xp: 120, date: '2 days ago', icon: '🧘' },
  { id: 'al4', type: 'Running', title: 'Sunday Long Run', distance: '14 km', pace: '5:34/km', xp: 380, date: '3 days ago', icon: '🏃' },
  { id: 'al5', type: 'CrossFit', title: 'WOD: Fran', distance: '', pace: '3:47', xp: 350, date: '4 days ago', icon: '🏋️' },
];

function loadState() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('packd_state_v2');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function saveState(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('packd_state_v2', JSON.stringify(state));
  } catch {}
}

export function AppProvider({ children }) {
  const { data: session, status: sessionStatus } = useSession();
  const [user, setUser] = useState(DEFAULT_USER);
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [packs, setPacks] = useState(DEFAULT_PACKS);
  const [rsvps, setRsvps] = useState({});
  const [joinedPacks, setJoinedPacks] = useState({ p1: true });
  const [activityFeed, setActivityFeed] = useState(DEFAULT_ACTIVITIES);
  const [myActivityLog, setMyActivityLog] = useState(DEFAULT_MY_ACTIVITY_LOG);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [hydrated, setHydrated] = useState(false);

  // Swipe state: right = interested (RSVP'd via swipe), left = hidden for now
  const [swipedRight, setSwipedRight] = useState({}); // eventId -> true
  const [swipedLeft, setSwipedLeft] = useState({});   // eventId -> true (hidden pool)
  const [postLikes, setPostLikes] = useState({});      // postId -> true (liked)
  const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS);
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light' | 'forest-dark' | 'forest-light'
  const [feedPosts, setFeedPosts] = useState([]); // DB-persisted community posts
  const [communityEvents, setCommunityEvents] = useState([]);
  const [externalEvents, setExternalEvents] = useState([]);

  // Helper: hydrate local state from localStorage (used when unauthenticated)
  const hydrateLocal = useCallback((stored) => {
    if (stored.rsvps) setRsvps(stored.rsvps);
    if (stored.joinedPacks) setJoinedPacks(stored.joinedPacks);
    if (stored.notifications) setNotifications(stored.notifications);
    if (stored.swipedRight) setSwipedRight(stored.swipedRight);
    if (stored.swipedLeft) setSwipedLeft(stored.swipedLeft);
    if (stored.postLikes) setPostLikes(stored.postLikes);
    if (stored.conversations) {
      setConversations((prev) => {
        const merged = { ...prev };
        Object.keys(stored.conversations).forEach((uid) => { merged[uid] = stored.conversations[uid]; });
        return merged;
      });
    }
    if (stored.events) {
      const userEvents = stored.events.filter((e) => e.userCreated);
      setEvents([...DEFAULT_EVENTS, ...userEvents]);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'loading') return; // wait for NextAuth to resolve

    const stored = loadState();

    if (sessionStatus === 'authenticated' && session?.user?.email) {
      // ── Logged in: load all data from Supabase ──────────────────────────
      Promise.all([
        fetch('/api/user').then((r) => r.json()).catch(() => ({ user: null })),
        fetch('/api/activities').then((r) => r.json()).catch(() => ({ activities: [] })),
        fetch('/api/rsvps').then((r) => r.json()).catch(() => ({ rsvps: {} })),
        fetch('/api/packs').then((r) => r.json()).catch(() => ({ joined: {} })),
        fetch('/api/likes').then((r) => r.json()).catch(() => ({ likes: {} })),
        fetch('/api/swipes').then((r) => r.json()).catch(() => ({ swipedRight: {}, swipedLeft: {} })),
        fetch('/api/notifications').then((r) => r.json()).catch(() => ({ notifications: [] })),
        fetch('/api/events').then((r) => r.json()).catch(() => ({ events: [] })),
      ]).then(([userData, actData, rsvpData, packsData, likesData, swipesData, notifsData, eventsData]) => {
        if (userData.user) {
          // Map DB columns back to app shape
          setUser({
            ...DEFAULT_USER,
            loggedIn: true,
            email: session.user.email,
            name: userData.user.name || session.user.name || DEFAULT_USER.name,
            username: userData.user.username || DEFAULT_USER.username,
            bio: userData.user.bio || '',
            area: userData.user.area || '',
            sports: userData.user.sports || DEFAULT_USER.sports,
            avatar: userData.user.avatar || DEFAULT_USER.avatar,
            xp: userData.user.xp ?? DEFAULT_USER.xp,
            level: userData.user.level ?? DEFAULT_USER.level,
            levelName: userData.user.level_name || DEFAULT_USER.levelName,
            xpToNext: userData.user.xp_to_next ?? DEFAULT_USER.xpToNext,
            streak: userData.user.streak ?? DEFAULT_USER.streak,
            totalSessions: userData.user.total_sessions ?? DEFAULT_USER.totalSessions,
            totalKm: userData.user.total_km ?? DEFAULT_USER.totalKm,
            eventsJoined: userData.user.events_joined ?? DEFAULT_USER.eventsJoined,
            packsCount: userData.user.packs_count ?? DEFAULT_USER.packsCount,
            googleAvatar: userData.user.google_avatar || session.user.image || null,
          });
          if (userData.user.theme) setTheme(userData.user.theme);
        } else {
          // First login — seed with session data, Supabase row will be created on first save
          setUser((u) => ({
            ...u,
            loggedIn: true,
            email: session.user.email,
            name: session.user.name || u.name,
            googleAvatar: session.user.image || null,
          }));
        }
        if (actData.activities?.length > 0) setMyActivityLog(actData.activities);
        if (rsvpData.rsvps && Object.keys(rsvpData.rsvps).length > 0) setRsvps(rsvpData.rsvps);
        if (packsData.joined && Object.keys(packsData.joined).length > 0) setJoinedPacks(packsData.joined);
        if (likesData.likes && Object.keys(likesData.likes).length > 0) setPostLikes(likesData.likes);
        if (swipesData.swipedRight) setSwipedRight(swipesData.swipedRight);
        if (swipesData.swipedLeft) setSwipedLeft(swipesData.swipedLeft);
        if (notifsData.notifications?.length > 0) setNotifications(notifsData.notifications);
        if (eventsData.events?.length > 0) {
          setEvents((prev) => {
            const defaults = prev.filter((e) => !e.userCreated);
            return [...eventsData.events, ...defaults];
          });
        }
        // Still load DMs from localStorage (not persisted to Supabase)
        if (stored?.conversations) {
          setConversations((prev) => {
            const merged = { ...prev };
            Object.keys(stored.conversations).forEach((uid) => { merged[uid] = stored.conversations[uid]; });
            return merged;
          });
        }
        setHydrated(true);
      });
    } else {
      // ── Not logged in: fall back entirely to localStorage ────────────────
      if (stored) {
        if (stored.user) setUser({ ...DEFAULT_USER, ...stored.user });
        if (stored.myActivityLog) setMyActivityLog(stored.myActivityLog);
        if (stored.theme) setTheme(stored.theme);
        hydrateLocal(stored);
      }
      setHydrated(true);
    }
  }, [sessionStatus, session?.user?.email, hydrateLocal]);

  // Load community posts + events on mount (public — no auth needed)
  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.json())
      .then((d) => { if (d.posts?.length > 0) setFeedPosts(d.posts); })
      .catch(() => {});

    fetch('/api/community-events')
      .then((r) => r.json())
      .then((d) => { if (d.events?.length > 0) setCommunityEvents(d.events); })
      .catch(() => {});

    fetch('/api/external-events')
      .then((r) => r.json())
      .then((d) => { if (d.events?.length > 0) setExternalEvents(d.events); })
      .catch(() => {});
  }, []);

  // Always keep localStorage in sync (for offline / unauthenticated fallback)
  useEffect(() => {
    if (!hydrated) return;
    saveState({
      user, rsvps, joinedPacks, notifications, myActivityLog,
      swipedRight, swipedLeft, postLikes, conversations, theme,
      events: events.filter((e) => e.userCreated),
    });
  }, [user, rsvps, joinedPacks, notifications, myActivityLog, swipedRight, swipedLeft, postLikes, conversations, theme, events, hydrated]);

  // Sync user profile to Supabase (debounced 1.5s) when logged in
  useEffect(() => {
    if (!hydrated || sessionStatus !== 'authenticated' || !session?.user?.email) return;
    const t = setTimeout(() => {
      fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          username: user.username,
          bio: user.bio || '',
          area: user.area || '',
          sports: user.sports || [],
          avatar: user.avatar || 'A',
          xp: user.xp,
          level: user.level,
          level_name: user.levelName,
          xp_to_next: user.xpToNext,
          streak: user.streak,
          total_sessions: user.totalSessions,
          total_km: user.totalKm,
          events_joined: user.eventsJoined,
          packs_count: user.packsCount,
          theme,
          google_avatar: user.googleAvatar || null,
        }),
      }).catch(() => {}); // silent fail — localStorage is the backup
    }, 1500);
    return () => clearTimeout(t);
  }, [user, theme, hydrated, sessionStatus, session?.user?.email]);

  const login = useCallback((email, name) => {
    setUser((u) => ({ ...u, loggedIn: true, email, name: name || u.name }));
  }, []);

  const logout = useCallback(() => {
    setUser((u) => ({ ...u, loggedIn: false }));
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((u) => ({ ...u, ...updates }));
  }, []);

  const toggleRsvp = useCallback((eventId) => {
    setRsvps((prev) => {
      const joining = !prev[eventId];
      const next = { ...prev, [eventId]: joining };
      setEvents((evs) =>
        evs.map((e) =>
          e.id === eventId
            ? { ...e, rsvp: joining ? e.rsvp + 1 : Math.max(0, e.rsvp - 1) }
            : e
        )
      );
      if (joining) {
        setUser((u) => ({ ...u, xp: u.xp + 50, eventsJoined: u.eventsJoined + 1 }));
        addNotification({ type: 'event', text: 'You RSVP\'d to an event! +50 XP' });
      }
      // Sync to Supabase
      if (session?.user?.email) {
        const method = joining ? 'POST' : 'DELETE';
        fetch('/api/rsvps', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        }).catch(() => {});
      }
      return next;
    });
  }, [session?.user?.email]);

  // Swipe right = interested (auto RSVP)
  const swipeEventRight = useCallback((eventId) => {
    setSwipedRight((prev) => ({ ...prev, [eventId]: true }));
    setSwipedLeft((prev) => { const n = { ...prev }; delete n[eventId]; return n; });
    // Also RSVP
    setRsvps((prev) => {
      if (prev[eventId]) return prev;
      const next = { ...prev, [eventId]: true };
      setEvents((evs) => evs.map((e) => e.id === eventId ? { ...e, rsvp: e.rsvp + 1 } : e));
      setUser((u) => ({ ...u, xp: u.xp + 50, eventsJoined: u.eventsJoined + 1 }));
      addNotification({ type: 'event', text: 'Swiped right! You\'re going 🎉 +50 XP' });
      // Sync RSVP to Supabase
      if (session?.user?.email) {
        fetch('/api/rsvps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }) }).catch(() => {});
      }
      return next;
    });
    // Sync swipe to Supabase
    if (session?.user?.email) {
      fetch('/api/swipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, direction: 'right' }) }).catch(() => {});
    }
  }, [session?.user?.email]);

  // Swipe left = not interested, goes into hidden pool
  const swipeEventLeft = useCallback((eventId) => {
    setSwipedLeft((prev) => ({ ...prev, [eventId]: true }));
    setSwipedRight((prev) => { const n = { ...prev }; delete n[eventId]; return n; });
    // Remove RSVP if was RSVP'd
    setRsvps((prev) => {
      if (!prev[eventId]) return prev;
      const next = { ...prev };
      delete next[eventId];
      setEvents((evs) => evs.map((e) => e.id === eventId ? { ...e, rsvp: Math.max(0, e.rsvp - 1) } : e));
      // Remove RSVP from Supabase
      if (session?.user?.email) {
        fetch('/api/rsvps', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }) }).catch(() => {});
      }
      return next;
    });
    // Sync swipe to Supabase
    if (session?.user?.email) {
      fetch('/api/swipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, direction: 'left' }) }).catch(() => {});
    }
  }, [session?.user?.email]);

  // Reset hidden pool (resurface not-interested events)
  const resetHiddenPool = useCallback(() => {
    setSwipedLeft({});
  }, []);

  const toggleJoinPack = useCallback((packId) => {
    setJoinedPacks((prev) => {
      const joining = !prev[packId];
      const next = { ...prev, [packId]: joining };
      setPacks((ps) =>
        ps.map((p) =>
          p.id === packId
            ? { ...p, members: joining ? p.members + 1 : Math.max(0, p.members - 1) }
            : p
        )
      );
      if (joining) {
        setUser((u) => ({ ...u, packsCount: u.packsCount + 1 }));
        addNotification({ type: 'pack', text: 'You joined a new pack! Welcome to the family.' });
      }
      // Sync to Supabase
      if (session?.user?.email) {
        const method = joining ? 'POST' : 'DELETE';
        fetch('/api/packs', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packId }),
        }).catch(() => {});
      }
      return next;
    });
  }, [session?.user?.email]);

  const createEvent = useCallback((eventData) => {
    const newEvent = {
      ...eventData,
      id: `e_${Date.now()}`,
      rsvp: 0,
      userCreated: true,
      createdBy: user.name,
    };
    setEvents((prev) => [newEvent, ...prev]);
    setUser((u) => ({ ...u, xp: u.xp + 200 }));
    addNotification({ type: 'event', text: `Your event "${eventData.title}" is live! +200 XP` });
    // Sync to Supabase
    if (session?.user?.email) {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: newEvent }),
      }).catch(() => {});
    }
    return newEvent.id;
  }, [user.name, session?.user?.email]);

  const logActivity = useCallback((activity) => {
    const newActivity = { ...activity, id: `al_${Date.now()}`, date: 'Just now' };
    setMyActivityLog((prev) => [newActivity, ...prev]);
    // Persist to Supabase if logged in
    if (session?.user?.email) {
      fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      }).catch(() => {});
    }
    setActivityFeed((prev) => [
      { id: `af_${Date.now()}`, user: user.name, avatar: user.avatar, sport: activity.type, action: activity.title + (activity.distance ? ` · ${activity.distance}` : ''), xp: activity.xp, time: 'Just now' },
      ...prev,
    ]);
    setUser((u) => ({
      ...u,
      xp: u.xp + activity.xp,
      totalSessions: u.totalSessions + 1,
      totalKm: activity.distance ? u.totalKm + parseFloat(activity.distance) : u.totalKm,
    }));
    addNotification({ type: 'xp', text: `Activity logged! +${activity.xp} XP earned` });
  }, [user]);

  const createPost = useCallback(({ content, sport, mediaUrls, mediaType: mType }) => {
    const newPost = {
      id: `post_${Date.now()}`,
      type: 'activity',
      user: user.name,
      avatar: user.avatar,
      avatarColor: 'bg-packd-orange',
      googleAvatar: user.googleAvatar || null,
      sport: sport || 'All',
      content,
      mediaUrls: mediaUrls || [],
      mediaType: mType || null,
      xp: 50,
      time: 'Just now',
      likes: 0,
      comments: 0,
      fromDB: true,
    };
    setFeedPosts((prev) => [newPost, ...prev]);
    setUser((u) => ({ ...u, xp: u.xp + 50 }));
    addNotification({ type: 'xp', text: 'Post shared with the community! +50 XP' });
    // Sync to Supabase
    if (session?.user?.email) {
      fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newPost.id,
          userName: user.name,
          userAvatar: user.avatar,
          userAvatarColor: 'bg-packd-orange',
          googleAvatar: user.googleAvatar || null,
          content,
          sport: sport || 'All',
          mediaUrls: mediaUrls || [],
          mediaType: mType || null,
          xp: 50,
        }),
      }).catch(() => {});
    }
    return newPost.id;
  }, [user, session?.user?.email]);

  const togglePostLike = useCallback((postId) => {
    setPostLikes((prev) => {
      const liking = !prev[postId];
      // Sync to Supabase
      if (session?.user?.email) {
        const method = liking ? 'POST' : 'DELETE';
        fetch('/api/likes', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        }).catch(() => {});
      }
      return { ...prev, [postId]: liking };
    });
  }, [session?.user?.email]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      if (t === 'dark')         return 'light';
      if (t === 'light')        return 'dark';
      if (t === 'forest-dark')  return 'forest-light';
      if (t === 'forest-light') return 'forest-dark';
      if (t === 'mono-dark')    return 'mono-light';
      if (t === 'mono-light')   return 'mono-dark';
      return 'dark';
    });
  }, []);

  // Apply theme classes to <html> whenever theme changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light', 'forest', 'mono');
    if (theme === 'light')        { root.classList.add('light'); }
    if (theme === 'forest-dark')  { root.classList.add('forest'); }
    if (theme === 'forest-light') { root.classList.add('forest', 'light'); }
    if (theme === 'mono-dark')    { root.classList.add('mono'); }
    if (theme === 'mono-light')   { root.classList.add('mono', 'light'); }
  }, [theme]);

  const sendMessage = useCallback((toUserId, text, imageUrl = null) => {
    const msg = {
      id: `dm_${Date.now()}`,
      text,
      imageUrl: imageUrl || null,
      fromMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setConversations((prev) => {
      const conv = prev[toUserId] || { user: { id: toUserId, name: toUserId, avatar: toUserId[0].toUpperCase(), avatarColor: 'bg-packd-gray' }, messages: [], unread: 0 };
      return {
        ...prev,
        [toUserId]: {
          ...conv,
          messages: [...conv.messages, msg],
          unread: 0,
        },
      };
    });
  }, []);

  const markConversationRead = useCallback((userId) => {
    setConversations((prev) => {
      if (!prev[userId] || prev[userId].unread === 0) return prev;
      return { ...prev, [userId]: { ...prev[userId], unread: 0 } };
    });
  }, []);

  const unreadMessages = Object.values(conversations).reduce((sum, c) => sum + (c.unread || 0), 0);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [
      { id: `n_${Date.now()}`, ...notif, time: 'Just now', read: false },
      ...prev,
    ]);
    // Sync to Supabase
    if (session?.user?.email) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: notif.type, text: notif.text }),
      }).catch(() => {});
    }
  }, [session?.user?.email]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // Sync to Supabase
    if (session?.user?.email) {
      fetch('/api/notifications', { method: 'PUT' }).catch(() => {});
    }
  }, [session?.user?.email]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Events visible in swipe stack: not already swiped right, filter hidden (unless pool is empty)
  const getSwipeableEvents = useCallback(() => {
    const notSwiped = events.filter((e) => !swipedRight[e.id] && !swipedLeft[e.id]);
    if (notSwiped.length > 0) return notSwiped;
    // Pool exhausted — resurface not-interested events
    return events.filter((e) => !swipedRight[e.id]);
  }, [events, swipedRight, swipedLeft]);

  return (
    <AppContext.Provider value={{
      user, login, logout, updateUser,
      events, createEvent,
      packs, toggleJoinPack, joinedPacks,
      rsvps, toggleRsvp,
      activityFeed, myActivityLog, logActivity,
      notifications, unreadCount, markAllNotificationsRead, addNotification,
      swipedRight, swipedLeft, swipeEventRight, swipeEventLeft, resetHiddenPool, getSwipeableEvents,
      postLikes, togglePostLike,
      feedPosts, createPost,
      communityEvents, externalEvents,
      conversations, sendMessage, markConversationRead, unreadMessages,
      theme, toggleTheme, setTheme,
      hydrated,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export const SPORT_COLORS = {
  Running: 'text-packd-orange bg-packd-orange/10',
  Cycling: 'text-blue-400 bg-blue-400/10',
  Football: 'text-packd-green bg-packd-green/10',
  Yoga: 'text-purple-400 bg-purple-400/10',
  CrossFit: 'text-red-400 bg-red-400/10',
  Swimming: 'text-cyan-400 bg-cyan-400/10',
  Basketball: 'text-packd-gold bg-packd-gold/10',
  Tennis: 'text-lime-400 bg-lime-400/10',
  Hiking: 'text-emerald-400 bg-emerald-400/10',
  Badminton: 'text-pink-400 bg-pink-400/10',
  Boxing: 'text-red-500 bg-red-500/10',
  Fitness: 'text-packd-gold bg-packd-gold/10',
  All: 'text-packd-orange bg-packd-orange/10',
  Other: 'text-packd-gray bg-packd-border/30',
};
