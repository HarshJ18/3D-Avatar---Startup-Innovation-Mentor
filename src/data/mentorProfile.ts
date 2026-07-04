export const mentorProfile = {
  name: 'Dr. Nikita Vadsaria',
  role: 'Startup & Innovation Mentor',
  tagline: 'Strategic. Data-Driven. Founder-Focused.',
  subtext:
    '20+ years bridging research, startups, and capital — ask about fundraising strategy, partnerships, accelerator readiness, or scaling your venture.',
  avatarFile: '/avatar/dr-nikita.glb',
  specialtyPills: [
    { icon: 'handshake', label: 'Strategic Partnerships' },
    { icon: 'trending-up', label: 'Fundraising' },
    { icon: 'rocket', label: 'Startup Scaling' },
    { icon: 'flask-conical', label: 'Research Commercialization' },
  ],
  suggestedTopics: [
    'Am I accelerator-ready?',
    'Review my business model',
    'How do I find the right investors?',
    'Should I commercialize this research?',
    'Help me build a partnership pitch',
    'Is my startup ecosystem strategy solid?',
  ],
  openingMessage:
    "Hello, I'm Dr. Nikita. I've spent my career at the intersection of research, startups, and capital — from co-founding an AgTech venture, to evaluating deals as a Venture Fellow, to building accelerator programs and strategic partnerships today. Tell me about your venture or research — where you are, who you're trying to reach, and what's blocking you — and let's map out the next step together.",
} as const;

export type SpecialtyIcon = (typeof mentorProfile.specialtyPills)[number]['icon'];
