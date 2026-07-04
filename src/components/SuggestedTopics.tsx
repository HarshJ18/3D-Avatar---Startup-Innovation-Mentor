import { mentorProfile } from '../data/mentorProfile';

type SuggestedTopicsProps = {
  visible: boolean;
  disabled: boolean;
  onSelect: (topic: string) => void;
};

export function SuggestedTopics({
  visible,
  disabled,
  onSelect,
}: SuggestedTopicsProps) {
  if (!visible) return null;

  return (
    <div className="mb-2">
      <p className="mb-2 pl-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
        Suggested topics
      </p>
      <div className="starter-chips-scroll flex flex-wrap gap-2 max-md:flex-nowrap max-md:overflow-x-auto max-md:pb-1">
        {mentorProfile.suggestedTopics.map((topic) => (
          <button
            key={topic}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(topic)}
            className="shrink-0 rounded-full border border-border-subtle bg-white/[0.03] px-3.5 py-2 text-[0.74rem] font-medium text-text-secondary transition-all hover:-translate-y-px hover:border-white/35 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
