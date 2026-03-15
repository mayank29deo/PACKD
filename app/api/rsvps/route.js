import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// GET — load all RSVPs for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('event_rsvps')
    .select('event_id')
    .eq('user_email', session.user.email);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Return as { [eventId]: true } map
  const rsvps = {};
  (data || []).forEach((r) => { rsvps[r.event_id] = true; });
  return Response.json({ rsvps });
}

// POST — add an RSVP
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId } = await request.json();
  const supabase = createServerSupabase();

  const { error } = await supabase.from('event_rsvps').upsert(
    { user_email: session.user.email, event_id: eventId },
    { onConflict: 'user_email,event_id' }
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

// DELETE — remove an RSVP
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId } = await request.json();
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('user_email', session.user.email)
    .eq('event_id', eventId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
