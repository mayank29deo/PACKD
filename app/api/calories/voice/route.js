import Anthropic from '@anthropic-ai/sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { createServerSupabase } from '../../../../lib/supabase';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Map BCP-47 locale codes (from mobile) to Reverie 2-letter lang codes
const REVERIE_LANG_MAP = {
  'en-IN': 'en', 'en': 'en',
  'hi-IN': 'hi', 'hi': 'hi',
  'ta-IN': 'ta', 'ta': 'ta',
  'te-IN': 'te', 'te': 'te',
};

async function transcribeAudio(audioBase64, mimeType, lang = 'en') {
  const audioBuffer = Buffer.from(audioBase64, 'base64');
  // Always use .wav extension — Reverie STT file API requires PCM/WAV
  const ext = mimeType === 'audio/wav' ? 'wav' : (mimeType.split('/')[1]?.split(';')[0] || 'wav');
  const revLang = REVERIE_LANG_MAP[lang] || 'en';

  const form = new FormData();
  form.append('audio_file', new Blob([audioBuffer], { type: mimeType }), `recording.${ext}`);

  const response = await fetch('https://revapi.reverieinc.com/', {
    method: 'POST',
    headers: {
      'REV-API-KEY': process.env.REVERIE_API_KEY,
      'REV-APP-ID':  process.env.REVERIE_APP_ID,
      'REV-APPNAME': 'stt_file',
      'src_lang':    revLang,
      'domain':      'general',
    },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Transcription failed: ${response.status} ${errText}`);
  }

  const result = await response.json();
  return result.text?.trim() || result.display_text?.trim() || '';
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
    const body = await request.json();
    const { transcript: directTranscript, audioData, mimeType, lang } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    let transcript;

    if (directTranscript) {
      // Browser transcribed via Web Speech API — use directly
      transcript = directTranscript.trim();
    } else {
      // Fallback: audio upload via Reverie
      if (!audioData || !mimeType) {
        return Response.json({ error: 'Missing transcript or audioData' }, { status: 400 });
      }
      if (!process.env.REVERIE_API_KEY || !process.env.REVERIE_APP_ID) {
        return Response.json({ error: 'Reverie API credentials not configured' }, { status: 500 });
      }
      transcript = await transcribeAudio(audioData, mimeType, lang);
    }

    if (!transcript) {
      return Response.json({ error: 'Could not transcribe — please try speaking more clearly' }, { status: 422 });
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
