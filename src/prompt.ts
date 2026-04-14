import { SKILL_DIR_IN_REPO, STACK_SUMMARY } from './stack.js';

export interface PromptInput {
  userPrompt: string;
  attempt: number;
  maxAttempts: number;
  previousError?: string;
}

export function buildPrompt(input: PromptInput): string {
  const { userPrompt, attempt, maxAttempts, previousError } = input;
  const isRetry = attempt > 1;

  const header = isRetry
    ? `# Retry attempt ${attempt} of ${maxAttempts}\n\nA previous attempt left the project failing verification. Fix the specific errors below — do not rewrite files that already work.\n\n\`\`\`\n${(previousError ?? '').slice(-6000)}\n\`\`\`\n`
    : '# Build this Astro website';

  return `${header}

## User prompt

${userPrompt}

## Locked stack — do NOT deviate

${STACK_SUMMARY}

The project has already been scaffolded for you. Files in place:

- \`package.json\` — dependencies pinned; do not change Astro/Tailwind/Biome major versions.
- \`astro.config.mjs\` — Tailwind v4 is wired via \`@tailwindcss/vite\`. Do not install \`@astrojs/tailwind\` (that was the v3 integration, now deprecated).
- \`src/styles/global.css\` — contains \`@import "tailwindcss";\`. This is the Tailwind v4 entry.
- \`src/layouts/Layout.astro\` — imports \`global.css\`. Add content to this layout; do not create a second global stylesheet.
- \`tsconfig.json\` — extends \`astro/tsconfigs/strict\`. Keep strict mode.
- \`biome.json\` — Biome is the only linter/formatter. Do not add ESLint or Prettier.
- \`.claude/skills/${SKILL_DIR_IN_REPO}/\` — the publishing-astro-websites skill. Consult it for content collections, deployment, i18n, mermaid, etc.

## Required outcome

1. Implement the user's prompt on top of the scaffold.
2. Use Tailwind utility classes in \`.astro\` files directly. Keep \`global.css\` minimal (only \`@import "tailwindcss";\` plus genuinely global rules).
3. Prefer \`.astro\` components over client-side JS. Only hydrate (\`client:*\` directives) when truly interactive.
4. All text must pass \`astro check\` with zero errors.
5. All code must pass \`biome check src/\` with zero errors (auto-fix with \`npm run biome:fix\` when safe).
6. \`npm run build\` must succeed with no warnings that would break production.

## Your verification loop — run all three, fix until green

Before exiting, **you must** run every one of these and iterate until each returns 0:

\`\`\`bash
npm run astro:check
npm run biome:check
npm run build
\`\`\`

If an error appears, read it carefully, fix the root cause, and run the failing command again. Do not suppress errors with \`any\`, \`@ts-ignore\`, or biome \`// biome-ignore\` directives unless there is a genuinely unavoidable reason — and if you must, add a short comment explaining why.

Keep going until all three commands exit 0. Do not exit early claiming "the important parts work" — the verification loop is the definition of done.

## Scope discipline

- Do NOT install extra dependencies unless the user's prompt makes them necessary. No UI kits, no icon libraries, no analytics, no CMS. If the prompt asks for a feature that genuinely needs one (e.g. MDX, sitemap, RSS), install the official Astro integration.
- Do NOT create tests unless the user asked for them. This tool is for generating sites, not test suites.
- Do NOT touch files outside this project directory.
- Do NOT modify \`.claude/\` or \`biome.json\` or the Tailwind wiring.

## Commit

When everything is green, make a single \`git commit\` with a descriptive message summarising what you built.
`;
}
