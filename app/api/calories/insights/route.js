import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function calcDailyTarget(p) {
  const bmr = p.gender === 'female'
    ? 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161
    : 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5;
  const m = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = bmr * (m[p.activity_level] || 1.55);
  return Math.round(p.goal === 'lose' ? tdee - 500 : p.goal === 'gain' ? tdee + 300 : tdee);
}

function buildWeekDays(weekLogs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLogs = weekLogs.filter(l => new Date(l.logged_at).toISOString().split('T')[0] === dateStr);
    days.push({
      label:    i === 0 ? 'Today' : i === 1 ? 'Yest' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      date:     dateStr,
      calories: dayLogs.reduce((s, l) => s + l.total_calories, 0),
      meals:    dayLogs.length,
    });
  }
  return days;
}

export async function POST(request) {
  try {
    const { profile, weekLogs } = await request.json();
    if (!profile || !weekLogs) {
      return Response.json({ error: 'Missing profile or weekLogs' }, { status: 400 });
    }

    const dailyTarget  = calcDailyTarget(profile);
    const weekDays     = buildWeekDays(weekLogs);
    const trackedDays  = weekDays.filter(d => d.meals > 0);
    const avgCalories  = trackedDays.length > 0
      ? Math.round(trackedDays.reduce((s, d) => s + d.calories, 0) / trackedDays.length)
      : 0;

    const prompt = `You are a personal fitness coach AI. Analyze this user's weekly nutrition data.

User:
- Goal: ${profile.goal} weight
- Current: ${profile.weight_kg}kg → Target: ${profile.target_weight_kg}kg
- Daily calorie target: ${dailyTarget} kcal
- Activity level: ${profile.activity_level}

Last 7 days (${trackedDays.length} days tracked out of 7):
${weekDays.map(d => `- ${d.label}: ${d.calories > 0 ? d.calories + ' kcal (' + d.meals + ' meals)' : 'not tracked'}`).join('\n')}
Weekly average (tracked days): ${avgCalories} kcal/day vs ${dailyTarget} target

Respond ONLY with this exact JSON (no markdown):
{
  "coachMessage": "2-3 sentences: honest assessment of their week + one specific actionable tip based on their actual numbers",
  "weekGrade": "A+|A|B+|B|C|D",
  "trajectoryWeeks": 10,
  "trajectoryMessage": "At this intake pace, [specific weeks/months prediction to reach their goal]",
  "events": [
    { "name": "Specific event/activity name", "type": "cardio|strength|sport|flexibility", "reason": "1 sentence why this helps their specific situation", "intensity": "low|medium|high", "emoji": "🏃" }
  ]
}

Rules:
- events: exactly 3, very specific to their goal (${profile.goal}) and whether they're over/under target
- If goal=lose and avg > target: prioritize high-intensity cardio events
- If goal=lose and avg < target: prioritize strength events to preserve muscle
- If goal=gain: strength, sports, activities that build appetite and muscle
- If goal=maintain: balanced mix of cardio + strength + sport
- weekGrade: be honest — only A if they hit target most days
- trajectoryWeeks: realistic integer based on actual calorie deficit/surplus math
- coachMessage: reference their actual numbers (e.g. "You averaged X kcal...")`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');

    const aiData = JSON.parse(jsonMatch[0]);

    return Response.json({
      success: true,
      data: { ...aiData, weekDays, avgCalories, dailyTarget },
    });
  } catch (err) {
    console.error('Insights API error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
