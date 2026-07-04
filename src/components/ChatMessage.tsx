import { mentorProfile } from '../data/mentorProfile';
import type { ChatMessage as ChatMessageType } from '../types';

type ChatMessageProps = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const sender =
    message.role === 'user'
      ? 'You'
      : message.role === 'mentor'
        ? mentorProfile.name
        : 'System';

  if (message.role === 'mentor' && message.id === 'opening') {
    return (
      <div className="animate-fade-in">
        <p className="mb-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
          {mentorProfile.name}
        </p>
        <blockquote className="border-l-2 border-white/20 pl-4 text-[0.9rem] leading-relaxed text-text-primary">
          {message.text}
        </blockquote>
      </div>
    );
  }

  return (
    <div
      className={`flex max-w-[92%] flex-col gap-1 animate-fade-in ${
        message.role === 'user' ? 'self-end items-end' : 'self-start items-start'
      }`}
    >
      <p className="px-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
        {sender}
      </p>
      <div
        className={`w-full rounded-xl px-3.5 py-3 text-[0.9rem] leading-relaxed whitespace-pre-wrap break-words ${
          message.role === 'user'
            ? 'rounded-br-sm border border-white/65 bg-gradient-to-b from-[#f4f4f5] to-[#e4e4e7] text-[#18181b]'
            : message.role === 'error'
              ? 'rounded-bl-sm border border-red-500/25 border-l-[3px] border-l-red-500 bg-red-950/45 text-red-200 text-[0.82rem]'
              : 'rounded-bl-sm border border-border-subtle border-l-2 border-l-white/50 bg-[#141414] text-text-primary'
        }`}
      >
        {message.text}
        {message.isRevealing ? (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white/70 align-middle" />
        ) : null}
      </div>
    </div>
  );
}
