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
- \`src/styles/global.css\` — contains \`@import "tailwindcss";\` plus Tailwind \`@theme\` font variables (\`--font-sans\`, \`--font-heading\`, both → Inter by default) and a base rule applying \`--font-heading\` to headings. This is the Tailwind v4 entry.
- \`src/layouts/Layout.astro\` — imports \`global.css\`. Add content to this layout; do not create a second global stylesheet.
- \`tsconfig.json\` — extends \`astro/tsconfigs/strict\`. Keep strict mode.
- \`biome.json\` — Biome is the only linter/formatter for \`.ts\` / \`.js\` / \`.json\`. \`.astro\` files are ignored by Biome.
- \`.prettierrc.json\` + \`.prettierignore\` — Prettier + \`prettier-plugin-astro\` is the only formatter for \`.astro\` files. Do not run Prettier against \`.ts\` / \`.js\` / \`.json\`; that is Biome's territory.
- \`astro.config.mjs\` — \`site\` is set and \`@astrojs/sitemap\` is already wired (emits \`sitemap-index.xml\` at build; do NOT add another sitemap integration). The Astro **Fonts API** is wired with **Inter** via \`fontProviders.google()\`, exposed as Tailwind \`--font-sans\`/\`--font-heading\`.
- \`src/components/SEO.astro\` — the head component (title, description, canonical, Open Graph, Twitter Card, JSON-LD). Pass \`title\` + \`description\` (and optionally \`image\`, \`type\`, \`noindex\`, \`jsonLd\`) through \`Layout.astro\` for every page.
- \`public/robots.txt\` — allows all crawlers incl. AI bots (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended) and points at the sitemap. Keep it valid if you edit it.
- \`.claude/skills/${SKILL_DIR_IN_REPO}/\` — the publishing-astro-websites skill. Consult it for content collections, deployment, i18n, mermaid, etc.

## Required outcome

1. Implement the user's prompt on top of the scaffold.
2. Use Tailwind utility classes in \`.astro\` files directly. Keep \`global.css\` minimal (only \`@import "tailwindcss";\` plus genuinely global rules).
3. Prefer \`.astro\` components over client-side JS. Only hydrate (\`client:*\` directives) when truly interactive.
4. All text must pass \`astro check\` with zero errors.
5. All \`.ts\` / \`.js\` / \`.json\` must pass \`biome check src/\` with zero errors (auto-fix with \`npm run biome:fix\` when safe).
6. All \`.astro\` files must pass \`prettier --check "**/*.astro"\` with zero errors (auto-fix with \`npm run prettier:fix\` when safe).
7. \`npm run build\` must succeed with no warnings that would break production.
8. Give every page a meaningful \`title\` and \`description\` via \`Layout\`. Add page-appropriate JSON-LD (\`jsonLd\` prop) where it fits the content (e.g. Article, Product, Organization). Use semantic HTML (\`<header>\`, \`<main>\`, \`<article>\`, one \`<h1>\` per page).
9. **Fonts:** the scaffold ships Inter via the Astro Fonts API. Choose a Google Font whose character fits the site's nature/tone (e.g. a refined serif for a law firm, a geometric sans for a SaaS, a rounded humanist sans for a playful brand). To change it, update the \`fonts\` entry \`name\` + \`cssVariable\` in \`astro.config.mjs\`, the \`<Font cssVariable=...>\` in \`Layout.astro\`, and the \`--font-sans\` mapping in \`src/styles/global.css\`. For distinct heading/body fonts, add a second \`fonts\` entry, render a second \`<Font/>\`, and point \`--font-heading\` at it. Leaving Inter is valid.
10. **Interactivity (only if the prompt needs it):** Svelte is the designated framework. Prefer static \`.astro\`; when genuine client-side interactivity is required, install \`@astrojs/svelte\` + \`svelte\` (the versions are pinned — use the latest compatible), register \`svelte()\` in \`astro.config.mjs\`, write the component in \`.svelte\`, and hydrate with the narrowest \`client:*\` directive that works. Do NOT use React, Vue, Solid, or vanilla framework shims. New \`.svelte\` files must still pass all four verification commands (Biome 2 lints/formats \`.svelte\`).

## Your verification loop — run all four, fix until green

Before exiting, **you must** run every one of these and iterate until each returns 0:

\`\`\`bash
npm run astro:check
npm run biome:check
npm run prettier:check
npm run build
\`\`\`

If an error appears, read it carefully, fix the root cause, and run the failing command again. Do not suppress errors with \`any\`, \`@ts-ignore\`, or biome \`// biome-ignore\` directives unless there is a genuinely unavoidable reason — and if you must, add a short comment explaining why.

Keep going until all four commands exit 0. Do not exit early claiming "the important parts work" — the verification loop is the definition of done.

## Scope discipline

- Do NOT install extra dependencies unless the user's prompt makes them necessary. No UI kits, no icon libraries, no analytics, no CMS. If the prompt asks for a feature that genuinely needs one (e.g. MDX, RSS), install the official Astro integration. The sitemap integration is already installed — do not add another. For interactivity, use Svelte (see Required outcome) — not React/Vue.
- Do NOT create tests unless the user asked for them. This tool is for generating sites, not test suites.
- Do NOT touch files outside this project directory.
- Do NOT modify \`.claude/\` or \`biome.json\` or \`.prettierrc.json\` or the Tailwind wiring.

## Commit

When everything is green, make a single \`git commit\` with a descriptive message summarising what you built.
`;
}
