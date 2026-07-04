import {
  extractStackAiReply,
  parseStackAiError,
} from './lib/stackAiResponse';

export async function callStackAiWorkflow(
  flowUrl: string,
  apiKey: string,
  message: string,
  userId?: string,
): Promise<string> {
  const response = await fetch(flowUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId || '',
      'in-0': message,
    }),
  });

  const raw = await response.text();
  let data: Record<string, unknown> = {};

  try {
    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    data = { error: raw };
  }

  if (!response.ok) {
    throw new Error(
      parseStackAiError(data.detail ?? data.error ?? data.message ?? raw),
    );
  }

  const reply = extractStackAiReply(data);
  if (!reply) {
    throw new Error('Stack AI returned an empty response.');
  }

  return reply;
}
