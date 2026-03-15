import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// GET — load notifications for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const notifications = (data || []).map((n) => ({
    id: n.id,
    type: n.type,
    text: n.text,
    time: n.time_label || 'Just now',
    read: n.read ?? false,
  }));

  return Response.json({ notifications });
}

// POST — add a notification
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, text } = await request.json();
  const supabase = createServerSupabase();

  const { error } = await supabase.from('notifications').insert({
    user_email: session.user.email,
    type,
    text,
    time_label: 'Just now',
    read: false,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

// PUT — mark all notifications as read
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_email', session.user.email)
    .eq('read', false);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
