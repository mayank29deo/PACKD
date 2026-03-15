import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// GET — load activity log
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Map DB columns → app shape
  const activities = (data || []).map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    distance: a.distance || '',
    pace: a.pace || '',
    xp: a.xp || 0,
    icon: a.icon || '🏃',
    date: a.date_label || 'Just now',
  }));

  return Response.json({ activities });
}

// POST — save a new activity
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activity = await request.json();
  const supabase = createServerSupabase();

  const { error } = await supabase.from('activities').insert({
    id: activity.id,
    user_email: session.user.email,
    type: activity.type,
    title: activity.title,
    distance: activity.distance || '',
    pace: activity.pace || '',
    xp: activity.xp || 0,
    icon: activity.icon || '🏃',
    date_label: activity.date || 'Just now',
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
