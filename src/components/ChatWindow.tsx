import { useEffect, useRef } from 'react';
import { mentorProfile } from '../data/mentorProfile';
import type { ChatMessage as ChatMessageType } from '../types';
import { ChatMessage } from './ChatMessage';
import { IconChat, IconLock } from './Icons';
import { QuestionInput } from './QuestionInput';
import { SuggestedTopics } from './SuggestedTopics';

type ChatWindowProps = {
  messages: ChatMessageType[];
  isThinking: boolean;
  isSpeaking: boolean;
  showSuggestedTopics: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (text: string) => void;
  onTopicSelect: (topic: string) => void;
};

export function ChatWindow({
  messages,
  isThinking,
  isSpeaking,
  showSuggestedTopics,
  inputRef,
  onSubmit,
  onTopicSelect,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle bg-white/[0.02] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <IconChat className="h-4 w-4 text-text-secondary" />
          <p className="text-[0.78rem] font-semibold tracking-wide text-text-primary">
            Ask Your Mentor
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[0.68rem] text-text-muted">
          <IconLock className="h-3 w-3" />
          Private &amp; confidential
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="chat-scroll min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-2"
        >
          <div className="mb-2 flex flex-col gap-3">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>

          <div
            className={`mb-2 flex items-center gap-2 text-[0.72rem] text-text-muted ${
              isThinking ? 'flex' : 'hidden'
            }`}
          >
            <span>{mentorProfile.name} is reflecting</span>
            <div className="flex gap-0.5">
              <span className="typing-dot h-[5px] w-[5px] rounded-full bg-white" />
              <span className="typing-dot h-[5px] w-[5px] rounded-full bg-white" />
              <span className="typing-dot h-[5px] w-[5px] rounded-full bg-white" />
            </div>
          </div>

          <SuggestedTopics
            visible={showSuggestedTopics}
            disabled={isThinking || isSpeaking}
            onSelect={onTopicSelect}
          />
        </div>

        <QuestionInput
          disabled={isThinking || isSpeaking}
          inputRef={inputRef}
          onSubmit={onSubmit}
        />
      </div>
    </section>
  );
}
