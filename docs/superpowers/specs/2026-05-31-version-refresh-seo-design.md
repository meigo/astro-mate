# astro-mate v0.2 — Version Refresh + SEO/Agentic Baseline

**Date:** 2026-05-31
**Status:** Approved design, pending spec review

## Problem

`astro-mate` scaffolds Astro + Tailwind sites for a Claude Code agent to flesh out.
Two gaps:

1. **Stale versions.** The locked stack pins Astro `^6.0.0`, Biome `^1.9.4`,
   TypeScript `^5.7.0`, and deploy CLIs (wrangler `^3`, vercel `^37`,
   netlify-cli `^17`) that are one or more majors behind current releases.
2. **No SEO baseline.** The generated site has no `site` URL, no sitemap, no
   `robots.txt`, no canonical/Open Graph/Twitter/JSON-LD head metadata, and no
   AI-crawler guidance. Every generated site starts SEO-blind and relies on the
   agent to remember to add these per prompt.

This change refreshes the locked versions and bakes an opinionated,
non-speculative SEO + agentic-discoverability baseline directly into the
scaffold, while preserving the project's "explicit, locked, no guesswork" ethos.

## Goals

- Bump every pinned dependency (scaffolded **and** the tool's own) to current
  latest, including the Biome 1→2 and TypeScript 5→6 majors.
- Bake in a full SEO baseline: `site` config, `@astrojs/sitemap`,
  `public/robots.txt`, and a reusable `SEO.astro` head component.
- Make "agentic SEO" concrete and honest: JSON-LD structured data + an
  AI-crawler-friendly `robots.txt` + semantic HTML. **No `llms.txt`.**
- Capture a production URL (canonical/sitemap need it) via an optional prompt.
- Replace pinned model IDs with dynamic per-tier aliases.

## Non-Goals

- `llms.txt` / `llms-full.txt`. Research (May 2026): major AI crawlers
  (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended)
  overwhelmingly skip the file and read HTML directly; no major AI vendor
  commits to consuming it. Baking it in would be speculative cruft, against the
  project ethos.
- Generating a real Open Graph raster image. The scaffold cannot honestly
  produce one; `og:image` stays optional and is documented for the agent.
- SSR/adapters, A/B variants, non-Claude agents (existing enhancement-idea
  backlog, untouched).

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| SEO depth | **Full baseline** baked into scaffold |
| Agentic SEO | **JSON-LD + AI-friendly robots.txt + semantic HTML**, no `llms.txt` |
| Biome | **Bump to 2.x, keep Prettier** for `.astro` (Biome `.astro` support still experimental) |
| Site URL | **New interactive prompt** + `--site` flag, persisted |
| Model menu | **Tier aliases** (`opus`/`sonnet`/`haiku`), labels show current versions |
| Tool's own deps | **Bump too** (Part D included) |
| Fonts | **Astro 6 Fonts API**, self-hosted, wired to Tailwind `--font-sans`. Scaffold default **Inter** (build-safe); the **agent auto-selects** a fitting Google Font per the site's nature |
| Svelte | **On-demand** (pinned in `stack.ts`, agent installs only when interactivity is needed) |

## Version Targets

Verified against the npm registry on 2026-05-31. Caret ranges kept; floors raised.

### Scaffolded stack (`src/stack.ts`)

| dep | from | to | note |
|---|---|---|---|
| astro | `^6.0.0` | `^6.4.2` | floor bump |
| tailwindcss | `^4.0.0` | `^4.3.0` | |
| @tailwindcss/vite | `^4.0.0` | `^4.3.0` | |
| @biomejs/biome | `^1.9.4` | `^2.4.16` | **major** — biome.json v2 schema |
| typescript | `^5.7.0` | `^6.0.0` | **major** — verify strict tsconfig + Biome compat |
| prettier | `^3.3.0` | `^3.8.3` | |
| prettier-plugin-astro | `^0.14.0` | `^0.14.1` | |
| @astrojs/check | `^0.9.0` | `^0.9.9` | |
| **@astrojs/sitemap** | — | `^3.7.3` | **new dependency** |
| **svelte** | — | `^5.56.0` | **new pin** — on-demand only (not installed by scaffold) |
| **@astrojs/svelte** | — | `^8.1.2` | **new pin** — on-demand only; peer deps `astro ^6`, `ts ^5.3.3 \|\| ^6` ✓ |

Fonts add **no npm dependency** — the Astro 6 Fonts API ships in `astro` itself and
fetches/self-hosts the Google font at build time.

### Deploy CLIs (`src/deploy.ts`)

| dep | from | to |
|---|---|---|
| wrangler | `^3.90.0` | `^4.95.0` |
| vercel | `^37.0.0` | `^54.6.1` |
| netlify-cli | `^17.0.0` | `^26.0.2` |

Cloudflare `compatibility_date` bumped to a current date (`2026-05-01`).

### The tool's own deps (`package.json`) — Part D

| dep | from | to |
|---|---|---|
| @biomejs/biome | `^1.9.4` | `^2.4.16` |
| typescript | `^5.7.0` | `^6.0.0` |
| @types/node | `^22.0.0` | `^24.0.0` (LTS-aligned; latest is 25.9.1) |
| tsx | `^4.19.0` | `^4.22.3` |

`@types/node` is aligned to the Node 24 LTS line rather than the absolute
latest (25.x), to stay consistent with the `engines: node >=20` floor.

The root `biome.json` is migrated to the v2 schema alongside.

## Biome 2 Migration

Both the scaffold's generated `biome.json` and (Part D) the root `biome.json`
move to the v2 schema. Exact v2 key names confirmed via Biome docs / `biome
migrate` during implementation rather than guessed. Known v2 changes to apply:

- `$schema` → `https://biomejs.dev/schemas/2.4.16/schema.json`
- `files.ignore` (v1) → v2 `files.includes` with `!`-negation globs
- Keep `*.astro` excluded — Prettier + prettier-plugin-astro still owns `.astro`
- Keep `vcs` block and `recommended` lint rules

## SEO Baseline (generated files)

### `src/components/SEO.astro` (new — single purpose)

Props:

```ts
interface Props {
  title: string;              // required
  description: string;        // required
  image?: string;             // OG image URL; omitted if absent
  canonical?: string;         // default: new URL(Astro.url.pathname, Astro.site)
  type?: 'website' | 'article'; // default 'website'
  noindex?: boolean;          // default false
  jsonLd?: object | object[]; // rendered as application/ld+json
}
```

Renders into `<head>`: `<title>`, `<meta name="description">`, canonical
`<link>`, Open Graph tags (`og:title`/`og:description`/`og:url`/`og:type`/
`og:site_name`, `og:image` only when `image` is set), Twitter Card tags,
`<meta name="robots" content="noindex">` when `noindex`, and a JSON-LD
`<script type="application/ld+json">` when `jsonLd` is provided.

Canonical computation requires `Astro.site` to be set (the `site` config + the
placeholder fallback guarantee it is non-empty).

### `src/layouts/Layout.astro` (changed)

- Accepts the same SEO props, passes them to `<SEO {...} />` in `<head>`.
- Keeps `lang`, viewport, favicon, `Astro.generator`.
- Ships a default `WebSite` JSON-LD graph (name + url) when the page does not
  supply its own.

### `src/pages/index.astro` (changed)

Passes a concrete `title` and `description` instead of only a title.

### `astro.config.mjs` (changed)

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com', // ← from prompt/--site, or this placeholder w/ TODO
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

### `public/robots.txt` (new)

```
User-agent: *
Allow: /

# AI crawlers explicitly welcomed
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: https://example.com/sitemap-index.xml
```

The `Sitemap:` host is the resolved `site` value.

### `package.json` (generated, changed)

Adds `@astrojs/sitemap` to `dependencies`.

## Site-URL Capture

- `src/dialog.ts`: add `askText(label, opts?: { placeholder?: string })` — a
  single-line readline prompt returning a trimmed string (`''` if skipped).
- `src/index.ts` `cmdNew`: after the deploy-target select, prompt
  **"Production URL (canonical + sitemap; optional, Enter to skip)"**. A
  `--site <url>` flag overrides/skips the prompt.
- `src/project-config.ts`: add `site?: string` to `ProjectConfig`; persist in
  `.astro-mate.json`; `fix` reuses it (no re-prompt).
- `src/scaffold.ts`: thread the resolved `site` into `astroConfig()`,
  `robots.txt`, and the SEO canonical base. Blank → `https://example.com`
  placeholder with a `// TODO: set your production URL` comment in
  `astro.config.mjs`.

## Model Menu (dynamic latest)

`src/stack.ts` `MODEL_OPTIONS` values become tier aliases; labels carry the
current concrete version as a hint:

```ts
[
  { value: 'sonnet', label: 'Claude Sonnet (latest)', hint: 'balanced, fast — currently 4.6' },
  { value: 'opus',   label: 'Claude Opus (latest)',   hint: 'smartest, costliest — currently 4.8' },
  { value: 'haiku',  label: 'Claude Haiku (latest)',  hint: 'cheap, small edits — currently 4.5' },
]
```

- Default stays **Sonnet** (index 0).
- `runner.ts` is unchanged — it already passes `--model <value>` verbatim, and
  `claude --model` resolves `opus`/`sonnet`/`haiku` to the newest model in each
  tier. A full ID (e.g. `--model claude-opus-4-8`) still works.
- `.astro-mate.json` stores the alias; `fix` reuses it.

## Fonts (Astro 6 Fonts API)

The scaffold wires the built-in Astro 6 Fonts API (no extra npm dependency; the
font is fetched and self-hosted at build — no runtime request to Google, no
layout shift). It defines **two font roles** — body and heading — so a
heading/body pairing is first-class. Both default to **Inter** (unified,
build-safe).

- `astro.config.mjs` — adds a top-level `fonts` array and imports
  `fontProviders` from `astro/config`. The default ships a single Inter entry
  (one download) used for both roles:

  ```js
  import { defineConfig, fontProviders } from 'astro/config';
  // ...
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
    },
  ],
  ```

- `Layout.astro` — `import { Font } from 'astro:assets';` and render
  `<Font cssVariable="--font-inter" />` in `<head>`; `<body>` carries the
  `font-sans` class.
- `global.css` — define two Tailwind theme variables (creating `font-sans` and
  `font-heading` utilities), both pointing at the Inter variable by default, and
  apply the heading variable to `h1`–`h6` via a base rule:

  ```css
  @import "tailwindcss";

  @theme {
    --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
    --font-heading: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  }

  @layer base {
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
    }
  }
  ```

**Single font vs heading/body pairing.** Because both roles default to the same
Inter variable, the untouched scaffold renders one unified font. To use distinct
heading and body fonts, the agent points `--font-heading` at a second font: add
a second entry to the `fonts` array (e.g. a display font with its own
`cssVariable`), render a second `<Font/>` in `Layout.astro`, and change
`--font-heading` in `global.css` to reference it.

**Auto-selection by the agent.** The scaffold default (Inter, single font)
guarantees a green build untouched. The site's *nature* is only known once the
agent reads the user's prompt, so font personalization happens at the agent
step: `prompt.ts` instructs the agent to choose a Google Font (or a heading/body
pairing) whose character fits the site's tone/brand (e.g. a refined serif for a
law firm, a geometric sans for a SaaS, a rounded humanist sans for a playful
brand) and update the wired spots (`fonts` entries + `cssVariable`s in
`astro.config.mjs`, the `<Font/>` tag(s) in `Layout.astro`, and the
`--font-sans` / `--font-heading` mappings in `global.css`). If the agent leaves
it, Inter ships for both roles — always valid.

