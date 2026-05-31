export const STACK = {
  astro: '^6.4.2',
  tailwind: '^4.3.0',
  sitemap: '^3.7.3',
  biome: '^2.4.16',
  prettier: '^3.8.3',
  prettierPluginAstro: '^0.14.1',
  typescript: '^6.0.0',
  astroCheck: '^0.9.9',
} as const;

export const SKILL_REPO =
  'https://github.com/spillwavesolutions/publishing-astro-websites-agentic-skill.git';
export const SKILL_DIR_IN_REPO = 'publishing-astro-websites';

export const STACK_SUMMARY = [
  `Astro ${STACK.astro}`,
  `Tailwind CSS ${STACK.tailwind} (via @tailwindcss/vite plugin)`,
  `@astrojs/sitemap ${STACK.sitemap} (already wired; emits sitemap-index.xml at build)`,
  `Biome ${STACK.biome} (lint + format for .ts/.js/.json)`,
  `Prettier ${STACK.prettier} + prettier-plugin-astro ${STACK.prettierPluginAstro} (format for .astro)`,
  `TypeScript ${STACK.typescript} (strict)`,
  '`astro check` for type-checking .astro files',
].join(', ');

export const MODEL_OPTIONS: { value: string; label: string; hint?: string }[] = [
  { value: 'sonnet', label: 'Claude Sonnet (latest)', hint: 'balanced, fast — currently 4.6' },
  { value: 'opus', label: 'Claude Opus (latest)', hint: 'smartest, costliest — currently 4.8' },
  { value: 'haiku', label: 'Claude Haiku (latest)', hint: 'cheap, small edits — currently 4.5' },
];
