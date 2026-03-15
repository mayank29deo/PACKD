import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// GET — load user-created events
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('user_events')
    .select('*')
    .eq('user_email', session.user.email)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // event_data is JSONB — return as array of event objects
  const events = (data || []).map((row) => ({
    ...row.event_data,
    id: row.event_id,
    userCreated: true,
  }));

  return Response.json({ events });
}

// POST — save a user-created event
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { event } = await request.json();
  const supabase = createServerSupabase();

  const { error } = await supabase.from('user_events').upsert(
    {
      user_email: session.user.email,
      event_id: event.id,
      event_data: event,
    },
    { onConflict: 'user_email,event_id' }
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
