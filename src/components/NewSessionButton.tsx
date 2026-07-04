import { IconArrow } from './Icons';

type NewSessionButtonProps = {
  onClick: () => void;
};

export function NewSessionButton({ onClick }: NewSessionButtonProps) {
  return (
    <footer className="flex shrink-0 items-center justify-end border-t border-border-subtle bg-bg-base px-4 py-2.5">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[0.84rem] font-semibold text-black transition-all hover:-translate-y-px hover:shadow-[0_0_24px_rgba(255,255,255,0.22)]"
      >
        New Session
        <IconArrow className="h-4 w-4" />
      </button>
    </footer>
  );
}
