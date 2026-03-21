import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { existingAnalysis, voiceTranscript } = await request.json();

    if (!existingAnalysis || !voiceTranscript) {
      return Response.json({ error: 'Missing existingAnalysis or voiceTranscript' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    const prompt = `You are a sports nutritionist AI. A user analysed a meal and got this initial nutritional breakdown:

${JSON.stringify(existingAnalysis, null, 2)}

The user then said they also added: "${voiceTranscript}"

Update the nutritional analysis to include these additions. Keep all existing items and ADD new items for what the user mentioned. Recalculate all totals.

Respond with ONLY this exact JSON (no markdown):
{
  "meal": "updated concise meal name",
  "totalCalories": 520,
  "confidence": "medium",
  "servingNote": "Updated with user additions",
  "macros": {
    "protein": 35,
    "carbs": 55,
    "fat": 14
  },
  "items": [
    { "name": "item name", "calories": 200, "portion": "1 cup" }
  ],
  "athleteTip": "One concise athlete-focused tip about the updated meal",
  "addedItems": ["almond x2", "honey 1 tsp"]
}

Rules:
- Keep all original items intact, append new ones for what the user mentioned
- Recalculate totalCalories and macros to include the additions
- addedItems: short list of what was newly added based on the voice note
- confidence: "medium" unless very clear, never "high" for voice additions
- Be precise about portions based on context clues in the transcript`;

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: 'Could not parse nutritional data' }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return Response.json({ success: true, data });
  } catch (err) {
    console.error('Refine API error:', err);
    return Response.json({ error: err.message || 'Refinement failed' }, { status: 500 });
  }
}
