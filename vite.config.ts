import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { callStackAiWorkflow } from './lib/stackAi';

function stackAiDevApi(): Plugin {
  return {
    name: 'stack-ai-dev-api',
    configureServer(server) {
      server.middlewares.use(
        '/api/chat',
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          try {
            const env = loadEnv(server.config.mode, server.config.envDir, '');
            const body = await readBody(req);
            const { message, userId } = JSON.parse(body) as {
              message?: string;
              userId?: string;
            };

            const flowUrl = env.STACKAI_FLOW_URL;
            const apiKey = env.STACKAI_API_KEY;

            if (!flowUrl || !apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error:
                    'Missing STACKAI_FLOW_URL or STACKAI_API_KEY in .env',
                }),
              );
              return;
            }

            const reply = await callStackAiWorkflow(
              flowUrl,
              apiKey,
              message ?? '',
              userId,
            );

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ reply }));
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "Failed to reach Dr. Nikita's workflow";
            console.error('Stack AI request failed:', message);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: message }));
          }
        },
      );
    },
  };
}

function elevenLabsDevApi(): Plugin {
  return {
    name: 'elevenlabs-dev-api',
    configureServer(server) {
      server.middlewares.use(
        '/api/tts',
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          try {
            const env = loadEnv(server.config.mode, server.config.envDir, '');
            const body = await readBody(req);
            const { text } = JSON.parse(body) as { text?: string };
            const trimmedText = typeof text === 'string' ? text.trim() : '';

            if (!trimmedText) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing text for speech synthesis.' }));
              return;
            }

            const apiKey = env.ELEVENLABS_API_KEY;
            const voiceId = env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing ELEVENLABS_API_KEY in .env' }));
              return;
            }

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
                  model_id: 'eleven_multilingual_v2',
                  voice_settings: {
                    stability: 0.45,
                    similarity_boost: 0.8,
                  },
                }),
              },
            );

            if (!speechRes.ok) {
              const errorBody = await speechRes.text();
              res.statusCode = speechRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: `ElevenLabs request failed: ${errorBody || speechRes.statusText}`,
                }),
              );
              return;
            }

            const audioBuffer = Buffer.from(await speechRes.arrayBuffer());
            res.statusCode = 200;
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'no-store');
            res.end(audioBuffer);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Text-to-speech request failed.';
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: message }));
          }
        },
      );
    },
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stackAiDevApi(), elevenLabsDevApi()],
});