## Svelte (on-demand)

Svelte is the **designated** framework for genuine client-side interactivity,
but it is **not pre-installed** (most generated sites are static SSG; shipping
unused deps violates the project ethos). `stack.ts` pins the versions for
explicitness (`svelte ^5.56.0`, `@astrojs/svelte ^8.1.2` — peers
`astro ^6`, `ts ^5.3.3 || ^6` ✓). `prompt.ts` tells the agent: when a prompt
genuinely needs interactivity, install `@astrojs/svelte` + `svelte` at the
pinned versions, register `svelte()` in `astro.config.mjs`, build the component
in `.svelte`, and hydrate with the narrowest `client:*` directive that works —
and keep all four verification commands green. Note that neither Biome
(`.ts`/`.js`/`.json`) nor Prettier (`.astro`) is configured to cover `.svelte`,
so the agent must keep that code clean and well-formatted itself. Do **not**
reach for React, Vue, Solid, or vanilla framework shims.

## Accessibility (prompt-guidance approach)

A live-generated site triggered a "Background and foreground colors do not have a
sufficient contrast ratio" warning. None of the four static checks can catch
this — contrast is only defined against computed styles in a rendered DOM, so a
browser-based audit (axe/Lighthouse) would be required to *enforce* it. Adding
that to the iterate-until-green loop was rejected: full Lighthouse pulls in
headless Chrome (heavy), its performance scores are non-deterministic (flaky
gate), and it needs the site served. Decision: address it at the **prompt** layer
instead — `prompt.ts` Required-outcome item 11 mandates WCAG 2.1 AA contrast
(≥4.5:1 normal text, ≥3:1 large text), explicitly warns about the muted Tailwind
shade pairings that fail (`text-*-400/500` on light backgrounds), and requires
landmarks, single `<h1>`, `alt` text, accessible names, and visible focus. An
opt-in axe-core audit (reporting-only, outside the gate) remains a possible
future enhancement if enforcement is later wanted.

