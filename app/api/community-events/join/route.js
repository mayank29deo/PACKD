import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { createServerSupabase } from '../../../../lib/supabase';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId } = await request.json();
  if (!eventId) return Response.json({ error: 'eventId required' }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('event_attendees')
    .upsert(
      {
        event_id: eventId,
        user_email: session.user.email,
        user_name: session.user.name || session.user.email.split('@')[0],
      },
      { onConflict: 'event_id,user_email' }
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId } = await request.json();
  if (!eventId) return Response.json({ error: 'eventId required' }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('event_attendees')
    .delete()
    .eq('event_id', eventId)
    .eq('user_email', session.user.email);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
