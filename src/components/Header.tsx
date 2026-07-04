export function Header() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-bg-base px-4 py-2.5 z-50">
      <h1 className="text-[20px] font-bold tracking-tight text-text-primary">
        Productica AI
      </h1>
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-elevated px-3 py-1.5 text-[11px] tracking-wide text-text-secondary">
        <span className="h-[7px] w-[7px] rounded-full bg-success animate-pulse-dot" />
        Mentor Online
      </div>
    </header>
  );
}
