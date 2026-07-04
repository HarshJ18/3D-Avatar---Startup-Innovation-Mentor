import type { ComponentType } from 'react';
import { mentorProfile } from '../data/mentorProfile';
import type { SpecialtyIcon } from '../data/mentorProfile';
import {
  IconFlask,
  IconHandshake,
  IconRocket,
  IconTrendingUp,
} from './Icons';

const iconMap: Record<SpecialtyIcon, ComponentType<{ className?: string }>> = {
  handshake: IconHandshake,
  'trending-up': IconTrendingUp,
  rocket: IconRocket,
  'flask-conical': IconFlask,
};

export function SpecialtyPills() {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-4">
      {mentorProfile.specialtyPills.map((pill) => {
        const Icon = iconMap[pill.icon];
        return (
          <div
            key={pill.label}
            className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border-subtle bg-pill-bg px-2 py-1.5 transition-colors hover:border-[#3a3a3e] hover:bg-[#252528]"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/6 bg-white/[0.04] text-text-secondary">
              <Icon className="h-2.5 w-2.5" />
            </span>
            <span className="truncate text-[0.6rem] font-semibold leading-tight tracking-tight text-text-primary sm:text-[0.62rem]">
              {pill.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
