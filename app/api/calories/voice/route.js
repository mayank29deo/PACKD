import Anthropic from '@anthropic-ai/sdk';
import OpenAI, { toFile } from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { createServerSupabase } from '../../../../lib/supabase';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// NVIDIA NIM is OpenAI-API-compatible — point the SDK at their base URL
function getNvidiaClient() {
  return new OpenAI({
    apiKey:  process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
}

async function transcribeAudio(audioBase64, mimeType) {
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const ext = mimeType.split('/')[1]?.split(';')[0] || 'webm';

  // toFile() from the openai SDK creates a properly-typed File object
  // that the SDK's multipart uploader handles correctly in Node.js
  const file = await toFile(audioBuffer, `recording.${ext}`, { type: mimeType });

  const nvidia = getNvidiaClient();
  const transcription = await nvidia.audio.transcriptions.create({
    file,
    model: 'openai/whisper-large-v3',
  });

  return transcription.text?.trim() || '';
}

async function analyseTranscript(transcript) {
  const prompt = `You are a sports nutritionist AI. A user verbally described what they ate. Estimate the nutritional content.

User said: "${transcript}"

Respond with ONLY this exact JSON (no markdown):
{
  "meal": "concise meal name based on what they described",
  "totalCalories": 450,
  "confidence": "medium",
  "servingNote": "Estimated from verbal description",
  "macros": {
    "protein": 30,
    "carbs": 50,
    "fat": 12
  },
  "items": [
    { "name": "item name", "calories": 200, "portion": "estimated portion" }
  ],
  "athleteTip": "One concise athlete-focused tip about this meal"
}

Rules:
- Give realistic ballpark estimates based on common Indian/international portions
- confidence should be "low" or "medium" since this is verbal — never "high"
- items: max 5, list what they mentioned
- If unclear, make a reasonable assumption and note it in servingNote
- totalCalories must be a realistic integer`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = response.content[0]?.text || '';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse nutritional data');
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request) {
  try {
    const { audioData, mimeType } = await request.json();

    if (!audioData || !mimeType) {
      return Response.json({ error: 'Missing audioData or mimeType' }, { status: 400 });
    }

    if (!process.env.NVIDIA_API_KEY) {
      return Response.json({ error: 'NVIDIA API key not configured' }, { status: 500 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Step 1: Transcribe audio
    const transcript = await transcribeAudio(audioData, mimeType);
    if (!transcript) {
      return Response.json({ error: 'Could not transcribe audio — please try speaking more clearly' }, { status: 422 });
    }

    // Step 2: Analyse transcript for nutrition
    const data = await analyseTranscript(transcript);

    // Step 3: Save to DB if user is signed in (non-fatal)
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        const supabase = createServerSupabase();
        await supabase.from('meal_logs').insert({
          user_email:     session.user.email,
          meal_name:      data.meal,
          total_calories: data.totalCalories,
          protein_g:      data.macros?.protein || 0,
          carbs_g:        data.macros?.carbs   || 0,
          fat_g:          data.macros?.fat     || 0,
          items:          data.items   || [],
          confidence:     data.confidence,
          serving_note:   data.servingNote,
          athlete_tip:    data.athleteTip,
        });
      }
    } catch (dbErr) {
      console.warn('Voice meal log save failed (non-fatal):', dbErr.message);
    }

    return Response.json({ success: true, transcript, data });
  } catch (err) {
    console.error('Voice API error:', err);
    return Response.json({ error: err.message || 'Voice analysis failed' }, { status: 500 });
  }
}
