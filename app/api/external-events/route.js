function inferSport(text) {
  const t = (text || '').toLowerCase();
  if (/running|run|marathon/.test(t)) return 'Running';
  if (/cycling|bike|ride/.test(t)) return 'Cycling';
  if (/yoga/.test(t)) return 'Yoga';
  if (/football|soccer/.test(t)) return 'Football';
  if (/swimming|swim/.test(t)) return 'Swimming';
  if (/fitness|gym|workout/.test(t)) return 'Fitness';
  return 'Sports';
}

export async function GET() {
  const apiKey = process.env.EVENTBRITE_API_KEY;
  if (!apiKey) {
    return Response.json({ events: [] });
  }

  try {
    const url =
      `https://www.eventbriteapi.com/v3/events/search/?q=fitness+sports+running+cycling` +
      `&location.address=Bangalore,India&location.within=50km&expand=venue,organizer` +
      `&token=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return Response.json({ events: [] });
    }

    const json = await res.json();
    const raw = json.events || [];

    const events = raw.map((event) => ({
      id: 'ext_' + event.id,
      title: event.name?.text || '',
      sport: inferSport((event.name?.text || '') + ' ' + (event.description?.text || '')),
      description: event.description?.text?.slice(0, 300) || '',
      venue: event.venue?.name || 'TBD',
      area: event.venue?.address?.city || 'Bangalore',
      city: 'Bangalore',
      date_time: event.start?.utc || '',
      cost: event.is_free
        ? 'Free'
        : '₹' + (event.ticket_availability?.minimum_ticket_price?.major_value || '?'),
      external_url: event.url || '',
      source: 'eventbrite',
      attendee_count: event.capacity || 0,
    }));

    return Response.json({ events });
  } catch {
    return Response.json({ events: [] });
  }
}
