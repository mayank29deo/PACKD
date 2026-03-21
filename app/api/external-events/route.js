// Bangalore coordinates
const BLORE_LAT = 12.9716;
const BLORE_LON = 77.5946;

function mapCategory(category) {
  const map = {
    'running': 'Running',
    'cycling': 'Cycling',
    'yoga': 'Yoga',
    'football': 'Football',
    'swimming': 'Swimming',
  };
  const labels = (category || '').toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    if (labels.includes(key)) return val;
  }
  return 'Sports';
}

function inferSportFromTitle(title) {
  const t = (title || '').toLowerCase();
  if (/run|marathon|5k|10k/.test(t)) return 'Running';
  if (/cycl|bike|ride/.test(t)) return 'Cycling';
  if (/yoga/.test(t)) return 'Yoga';
  if (/football|soccer/.test(t)) return 'Football';
  if (/swim/.test(t)) return 'Swimming';
  return 'Sports';
}

export const revalidate = 3600;

export async function GET() {
  const apiKey = process.env.PREDICTHQ_API_KEY;
  if (!apiKey) {
    return Response.json({ events: [] });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const params = new URLSearchParams({
      'within': `50km@${BLORE_LAT},${BLORE_LON}`,
      'category': 'sports',
      'start.gte': today,
      'state': 'active',
      'sort': 'start',
      'limit': '20',
    });

    const res = await fetch(
      `https://api.predicthq.com/v1/events/?${params}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ events: [], _debug: { status: res.status, body: errText } });
    }

    const json = await res.json();
    const raw = json.results || [];

    const events = raw.map((event) => {
      const sport = mapCategory(event.category) !== 'Sports'
        ? mapCategory(event.category)
        : inferSportFromTitle(event.title);

      const venue = event.entities?.find((e) => e.type === 'venue');

      return {
        id: 'ext_' + event.id,
        title: event.title || '',
        sport,
        description: event.description?.slice(0, 300) || '',
        venue: venue?.name || 'TBD',
        area: venue?.formatted_address || 'Bangalore',
        city: 'Bangalore',
        date_time: event.start || '',
        cost: 'Free',
        external_url: `https://predicthq.com/events/${event.id}`,
        source: 'predicthq',
        attendee_count: event.phq_attendance || 0,
      };
    });

    return Response.json({ events });
  } catch (err) {
    return Response.json({ events: [], _debug: { error: String(err) } });
  }
}
