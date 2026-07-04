export class MentorSpeechError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MentorSpeechError';
  }
}

const MAX_CHARS_PER_CHUNK = 240;
const FIRST_CHUNK_MAX_CHARS = 110;
let preconnectDone = false;

type SplitSpeechOptions = {
  chunkMaxChars?: number;
  firstChunkMaxChars?: number;
};

function splitBySentenceLength(text: string, maxChars: number): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const sentences =
    cleaned.match(/[^.!?]+[.!?]?/g)?.map((part) => part.trim()) ?? [cleaned];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (!sentence) continue;
    if ((current + ' ' + sentence).trim().length <= maxChars) {
      current = `${current} ${sentence}`.trim();
      continue;
    }
    if (current) chunks.push(current);
    if (sentence.length <= maxChars) {
      current = sentence;
      continue;
    }

    // Hard split very long sentence so synthesis always gets full output.
    for (let i = 0; i < sentence.length; i += maxChars) {
      chunks.push(sentence.slice(i, i + maxChars).trim());
    }
    current = '';
  }

  if (current) chunks.push(current);
  return chunks;
}

export function splitSpeechTextForTts(
  text: string,
  options: SplitSpeechOptions = {},
): string[] {
  const chunkMaxChars = options.chunkMaxChars ?? MAX_CHARS_PER_CHUNK;
  const firstChunkMaxChars = options.firstChunkMaxChars ?? FIRST_CHUNK_MAX_CHARS;
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const firstChunkMax = Math.min(firstChunkMaxChars, chunkMaxChars);
  if (normalized.length <= firstChunkMax) return [normalized];

  const firstParts = splitBySentenceLength(normalized, firstChunkMax);
  if (!firstParts.length) return [];
  const first = firstParts[0];
  const remaining = normalized.slice(first.length).trimStart();
  if (!remaining) return [first];

  return [first, ...splitBySentenceLength(remaining, chunkMaxChars)];
}

export function preconnectTtsProvider() {
  if (preconnectDone || typeof document === 'undefined') return;
  preconnectDone = true;

  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://api.elevenlabs.io';
  preconnect.crossOrigin = 'anonymous';
  document.head.appendChild(preconnect);

  const dnsPrefetch = document.createElement('link');
  dnsPrefetch.rel = 'dns-prefetch';
  dnsPrefetch.href = 'https://api.elevenlabs.io';
  document.head.appendChild(dnsPrefetch);
}

export async function fetchMentorSpeechAudio(
  textChunk: string,
  signal?: AbortSignal,
): Promise<string> {
  const trimmed = textChunk.trim();
  if (!trimmed) {
    throw new MentorSpeechError('Cannot speak an empty response.');
  }

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: trimmed }),
    signal,
  });

  if (!res.ok) {
    const raw = await res.text();
    let error = 'Text-to-speech request failed.';
    try {
      const data = raw ? (JSON.parse(raw) as { error?: string }) : {};
      if (data.error) error = data.error;
    } catch {
      if (raw.trim()) error = raw.trim();
    }
    throw new MentorSpeechError(error);
  }

  const audioBlob = await res.blob();
  if (!audioBlob.size) {
    throw new MentorSpeechError('Text-to-speech returned empty audio.');
  }

  return URL.createObjectURL(audioBlob);
}

export async function fetchMentorSpeechAudioChunks(
  text: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const chunks = splitSpeechTextForTts(text);
  if (!chunks.length) {
    throw new MentorSpeechError('Cannot speak an empty response.');
  }

  const audioUrls: string[] = [];
  for (const chunk of chunks) {
    if (signal?.aborted) {
      throw new MentorSpeechError('Speech request was aborted.');
    }
    const url = await fetchMentorSpeechAudio(chunk, signal);
    audioUrls.push(url);
  }
  return audioUrls;
}
