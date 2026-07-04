import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const ELEVENLABS_MODEL = 'eleven_multilingual_v2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body as { text?: string };
  const trimmedText = typeof text === 'string' ? text.trim() : '';

  if (!trimmedText) {
    return res.status(400).json({ error: 'Missing text for speech synthesis.' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'Missing ELEVENLABS_API_KEY in environment.' });
  }

  try {
    const speechRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: trimmedText,
          model_id: ELEVENLABS_MODEL,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
          },
        }),
      },
    );

    if (!speechRes.ok) {
      const errorBody = await speechRes.text();
      return res.status(speechRes.status).json({
        error: `ElevenLabs request failed: ${errorBody || speechRes.statusText}`,
      });
    }

    const audioBuffer = Buffer.from(await speechRes.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audioBuffer);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Text-to-speech request failed.';
    return res.status(502).json({ error: message });
  }
}
