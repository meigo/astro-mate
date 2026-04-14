export const STACK = {
  astro: '^6.0.0',
  tailwind: '^4.0.0',
  biome: '^1.9.4',
  typescript: '^5.7.0',
  astroCheck: '^0.9.0',
} as const;

export const SKILL_REPO =
  'https://github.com/spillwavesolutions/publishing-astro-websites-agentic-skill.git';
export const SKILL_DIR_IN_REPO = 'publishing-astro-websites';

export const STACK_SUMMARY = [
  `Astro ${STACK.astro}`,
  `Tailwind CSS ${STACK.tailwind} (via @tailwindcss/vite plugin)`,
  `Biome ${STACK.biome} (lint + format)`,
  `TypeScript ${STACK.typescript} (strict)`,
  '`astro check` for type-checking .astro files',
].join(', ');

export const MODEL_OPTIONS: { value: string; label: string; hint?: string }[] = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', hint: 'balanced, fast' },
  { value: 'claude-opus-4-6', label: 'Claude Opus 4.6', hint: 'smartest, slowest, costliest' },
  {
    value: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    hint: 'cheap, best for small edits',
  },
];
