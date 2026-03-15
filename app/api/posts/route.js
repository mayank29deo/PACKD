import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

function formatTime(iso) {
  if (!iso) return 'Just now';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// GET — load recent community posts (public — no auth required)
export async function GET() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const posts = (data || []).map((p) => ({
    id: p.id,
    type: 'activity',
    user: p.user_name || 'Athlete',
    avatar: p.user_avatar || 'A',
    avatarColor: p.user_avatar_color || 'bg-packd-orange',
    googleAvatar: p.google_avatar || null,
    sport: p.sport || 'All',
    content: p.content || '',
    mediaUrls: p.media_urls || [],
    mediaType: p.media_type || null,
    xp: p.xp || 0,
    time: formatTime(p.created_at),
    likes: 0,
    comments: 0,
    fromDB: true,
  }));

  return Response.json({ posts });
}

// POST — create a new post
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('posts')
    .insert({
      id: body.id,
      user_email: session.user.email,
      user_name: body.userName,
      user_avatar: body.userAvatar,
      user_avatar_color: body.userAvatarColor,
      google_avatar: body.googleAvatar || null,
      content: body.content || '',
      sport: body.sport || 'All',
      media_urls: body.mediaUrls || [],
      media_type: body.mediaType || null,
      xp: body.xp || 50,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ post: data });
}