## Headless Agent Robustness (found during live end-to-end run)

The first live `astro-mate new` exposed two issues unrelated to the version/SEO
work but fatal to real use:

1. **The inner agent was hijacked by the environment.** astro-mate spawns
   `claude -p`, which inherits the user's global config — including a superpowers
   SessionStart hook whose brainstorming skill hard-gates code-writing behind
   user approval. In non-interactive `-p` mode the agent offered a visual
   companion and then stalled, writing **zero** code. `--bare` would disable the
   hook but also strips authentication, so it is unusable.
   **Fix:** `runner.ts` passes `--append-system-prompt` with a directive stating
   this is an automated, non-interactive build with no human to approve a design,
   so any approval-gated workflow does not apply — implement directly. Verified:
   the agent then builds normally with auth + the publishing-astro-websites
   skill intact.

2. **The verify loop reported false success.** A pristine scaffold passes all
   four checks (`astro check` / `biome check` / `prettier check` / `astro
   build`), so "green" alone could not distinguish a real build from an agent
   that wrote nothing — astro-mate reported "Site built successfully" on an
   untouched scaffold.
   **Fix:** a new `git-state.ts` helper plus a guard in `index.ts` `runLoop`.
   Before the loop, snapshot `git rev-parse HEAD`. After a green verification,
   require `projectChangedSince(cwd, baseline)` — HEAD moved or the tree is dirty
   — before declaring success. If nothing changed, treat it as a failure (feed a
   clear message back to the agent and retry). When git is unavailable the guard
   is skipped (cannot prove inaction, so does not block).

