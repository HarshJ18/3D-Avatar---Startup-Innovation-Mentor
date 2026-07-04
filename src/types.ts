export type AvatarState = 'idle' | 'thinking' | 'speaking';

export type AvatarStatus = {
  state: AvatarState;
  label: string;
};

export type ChatRole = 'mentor' | 'user' | 'error';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  isRevealing?: boolean;
};

export const FALLBACK_ERROR_MESSAGE =
  "I'm having trouble connecting right now — try again in a moment.";

export const QUERY_PLACEHOLDER =
  'Ask about fundraising, partnerships, accelerator readiness, or scaling your venture...';
