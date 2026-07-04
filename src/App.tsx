import { useCallback, useEffect, useRef, useState } from 'react';
import { AvatarStage } from './components/AvatarStage';
import { ChatWindow } from './components/ChatWindow';
import { Header } from './components/Header';
import { MentorIdentityCard } from './components/MentorIdentityCard';
import { NewSessionButton } from './components/NewSessionButton';
import { SpecialtyPills } from './components/SpecialtyPills';
import { mentorProfile } from './data/mentorProfile';
import { revealMessageWordByWord } from './lib/revealMessage';
import { sendMessageToMentor, MentorApiError } from './lib/stackAiClient';
import {
  fetchMentorSpeechAudio,
  preconnectTtsProvider,
  splitSpeechTextForTts,
} from './lib/ttsClient';
import type { AvatarState, ChatMessage } from './types';
import { FALLBACK_ERROR_MESSAGE } from './types';

function formatChatError(err: unknown): string {
  const raw =
    err instanceof MentorApiError
      ? err.message
      : err instanceof Error
        ? err.message
        : FALLBACK_ERROR_MESSAGE;

  if (/DeploymentNotFound/i.test(raw)) {
    return 'Dr. Nikita\'s Stack AI workflow needs a valid LLM model. Open your workflow in Stack AI, fix the OpenAI/LLM node model, then try again.';
  }

  if (/Missing STACKAI/i.test(raw)) {
    return 'API keys are missing. Add STACKAI_API_KEY and STACKAI_FLOW_URL to your .env file, then restart the dev server.';
  }

  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
}

function createOpeningMessage(): ChatMessage {
  return {
    id: 'opening',
    role: 'mentor',
    text: mentorProfile.openingMessage,
  };
}