## Prose Updates

- `src/prompt.ts`: tell the agent about `SEO.astro`, the `site` config,
  `robots.txt`, and the sitemap; instruct it to pass a meaningful
  `title`/`description` per page and add page-appropriate JSON-LD. Remove the
  "install the sitemap integration yourself" guidance (now baked in). Keep the
  Tailwind-v4-wiring and Biome-vs-Prettier territory rules (update the Biome
  version reference).
- `README.md`: new versions, `--site` flag + Production URL prompt, the SEO /
  agentic-SEO section, dynamic model aliases. Update the model-flag examples.

## Definition of Done — Verification

Cheap, agent-free verification that exercises every risky change:

1. `npm run build` of astro-mate itself succeeds (tsc) under TS 6 + Biome 2.
2. `npm run check` (biome) of astro-mate's own `src/` passes under Biome 2.
3. Scaffold into a temp dir **without invoking Claude**, then in that dir:
   `npm install && npm run check && npm run build`. All four generated-project
   checks — `astro check`, `biome check`, `prettier --check`, `astro build` —
   must exit 0. This validates the Biome 2 schema, TS 6, the sitemap
   integration, the `SEO.astro` component, and the placeholder `site` all
   actually compile and build, with `dist/sitemap-index.xml` produced.

## Risks / To Verify During Implementation

- **TS 6 × `astro/tsconfigs/strict`** — confirm Astro 6.4 ships a TS-6-compatible
  strict tsconfig; fall back to `^5.x` only if 6.0 breaks the build.
- **Exact Biome 2 config keys** — confirm via Biome docs / `biome migrate`.
- **prettier-plugin-astro 0.14.1 × prettier 3.8.3** compatibility.
- **`@astrojs/sitemap` requires non-empty `site`** — the placeholder guarantees
  this; verify the build emits the sitemap with the placeholder.

## Files Touched

Generated-output path: `src/stack.ts`, `src/scaffold.ts`, `src/deploy.ts`,
`src/prompt.ts`, `src/dialog.ts`, `src/index.ts`, `src/project-config.ts`,
`README.md`.
Part D: `package.json`, root `biome.json`.
New generated files (emitted by scaffold, not in this repo): `SEO.astro`,
`public/robots.txt`.
