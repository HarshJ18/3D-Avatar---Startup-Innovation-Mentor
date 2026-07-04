import { QUERY_PLACEHOLDER } from '../types';
import { IconSend } from './Icons';

type QuestionInputProps = {
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (text: string) => void;
};

export function QuestionInput({
  disabled,
  inputRef,
  onSubmit,
}: QuestionInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputRef.current?.value.trim();
    if (!text || disabled) return;
    inputRef.current!.value = '';
    onSubmit(text);
  };

  return (
    <div className="shrink-0 border-t border-border-subtle bg-black/45 px-4 py-3">
      <label
        htmlFor="mentor-query"
        className="mb-2 block pl-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-secondary"
      >
        Your question
      </label>
      <form className="flex items-center gap-2" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          id="mentor-query"
          type="text"
          placeholder={QUERY_PLACEHOLDER}
          autoComplete="off"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="min-h-11 flex-1 rounded-xl border border-white/18 bg-[#0a0a0a] px-4 py-3 text-[0.9rem] text-white outline-none transition-all placeholder:text-[#888] focus:border-white/45 focus:bg-[#0f0f0f] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] disabled:opacity-50"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0a0a0a] transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconSend className="h-[18px] w-[18px]" />
        </button>
      </form>
    </div>
  );
}
