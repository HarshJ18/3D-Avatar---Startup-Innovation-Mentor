# 3D Avatar — Startup Innovation Mentor

Interactive 3D AI mentor (Dr. Nikita) with Stack AI chat and ElevenLabs voice.

## Live demo

**https://3-d-avatar-startup-innovation-mentor-harshj18s-projects.vercel.app**

No login required — open the link and start chatting.

## Repository

**https://github.com/HarshJ18/3D-Avatar---Startup-Innovation-Mentor**

## Features

- 3D avatar with speaking animations (React Three Fiber)
- Stack AI–powered startup mentor responses
- ElevenLabs text-to-speech voice output
- Suggested topics and session reset

## Run locally

```bash
npm install
cp .env.example .env   # add your API keys
npm run dev
```

Open `http://localhost:5173`.

## Environment variables

| Variable | Description |
|----------|-------------|
| `STACKAI_API_KEY` | Stack AI API key |
| `STACKAI_FLOW_URL` | Stack AI workflow inference URL |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID (optional) |

## Deploy

Connected to [Vercel](https://vercel.com). Push to `main` to auto-deploy. Add the same env vars in Vercel → Settings → Environment Variables.

## License

MIT
