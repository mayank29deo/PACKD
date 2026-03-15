import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// GET — load all event swipes for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('event_swipes')
    .select('event_id, direction')
    .eq('user_email', session.user.email);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Return as { right: { [eventId]: true }, left: { [eventId]: true } }
  const swipedRight = {};
  const swipedLeft = {};
  (data || []).forEach((r) => {
    if (r.direction === 'right') swipedRight[r.event_id] = true;
    else if (r.direction === 'left') swipedLeft[r.event_id] = true;
  });
  return Response.json({ swipedRight, swipedLeft });
}

// POST — record a swipe
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId, direction } = await request.json();
  const supabase = createServerSupabase();

  // Upsert so re-swiping the same event just updates direction
  const { error } = await supabase.from('event_swipes').upsert(
    { user_email: session.user.email, event_id: eventId, direction },
    { onConflict: 'user_email,event_id' }
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
