import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

export async function GET() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('community_events')
    .select('*')
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Fetch attendee counts separately to avoid foreign-key join issues
  const eventIds = (data || []).map((e) => e.id);
  let attendeeCounts = {};
  if (eventIds.length > 0) {
    const { data: attendees } = await supabase
      .from('event_attendees')
      .select('event_id')
      .in('event_id', eventIds);
    (attendees || []).forEach((r) => {
      attendeeCounts[r.event_id] = (attendeeCounts[r.event_id] || 0) + 1;
    });
  }

  const events = (data || []).map((e) => ({
    ...e,
    attendee_count: attendeeCounts[e.id] || 0,
  }));

  return Response.json({ events });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, sport, description, venue, area, city, date_time, cost, max_attendees } =
    await request.json();

  if (!title || !date_time) {
    return Response.json({ error: 'title and date_time are required' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('community_events')
    .insert({
      title,
      sport: sport || 'Sports',
      description: description || '',
      venue: venue || 'TBD',
      area: area || '',
      city: city || 'Bangalore',
      date_time,
      cost: cost || 'Free',
      max_attendees: max_attendees || null,
      organizer_email: session.user.email,
      organizer_name: session.user.name || session.user.email.split('@')[0],
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ event: data }, { status: 201 });
}
