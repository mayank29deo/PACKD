import Anthropic from '@anthropic-ai/sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a sports nutritionist AI assistant embedded in a fitness app for athletes.
Your job is to analyze food photos and give accurate, athlete-relevant calorie and macro estimates.
Always respond with ONLY valid JSON — no markdown, no explanation outside the JSON.`;

const USER_PROMPT = `Analyze this food image and estimate the nutritional content.
Respond with ONLY this exact JSON structure (no extra text):
{
  "meal": "short descriptive name of the meal",
  "totalCalories": 450,
  "confidence": "high",
  "servingNote": "Estimated for 1 standard plate/serving",
  "macros": {
    "protein": 30,
    "carbs": 50,
    "fat": 12
  },
  "items": [
    { "name": "item name", "calories": 200, "portion": "1 cup" }
  ],
  "athleteTip": "One concise athlete-focused tip about this meal"
}

Rules:
- totalCalories should be a realistic integer
- macros are in grams
- confidence is "high", "medium", or "low"
- items list the main components (max 5)
- If you cannot identify food, set meal to "Unknown food" and confidence to "low"`;

export async function POST(request) {
  try {
    const { imageData, mimeType } = await request.json();

    if (!imageData || !mimeType) {
      return Response.json({ error: 'Missing imageData or mimeType' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      return Response.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageData } },
          { type: 'text', text: USER_PROMPT },
        ],
      }],
    });

    const rawText = response.content[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ error: 'Could not parse nutritional data' }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);

    // DB save is handled explicitly by the /api/calories/log endpoint
    // so the user can adjust quantities / add voice refinements before logging.
    return Response.json({ success: true, data });
  } catch (err) {
    console.error('Calorie API error:', err);
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: 'Invalid Anthropic API key' }, { status: 401 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: 'Rate limited — try again shortly' }, { status: 429 });
    }
    if (err instanceof Anthropic.APIStatusError && err.status === 529) {
      return Response.json({ error: 'AI is busy right now — please try again in a moment' }, { status: 503 });
    }
    if (err?.error?.type === 'overloaded_error') {
      return Response.json({ error: 'AI is busy right now — please try again in a moment' }, { status: 503 });
    }
    return Response.json({ error: err.message || 'Analysis failed' }, { status: 500 });
  }
}
