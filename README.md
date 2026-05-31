# astro-mate

A focused CLI that generates **Astro v6 + Tailwind v4 + Biome** websites with Claude Code. One command per site.

The stack is locked and explicit so the agent can't guess-and-fail:

- Astro `^6.4.2`
- Tailwind CSS `^4.3.0` (wired via `@tailwindcss/vite` — not the deprecated `@astrojs/tailwind`)
- `@astrojs/sitemap` `^3.7.3` (pre-wired; emits `sitemap-index.xml`)
- Astro **Fonts API** with **Inter** (self-hosted; wired to Tailwind `--font-sans`/`--font-heading`)
- Biome `^2.4.16` (linter + formatter for `.ts` / `.js` / `.json` — no ESLint)
- Prettier `^3.8.3` + `prettier-plugin-astro` (formatter for `.astro` — Biome ignores those)
- TypeScript `^6.0.0` strict (`astro/tsconfigs/strict`)
- Svelte `^5.56.0` + `@astrojs/svelte` `^8.1.2` — designated interactivity framework, installed on demand
- `astro check` for `.astro` type-checking
- The [publishing-astro-websites skill](https://github.com/spillwavesolutions/publishing-astro-websites-agentic-skill) installed into `.claude/skills/`

## Install

Requires Node 20+, Git, and [Claude Code](https://docs.claude.com/en/docs/claude-code) on `$PATH`.

```bash
npm install
npm run build
npm link        # exposes the `astro-mate` command globally
```

## Use

Both commands operate on the **current directory** and collect everything **interactively**. `new` refuses to run unless the directory is empty — create a fresh folder and `cd` in first.

```bash
mkdir coffee-site && cd coffee-site
astro-mate new
# ▸ Pick a Claude model:
#   ● 1) Claude Sonnet 4.6   — balanced, fast
#     2) Claude Opus 4.6     — smartest, slowest, costliest
#     3) Claude Haiku 4.5    — cheap, best for small edits
#
# ▸ Pick a deployment target:
#   ● 1) None
#     2) Cloudflare Pages
#     3) Vercel
#     4) Netlify
#
# ▸ Describe the site you want to build:
#   > marketing site for a coffee roastery, 4 pages, dark mode toggle
#   > (blank line to finish)

# later, in the same directory:
astro-mate fix
# ▸ What change do you want?
```

`fix` remembers the model (and deploy target) that `new` picked by reading `.astro-mate.json`. Override per-run with flags:

```bash
astro-mate new --model opus --deploy cloudflare --site https://roastery.example "marketing site for a coffee roastery"
astro-mate fix --model haiku "tighten the hero copy"
```

### Options

| Flag | Default | What it does |
|---|---|---|
| `--model <id>` | interactive on `new`, persisted for `fix` | `sonnet`, `opus`, `haiku` (dynamic latest of each tier), or a full ID like `claude-opus-4-8` |
| `--deploy <target>` | interactive on `new` | `none`, `cloudflare`, `vercel`, `netlify` |
| `--site <url>` | interactive on `new` | Production URL used for canonical tags + sitemap. Skippable; persisted for `fix`. |
| `--max-retries <n>` | `3` | Outer retry budget when verification fails |
| `--timeout <seconds>` | `3600` | Per-attempt agent timeout |

### Deployment

When you pick a target other than `none`, astro-mate writes the platform config (`wrangler.toml` / `vercel.json` / `netlify.toml`), adds the platform CLI to devDeps, and adds an `npm run deploy` script. It does **not** run the deploy or handle authentication — that stays with the platform's own CLI.

```bash
# after astro-mate is done:
npm run deploy      # e.g. `wrangler pages deploy dist`
```

You'll need to authenticate with the platform once (`wrangler login`, `vercel login`, `netlify login`) before the first deploy.

### SEO & AI discoverability

Every scaffold ships an SEO baseline so generated sites are discoverable from day one:

- **`SEO.astro`** — a head component wired through `Layout.astro`: title, description, canonical URL, Open Graph, Twitter Card, and a JSON-LD slot. Pass `title` + `description` per page.
- **`@astrojs/sitemap`** — pre-installed; builds `sitemap-index.xml`.
- **`public/robots.txt`** — allows all crawlers (incl. GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended) and points at the sitemap.
- **Canonical + sitemap** need a real `site` URL — set it at `new` time (prompt or `--site`), or edit the `https://example.com` placeholder in `astro.config.mjs` later.

There is intentionally **no `llms.txt`**: as of 2026 the major AI crawlers skip it and read HTML directly. The agentic-SEO story here is structured data (JSON-LD) + an AI-friendly `robots.txt` + clean semantic HTML — the things AI search actually consumes.

### Fonts

The scaffold wires Astro's built-in **Fonts API** (no extra dependency; the font is fetched and self-hosted at build — no runtime Google request, no layout shift) with **Inter** as a build-safe default. Two Tailwind theme variables are exposed — `--font-sans` (body) and `--font-heading` (headings) — both pointing at Inter by default, so the untouched scaffold renders one unified font.

When you describe your site, the agent picks a Google Font (or a heading/body pairing) that fits its tone — a refined serif for a law firm, a geometric sans for a SaaS, and so on — by updating `astro.config.mjs`, `Layout.astro`, and `global.css`. Leaving Inter is always valid.

### Interactivity (Svelte)

Sites are static `.astro` by default. When a prompt genuinely needs client-side interactivity, **Svelte** is the designated framework: the agent installs `@astrojs/svelte` + `svelte` (pinned for compatibility), registers the integration, and hydrates with the narrowest `client:*` directive. No React/Vue/vanilla shims are added — and nothing Svelte ships unless interactivity is actually needed.

## What it does, step by step

1. **Scaffolds** a fresh Astro project into the current directory (empty required) with every config file pinned (`package.json`, `astro.config.mjs` — including sitemap + Fonts API wiring, `tsconfig.json`, `biome.json`, `.prettierrc.json`, `Layout.astro`, `SEO.astro`, `global.css`, `public/robots.txt`). If you picked a deploy target, the platform config and `npm run deploy` script are written too. Runs `npm install`, commits the scaffold.
2. **Installs** the publishing-astro-websites skill into `.claude/skills/` and writes a permissive `.claude/settings.json`. Saves your model + deploy choice to `.astro-mate.json` so `fix` can reuse them.
3. **Invokes Claude Code** in the project directory with an explicit prompt that declares the locked stack, points at the installed skill, and demands `astro check` + `biome check` + `prettier check` + `astro build` all pass.
4. **Verifies** by running those four commands itself after the agent exits.
5. **Retries** on verification failure — up to `--max-retries` times — feeding the previous error back to the agent.
6. **Fails honestly**. After the retry budget is spent, it prints the last failure and stops. No infinite loops, no silent "success".

## Scope

- One site per run, serial.
- Your prompt goes straight to the agent — no intake interview.
- Verification is hardcoded: `astro check`, `biome check`, `prettier check`, `astro build`.
- Claude Code only (for now).
- Builds sites, not test suites — no test scaffolding.

## Design notes

- **Explicit over clever.** Every dep, every config file is hand-rolled and pinned. The agent never has to guess "is it `@astrojs/tailwind` or `@tailwindcss/vite`?" — the scaffold has the answer already.
- **Honest failure beats eternal fixing.** The outer retry loop is capped. If Claude can't make it green in N tries, you see the real error and decide.

## Enhancement ideas

Things that have been discussed but not built. Not a roadmap — just a list to pick from when the time feels right.

- **Tighter retry context.** Feed only the failing verification step's tail back to the agent, not the full previous log. Cuts tokens and reduces distraction on retry.
- **Skill version pin.** Currently clones `main` of the publishing-astro-websites skill. Pinning to a commit or tag would make runs reproducible.
- **A/B variants as sibling dirs.** Generate N parallel variants in sibling directories (no shared git) for comparison. Different use case from the current single-project flow — would be its own subcommand, not a `new --parallel` flag.
- **SSR support.** Currently SSG-only. Adding SSR means picking an adapter at scaffold time (`@astrojs/cloudflare`, `@astrojs/vercel`, `@astrojs/node`) — the adapter choice would branch off the deploy-target selector that already exists.
- **Other coding agents.** Abstract the runner behind a preset table (command template, prompt delivery, default model) to support Codex / Gemini CLI / Qwen Code. Cheap on its own (~80 lines). The real tradeoff: the publishing-astro-websites skill is Claude-specific — other agents read `AGENTS.md` at the repo root instead. For non-Claude agents you'd either drop the skill (weaker Astro knowledge) or inline it into `AGENTS.md` (bloats every prompt). Aider is a different bucket — edit-focused, not agentic, so the "iterate until green" loop needs rework to fit it.
