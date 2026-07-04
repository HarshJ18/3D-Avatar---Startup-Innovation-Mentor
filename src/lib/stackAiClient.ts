import {
  extractStackAiReply,
  parseStackAiError,
} from './stackAiResponse';

export class MentorApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MentorApiError';
  }
}

export async function sendMessageToMentor(
  message: string,
  userId?: string,
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId }),
  });

  const raw = await res.text();
  let data: { reply?: string; error?: string } = {};

  try {
    data = raw ? (JSON.parse(raw) as { reply?: string; error?: string }) : {};
  } catch {
    throw new MentorApiError(
      raw.trim() || 'Chat service is unavailable. Check Vercel env vars and redeploy.',
    );
  }

  if (!res.ok) {
    throw new MentorApiError(
      parseStackAiError(data.error ?? data),
    );
  }

  const reply =
    typeof data.reply === 'string' && data.reply.trim()
      ? data.reply
      : extractStackAiReply(data);

  if (!reply) {
    throw new MentorApiError('Stack AI returned an empty response.');
  }

  return reply;
}