function createUserId(): string {
  return `user-${crypto.randomUUID()}`;
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createOpeningMessage(),
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSuggestedTopics, setShowSuggestedTopics] = useState(true);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');

  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(0);
  const userIdRef = useRef(createUserId());
  const revealSignalRef = useRef({ cancelled: false });
  const speechAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechUrlRef = useRef<string | null>(null);
  const speechAbortRef = useRef<AbortController | null>(null);

  const stopActiveSpeech = useCallback((cancelReveal = false) => {
    if (cancelReveal) {
      revealSignalRef.current.cancelled = true;
    }
    speechAbortRef.current?.abort();
    speechAbortRef.current = null;
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current.src = '';
      speechAudioRef.current = null;
    }
    if (speechUrlRef.current) {
      URL.revokeObjectURL(speechUrlRef.current);
      speechUrlRef.current = null;
    }
  }, []);

  const handleNewSession = useCallback(() => {
    sessionIdRef.current += 1;
    stopActiveSpeech(true);
    revealSignalRef.current = { cancelled: false };
    userIdRef.current = createUserId();
    setIsThinking(false);
    setIsSpeaking(false);
    setAvatarState('idle');
    setShowSuggestedTopics(true);
    setMessages([createOpeningMessage()]);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.blur();
    }
  }, [stopActiveSpeech]);

  const revealMentorReply = useCallback(
    async (messageId: string, fullText: string, activeSession: number) => {
      setIsSpeaking(true);
      setAvatarState('speaking');
      speechAbortRef.current?.abort();
      speechAbortRef.current = new AbortController();
      revealSignalRef.current = { cancelled: false };
      const signal = revealSignalRef.current;
      const speechSignal = speechAbortRef.current.signal;

      const revealPromise = revealMessageWordByWord(
        fullText,
        (partial) => {
          if (activeSession !== sessionIdRef.current) return;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, text: partial, isRevealing: true }
                : msg,
            ),
          );
        },
        signal,
      );

      const speechPromise = (async () => {
        preconnectTtsProvider();
        const textChunks = splitSpeechTextForTts(fullText, {
          firstChunkMaxChars: 100,
          chunkMaxChars: 240,
        });
        for (const chunk of textChunks) {
          if (speechSignal.aborted || activeSession !== sessionIdRef.current) return;
          const speechUrl = await fetchMentorSpeechAudio(chunk, speechSignal);
          if (speechUrlRef.current) URL.revokeObjectURL(speechUrlRef.current);
          speechUrlRef.current = speechUrl;

          const audio = new Audio(speechUrl);
          speechAudioRef.current = audio;
          await new Promise<void>((resolve, reject) => {
            const cleanup = () => {
              speechSignal.removeEventListener('abort', onAbort);
            };
            const onEnded = () => {
              cleanup();
              resolve();
            };
            const onError = () => {
              cleanup();
              reject(new Error('Unable to play voice output.'));
            };
            const onAbort = () => {
              audio.pause();
              cleanup();
              resolve();
            };

            audio.addEventListener('ended', onEnded, { once: true });
            audio.addEventListener('error', onError, { once: true });
            speechSignal.addEventListener('abort', onAbort, { once: true });

            audio
              .play()
              .then(() => undefined)
              .catch((err) => reject(err));
          });
        }
      })().catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        if (!/aborted/i.test(message)) {
          console.warn('Voice playback failed:', message);
        }
      });

      await Promise.allSettled([revealPromise, speechPromise]);

      if (activeSession !== sessionIdRef.current || signal.cancelled) {
        setIsSpeaking(false);
        setAvatarState('idle');
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, text: fullText, isRevealing: false }
            : msg,
        ),
      );
      setIsSpeaking(false);
      setAvatarState('idle');
      speechAbortRef.current = null;
      if (speechAudioRef.current) {
        speechAudioRef.current.src = '';
        speechAudioRef.current = null;
      }
      if (speechUrlRef.current) {
        URL.revokeObjectURL(speechUrlRef.current);
        speechUrlRef.current = null;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text || isThinking || isSpeaking) return;

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      const activeSession = sessionIdRef.current;
      setShowSuggestedTopics(false);
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text },
      ]);
      setIsThinking(true);
      setAvatarState('thinking');

      try {
        const reply = await sendMessageToMentor(text, userIdRef.current);
        if (activeSession !== sessionIdRef.current) return;

        setIsThinking(false);
        const mentorMessageId = `mentor-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: mentorMessageId,
            role: 'mentor',
            text: '',
            isRevealing: true,
          },
        ]);

        const replyText =
          typeof reply === 'string' ? reply : String(reply ?? FALLBACK_ERROR_MESSAGE);

        await revealMentorReply(mentorMessageId, replyText, activeSession);
      } catch (err) {
        if (activeSession !== sessionIdRef.current) return;
        setIsThinking(false);
        setAvatarState('idle');
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'error',
            text: formatChatError(err),
          },
        ]);
      } finally {
        if (activeSession === sessionIdRef.current) {
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
    },
    [isThinking, isSpeaking, revealMentorReply],
  );

  const handleTopicSelect = useCallback(
    (topic: string) => {
      if (isThinking || isSpeaking) return;
      sendMessage(topic);
    },
    [isThinking, isSpeaking, sendMessage],
  );

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
    preconnectTtsProvider();
  }, []);

  useEffect(() => {
    return () => {
      stopActiveSpeech();
    };
  }, [stopActiveSpeech]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg-base">
      <Header />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden max-md:grid-rows-[34fr_66fr] md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="flex min-h-0 flex-col gap-2 overflow-hidden px-4 py-2 max-md:px-4 max-md:py-2">
          <div className="flex shrink-0 flex-col gap-2">
            <MentorIdentityCard />
            <SpecialtyPills />
          </div>
          <ChatWindow
            messages={messages}
            isThinking={isThinking}
            isSpeaking={isSpeaking}
            showSuggestedTopics={showSuggestedTopics}
            inputRef={inputRef}
            onSubmit={sendMessage}
            onTopicSelect={handleTopicSelect}
          />
        </div>
        <AvatarStage avatarState={avatarState} isSpeaking={isSpeaking} />
      </div>
      <NewSessionButton onClick={handleNewSession} />
    </div>
  );
}
