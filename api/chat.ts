import type { VercelRequest, VercelResponse } from '@vercel/node';

type StackAiPayload = Record<string, unknown>;

type ChatBody = {
  message?: string;
  userId?: string;
};

function readChatBody(req: VercelRequest): ChatBody {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as ChatBody;
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body) as ChatBody;
    } catch {
      return {};
    }
  }

  return {};
}

function extractStackAiReply(data: StackAiPayload): string {
  const outputs = data.outputs as Record<string, unknown> | undefined;

  const candidate =
    data['out-0'] ??
    outputs?.['out-0'] ??
    data.output ??
    outputs?.output;

  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate;
  }

  if (candidate && typeof candidate === 'object') {
    const nested = candidate as Record<string, unknown>;
    const nestedText = nested.text ?? nested.content ?? nested.message;
    if (typeof nestedText === 'string' && nestedText.trim()) {
      return nestedText;
    }
  }

  return '';
}

function parseStackAiError(payload: unknown): string {
  if (!payload) return 'Unknown Stack AI error';

  if (typeof payload === 'string') {
    try {
      return parseStackAiError(JSON.parse(payload) as StackAiPayload);
    } catch {
      return payload;
    }
  }

  if (typeof payload === 'object') {
    const data = payload as StackAiPayload;
    if (typeof data.error === 'string') return data.error;
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string') return data.message;
  }

  return 'Unknown Stack AI error';
}

async function callStackAiWorkflow(
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
  let data: StackAiPayload = {};

  try {
    data = raw ? (JSON.parse(raw) as StackAiPayload) : {};
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userId } = readChatBody(req);

  const flowUrl = process.env.STACKAI_FLOW_URL;
  const apiKey = process.env.STACKAI_API_KEY;

  if (!flowUrl || !apiKey) {
    return res.status(500).json({
      error: 'Missing STACKAI_FLOW_URL or STACKAI_API_KEY in environment',
    });
  }

  try {
    const reply = await callStackAiWorkflow(
      flowUrl,
      apiKey,
      message ?? '',
      userId,
    );
    return res.status(200).json({ reply });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to reach Dr. Nikita's workflow";
    console.error('Stack AI request failed:', errorMessage);
    return res.status(502).json({ error: errorMessage });
  }
}
