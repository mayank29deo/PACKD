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

// Parse a RIFF/WAV buffer → { fmt, pcmData } or null
function parseWav(buf) {
  if (buf.length < 12) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buf.toString('ascii', 8, 12) !== 'WAVE') return null;
  let offset = 12, fmt = null, pcmData = null;
  while (offset + 8 <= buf.length) {
    const id       = buf.toString('ascii', offset, offset + 4);
    const size     = buf.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    if (id === 'fmt ') {
      fmt = {
        audioFormat:  buf.readUInt16LE(dataStart),
        numChannels:  buf.readUInt16LE(dataStart + 2),
        sampleRate:   buf.readUInt32LE(dataStart + 4),
        bitsPerSample: buf.readUInt16LE(dataStart + 14),
      };
      // WAVEFORMATEXTENSIBLE (0xFFFE): real format is in sub-format GUID bytes 0-1
      if (fmt.audioFormat === 0xFFFE && size >= 40) {
        fmt.audioFormat = buf.readUInt16LE(dataStart + 24);
      }
    } else if (id === 'data') {
      pcmData = buf.slice(dataStart, dataStart + size);
    }
    offset = dataStart + size + (size % 2); // word-align
  }
  return (fmt && pcmData) ? { fmt, pcmData } : null;
}

// Convert IEEE-float-32 PCM → int16 PCM
function floatToInt16(floatBuf) {
  const samples = Math.floor(floatBuf.length / 4);
  const out = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const f = floatBuf.readFloatLE(i * 4);
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, f)) * 32767), i * 2);
  }
  return out;
}

// Build a minimal standard PCM WAV (format type 1)
function buildPcmWav(pcm, sampleRate, channels, bitsPerSample) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);                                      // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28);
  header.writeUInt16LE(channels * bitsPerSample / 8, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

// Fallback: prepend WAV headers to raw PCM (no RIFF header present)
function ensureWavHeaders(buf, sampleRate = 16000, channels = 1, bitsPerSample = 16) {
  if (buf.length >= 4 && buf.toString('ascii', 0, 4) === 'RIFF') return buf;
  return buildPcmWav(buf, sampleRate, channels, bitsPerSample);
}

// ── STT provider 1: Groq Whisper ─────────────────────────────────────────────
async function transcribeWithGroq(audioBuffer, lang) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
  // Groq Whisper accepts WAV directly
  const groqLang = lang?.startsWith('hi') ? 'hi'
    : lang?.startsWith('ta') ? 'ta'
    : lang?.startsWith('te') ? 'te'
    : 'en';
  const form = new FormData();
  form.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'recording.wav');
  form.append('model', 'whisper-large-v3-turbo');
  form.append('language', groqLang);
  form.append('response_format', 'json');
  console.log(`[STT] → Groq Whisper | lang: ${groqLang} | size: ${audioBuffer.length}`);
  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
    body: form,
  });
  const text = await res.text();
  console.log(`[STT] ← Groq | status: ${res.status} | body: ${text}`);
  if (!res.ok) throw new Error(`Groq ${res.status}: ${text}`);
  const json = JSON.parse(text);
  return json.text?.trim() || '';
}

// ── STT provider 2: Reverie ───────────────────────────────────────────────────
async function transcribeWithReverie(audioBuffer, lang) {
  if (!process.env.REVERIE_API_KEY || !process.env.REVERIE_APP_ID) {
    throw new Error('Reverie credentials not configured');
  }
  const revLang = REVERIE_LANG_MAP[lang] || 'en';
  const form = new FormData();
  form.append('audio_file', new Blob([audioBuffer], { type: 'audio/wav' }), 'recording.wav');
  console.log(`[STT] → Reverie | lang: ${revLang} | size: ${audioBuffer.length}`);
  const res = await fetch('https://revapi.reverieinc.com/', {
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
  const text = await res.text();
  console.log(`[STT] ← Reverie | status: ${res.status} | body: ${text}`);
  if (!res.ok) throw new Error(`Reverie ${res.status}: ${text}`);
  let result;
  try { result = JSON.parse(text); } catch { throw new Error(`Reverie bad JSON: ${text}`); }
  if (!result.success) throw new Error(`Reverie failed: ${result.cause || 'unknown'}`);
  return result.text?.trim() || result.display_text?.trim() || '';
}

// ── Main transcription: Groq → Reverie fallback ───────────────────────────────
async function transcribeAudio(audioBase64, mimeType, lang = 'en') {
  let audioBuffer = Buffer.from(audioBase64, 'base64');

  const header4 = audioBuffer.length >= 4 ? audioBuffer.slice(0, 4).toString('ascii') : 'N/A';
  console.log(`[STT] received: ${audioBuffer.length} bytes | mime: ${mimeType} | lang: ${lang} | header: "${header4}"`);

  // Normalise WAV to clean standard PCM WAV (format type 1)
  if (mimeType === 'audio/wav') {
    const parsed = parseWav(audioBuffer);
    if (parsed) {
      let { fmt, pcmData } = parsed;
      console.log(`[STT] WAV fmt: type=${fmt.audioFormat} sr=${fmt.sampleRate} ch=${fmt.numChannels} bps=${fmt.bitsPerSample}`);
      if (fmt.audioFormat === 3 && fmt.bitsPerSample === 32) {
        pcmData = floatToInt16(pcmData);
        fmt = { ...fmt, audioFormat: 1, bitsPerSample: 16 };
      }
      audioBuffer = buildPcmWav(pcmData, fmt.sampleRate, fmt.numChannels, fmt.bitsPerSample);
    } else {
      audioBuffer = ensureWavHeaders(audioBuffer);
    }
    console.log(`[STT] normalised WAV: ${audioBuffer.length} bytes`);
  }

  if (audioBuffer.length < 100) {
    throw new Error(`Audio too small (${audioBuffer.length} bytes) — recording may have failed`);
  }

  // 1️⃣ Try Groq Whisper
  try {
    const transcript = await transcribeWithGroq(audioBuffer, lang);
    if (transcript) { console.log('[STT] Groq succeeded'); return transcript; }
  } catch (groqErr) {
    console.warn('[STT] Groq failed, trying Reverie:', groqErr.message);
  }

  // 2️⃣ Try Reverie
  try {
    const transcript = await transcribeWithReverie(audioBuffer, lang);
    if (transcript) { console.log('[STT] Reverie succeeded'); return transcript; }
  } catch (revErr) {
    console.warn('[STT] Reverie failed:', revErr.message);
  }

  // 3️⃣ Both failed — surface error so mobile app shows keyboard fallback
  throw new Error('STT_FAILED');
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
      // Mobile: audio upload → Groq Whisper → Reverie fallback
      if (!audioData || !mimeType) {
        return Response.json({ error: 'Missing transcript or audioData' }, { status: 400 });
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
    if (err.message === 'STT_FAILED') {
      return Response.json({ error: 'STT_FAILED', sttFailed: true }, { status: 422 });
    }
    return Response.json({ error: err.message || 'Voice analysis failed' }, { status: 500 });
  }
}
