import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callStackAiWorkflow } from './stackAi';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, userId } = req.body as {
    message?: string;
    userId?: string;
  };

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
    const message =
      err instanceof Error ? err.message : "Failed to reach Dr. Nikita's workflow";
    console.error('Stack AI request failed:', message);
    return res.status(502).json({ error: message });
  }
}
