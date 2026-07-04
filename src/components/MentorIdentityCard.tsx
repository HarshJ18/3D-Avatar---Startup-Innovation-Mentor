import { mentorProfile } from '../data/mentorProfile';

export function MentorIdentityCard() {
  return (
    <section className="shrink-0">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-text-secondary">
        {mentorProfile.role}
      </p>
      <h2 className="mb-0.5 text-[clamp(1.55rem,2.4vw,2.1rem)] font-bold leading-[1.08] tracking-tight text-text-primary">
        {mentorProfile.name}
      </h2>
      <p className="mb-1 text-[0.92rem] font-semibold leading-snug tracking-tight text-text-primary">
        {mentorProfile.tagline}
      </p>
      <p className="text-[0.82rem] leading-relaxed text-text-secondary">
        {mentorProfile.subtext}
      </p>
    </section>
  );
}
