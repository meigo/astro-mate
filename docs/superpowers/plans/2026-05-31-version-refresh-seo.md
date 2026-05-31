# astro-mate v0.2 — Version Refresh + SEO/Agentic Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh every pinned dependency to current latest (incl. Biome 1→2 and TypeScript 5→6 majors) and bake an opinionated, non-speculative SEO + agentic-discoverability baseline into the scaffolded output.

**Architecture:** `astro-mate` is a TypeScript CLI (`src/*.ts`, built with `tsc` to `dist/`) that writes a fixed set of files into an empty directory, runs `npm install`, then drives Claude Code. Changes are concentrated in the version table (`stack.ts`), the file-emitting scaffold (`scaffold.ts`), the deploy config (`deploy.ts`), and the interactive flow (`dialog.ts` / `index.ts` / `project-config.ts`). A new single-purpose `SEO.astro` component and `public/robots.txt` are emitted by the scaffold.

**Tech Stack:** Node 20+, TypeScript 6, Biome 2 (lint/format the tool's own `.ts`), and — in generated projects — Astro 6.4, Tailwind 4.3, `@astrojs/sitemap` 3.7, Prettier 3.8 + prettier-plugin-astro for `.astro`.

**Testing note:** This repo has no unit-test framework and deliberately avoids one. Verification for every task is the project's real gate: `npm run build` (tsc), `npm run check` (Biome), and a final **agent-free scaffold-then-build smoke test**. Do not add a test framework.

**Spec:** `docs/superpowers/specs/2026-05-31-version-refresh-seo-design.md`

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `package.json` | modify | Tool's own deps (Part D): Biome 2, TS 6, @types/node 24, tsx |
| `biome.json` (root) | modify | Bump `$schema` to v2 |
| `src/stack.ts` | modify | Version table, stack summary, model aliases |
| `src/deploy.ts` | modify | Deploy CLI versions + Cloudflare compat date |
| `src/scaffold.ts` | modify | Emit refreshed configs + SEO files; thread `site` |
| `src/dialog.ts` | modify | Add `askText()` single-line prompt |
| `src/project-config.ts` | modify | Persist `site` |
| `src/index.ts` | modify | Site-URL prompt + `--site` flag wiring |
| `src/prompt.ts` | modify | Agent guidance for SEO baseline |
| `README.md` | modify | Document versions, `--site`, SEO, model aliases |

No new files are added to *this* repo. New files (`SEO.astro`, `public/robots.txt`) are emitted by the scaffold into generated projects.

---

## Task 1: Part D — bump the tool's own dependencies

**Files:**
- Modify: `package.json:11-18` (dependencies/devDependencies)
- Modify: `biome.json:2` (root, `$schema`)

- [ ] **Step 1: Bump devDependencies in `package.json`**

Replace the `devDependencies` block:

```json
  "devDependencies": {
    "@biomejs/biome": "^2.4.16",
    "@types/node": "^24.0.0",
    "tsx": "^4.22.3",
    "typescript": "^6.0.0"
  },
```

- [ ] **Step 2: Bump the root `biome.json` schema to v2**

The root config has no `files.ignore` to migrate — only the schema URL changes. Replace line 2:

```json
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
```

- [ ] **Step 3: Reinstall and rebuild under the new majors**

Run: `npm install && npm run build`
Expected: install succeeds; `tsc` exits 0 (TypeScript 6 compiles the existing `src/` — `tsconfig.json` uses ES2022/bundler which TS 6 supports).

- [ ] **Step 4: Verify Biome 2 lints the tool's own source clean**

Run: `npm run check`
Expected: `biome check src/` exits 0. If Biome 2 reports new lint findings, fix them minimally (do not disable rules wholesale). If it reports a config-schema error, run `npx biome migrate --write` and re-run.

- [ ] **Step 5: Commit**

```bash
git add package.json biome.json package-lock.json
git commit -m "Bump tool deps to Biome 2 + TypeScript 6"
```

---

## Task 2: Refresh the scaffolded version table and model menu (`stack.ts`)

**Files:**
- Modify: `src/stack.ts:1-32`

- [ ] **Step 1: Replace the `STACK` constant**

```ts
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
```

- [ ] **Step 2: Add the sitemap line to `STACK_SUMMARY`**

Replace the `STACK_SUMMARY` array so the agent knows the sitemap is pre-wired:

```ts
export const STACK_SUMMARY = [
  `Astro ${STACK.astro}`,
  `Tailwind CSS ${STACK.tailwind} (via @tailwindcss/vite plugin)`,
  `@astrojs/sitemap ${STACK.sitemap} (already wired; emits sitemap-index.xml at build)`,
  `Biome ${STACK.biome} (lint + format for .ts/.js/.json)`,
  `Prettier ${STACK.prettier} + prettier-plugin-astro ${STACK.prettierPluginAstro} (format for .astro)`,
  `TypeScript ${STACK.typescript} (strict)`,
  '`astro check` for type-checking .astro files',
].join(', ');
```

- [ ] **Step 3: Replace `MODEL_OPTIONS` with dynamic tier aliases**

```ts
export const MODEL_OPTIONS: { value: string; label: string; hint?: string }[] = [
  { value: 'sonnet', label: 'Claude Sonnet (latest)', hint: 'balanced, fast — currently 4.6' },
  { value: 'opus', label: 'Claude Opus (latest)', hint: 'smartest, costliest — currently 4.8' },
  { value: 'haiku', label: 'Claude Haiku (latest)', hint: 'cheap, small edits — currently 4.5' },
];
```

- [ ] **Step 4: Build + check**

Run: `npm run build && npm run check`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/stack.ts
git commit -m "Refresh scaffold version table; switch model menu to dynamic tier aliases"
```

---

## Task 3: Refresh deploy CLI versions (`deploy.ts`)

**Files:**
- Modify: `src/deploy.ts:25-36` (cloudflare), `:37-54` (vercel), `:55-66` (netlify)

- [ ] **Step 1: Bump wrangler + Cloudflare compat date**

In the `cloudflare` config, replace the `devDeps` and `compatibility_date`:

```ts
    devDeps: { wrangler: '^4.95.0' },
```

and in the `wrangler.toml` contents, change the compatibility date line to:

```
compatibility_date = "2026-05-01"
```

- [ ] **Step 2: Bump vercel**

In the `vercel` config, replace `devDeps`:

```ts
    devDeps: { vercel: '^54.6.1' },
```

- [ ] **Step 3: Bump netlify-cli**

In the `netlify` config, replace `devDeps`:

```ts
    devDeps: { 'netlify-cli': '^26.0.2' },
```

- [ ] **Step 4: Build + check**

Run: `npm run build && npm run check`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/deploy.ts
git commit -m "Bump deploy CLI versions (wrangler 4, vercel 54, netlify-cli 26)"
```

---

## Task 4: Scaffold configs — package.json deps, Biome v2, astro.config, robots.txt, site threading (`scaffold.ts`)

**Files:**
- Modify: `src/scaffold.ts:8-10` (ScaffoldOptions), `:67-88` (writeFiles), `:90-125` (packageJson), `:127-137` (astroConfig), `:155-171` (biomeConfig)

- [ ] **Step 1: Add `site` to `ScaffoldOptions`**

Replace the interface (lines 8-10):

```ts
export interface ScaffoldOptions {
  deployTarget?: DeployTarget;
  site?: string;
}
```

- [ ] **Step 2: Thread `site` through `writeFiles` and add the new files**

In `scaffold()`, change the `writeFiles(dir);` call (line 38) to:

```ts
  writeFiles(dir, opts.site);
```

Then replace the `writeFiles` signature and `files` map. The function now resolves the site (blank → placeholder) and emits `astro.config.mjs`, `public/robots.txt`, and `src/components/SEO.astro`:

```ts
function writeFiles(dir: string, site?: string): void {
  const resolvedSite = site?.trim() || 'https://example.com';
  const isPlaceholder = !site?.trim();

  const files: Record<string, string> = {
    'package.json': packageJson(path.basename(dir)),
    'astro.config.mjs': astroConfig(resolvedSite, isPlaceholder),
    'tsconfig.json': tsconfig(),
    'biome.json': biomeConfig(),
    '.prettierrc.json': prettierConfig(),
    '.prettierignore': prettierIgnore(),
    '.gitignore': gitignore(),
    'src/pages/index.astro': indexPage(),
    'src/layouts/Layout.astro': layout(),
    'src/components/SEO.astro': seoComponent(),
    'src/styles/global.css': globalCss(),
    'public/favicon.svg': favicon(),
    'public/robots.txt': robotsTxt(resolvedSite),
    'README.md': `# ${path.basename(dir)}\n\nGenerated by astro-mate. Stack: Astro ${STACK.astro}, Tailwind ${STACK.tailwind}, @astrojs/sitemap, Biome (\`.ts\`/\`.js\`/\`.json\`), Prettier + prettier-plugin-astro (\`.astro\`), TypeScript strict.\n\n## Dev\n\n\`\`\`bash\nnpm run dev        # dev server\nnpm run build      # production build\nnpm run check      # astro check + biome check + prettier check\n\`\`\`\n`,
  };

  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
}
```

- [ ] **Step 3: Add `@astrojs/sitemap` to generated dependencies**

In `packageJson()`, replace the `dependencies` block:

```ts
      dependencies: {
        astro: STACK.astro,
        tailwindcss: STACK.tailwind,
        '@tailwindcss/vite': STACK.tailwind,
        '@astrojs/sitemap': STACK.sitemap,
      },
```

- [ ] **Step 4: Update `astroConfig()` to take site + add the sitemap integration**

Replace the whole `astroConfig` function:

```ts
function astroConfig(site: string, isPlaceholder: boolean): string {
  const todo = isPlaceholder ? '  // TODO: set your production URL\n' : '';
  return `import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
${todo}  site: '${site}',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
`;
}
```

- [ ] **Step 5: Migrate `biomeConfig()` to the Biome v2 schema**

Replace the whole `biomeConfig` function. `files.ignore` becomes `files.includes` with `!`-negation globs; `*.astro` stays excluded so Prettier owns it:

```ts
function biomeConfig(): string {
  return `${JSON.stringify(
    {
      $schema: 'https://biomejs.dev/schemas/2.4.16/schema.json',
      vcs: { enabled: true, clientKind: 'git', useIgnoreFile: true },
      files: {
        ignoreUnknown: true,
        includes: ['**', '!**/dist', '!**/.astro', '!**/node_modules', '!**/*.astro'],
      },
      formatter: { enabled: true, indentStyle: 'space', indentWidth: 2, lineWidth: 100 },
      linter: { enabled: true, rules: { recommended: true } },
      javascript: { formatter: { quoteStyle: 'single', semicolons: 'always' } },
    },
    null,
    2,
  )}\n`;
}
```

- [ ] **Step 6: Add the `robotsTxt()` emitter**

Add this function near the other emitters (e.g. after `gitignore()`):

```ts
function robotsTxt(site: string): string {
  return `User-agent: *
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

Sitemap: ${site}/sitemap-index.xml
`;
}
```

- [ ] **Step 7: Build + check (the `seoComponent`/`layout`/`indexPage` changes land in Task 5; this step only checks the TS compiles)**

Run: `npm run build && npm run check`
Expected: `tsc` will FAIL here with "Cannot find name 'seoComponent'" because Step 2 references it. That is expected — proceed to Task 5 which adds it, then build. (If you prefer a green checkpoint, do Task 5 Step 1 before building.)

> Note: Tasks 4 and 5 are committed together because Step 2 references `seoComponent()` defined in Task 5. Do not commit between them.

---

## Task 5: Scaffold SEO component + layout + index page (`scaffold.ts`)

**Files:**
- Modify: `src/scaffold.ts` — add `seoComponent()`, replace `layout()` (`:225-250`), replace `indexPage()` (`:252-267`)

- [ ] **Step 1: Add the `seoComponent()` emitter**

Add this function (e.g. before `layout()`). Note the `Astro.site` guard — it is typed `URL | undefined`, so we fall back to a local `URL` to keep `astro check` strict-clean:

```ts
function seoComponent(): string {
  return `---
interface Props {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const {
  title,
  description,
  image,
  canonical,
  type = 'website',
  noindex = false,
  jsonLd,
} = Astro.props;

const siteURL = Astro.site ?? new URL('https://example.com');
const canonicalURL = canonical ?? new URL(Astro.url.pathname, siteURL).href;
const imageURL = image ? new URL(image, siteURL).href : undefined;
---

<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />
{noindex && <meta name="robots" content="noindex, nofollow" />}

<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content={type} />
<meta property="og:url" content={canonicalURL} />
{imageURL && <meta property="og:image" content={imageURL} />}

<meta name="twitter:card" content={imageURL ? 'summary_large_image' : 'summary'} />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
{imageURL && <meta name="twitter:image" content={imageURL} />}

{
  jsonLd && (
    <script type="application/ld+json" is:inline set:html={JSON.stringify(jsonLd)} />
  )
}
`;
}
```

- [ ] **Step 2: Replace `layout()` to render `<SEO/>` and ship a default WebSite JSON-LD**

```ts
function layout(): string {
  return `---
import '../styles/global.css';
import SEO from '../components/SEO.astro';

interface Props {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const { title, description, image, canonical, type, noindex, jsonLd } = Astro.props;

const siteURL = Astro.site ?? new URL('https://example.com');
const defaultJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: title,
  url: siteURL.href,
};
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="generator" content={Astro.generator} />
    <SEO
      title={title}
      description={description}
      image={image}
      canonical={canonical}
      type={type}
      noindex={noindex}
      jsonLd={jsonLd ?? defaultJsonLd}
    />
  </head>
  <body class="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
    <slot />
  </body>
</html>
`;
}
```

- [ ] **Step 3: Replace `indexPage()` to pass a real title + description**

```ts
function indexPage(): string {
  return `---
import Layout from '../layouts/Layout.astro';
---

<Layout
  title="Hello from astro-mate"
  description="A starter site scaffolded by astro-mate — Astro, Tailwind, and a built-in SEO baseline."
>
  <main class="mx-auto max-w-2xl px-6 py-24">
    <h1 class="text-4xl font-bold tracking-tight">Hello from astro-mate</h1>
    <p class="mt-4 text-lg text-slate-600 dark:text-slate-400">
      Edit <code class="rounded bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-800">src/pages/index.astro</code>
      to begin.
    </p>
  </main>
</Layout>
`;
}
```

- [ ] **Step 4: Build + check**

Run: `npm run build && npm run check`
Expected: both exit 0 (the `seoComponent` reference from Task 4 now resolves).

- [ ] **Step 5: Commit Tasks 4 + 5 together**

```bash
git add src/scaffold.ts
git commit -m "Bake SEO baseline into scaffold (SEO.astro, sitemap, robots.txt) and migrate biome.json to v2"
```

---

## Task 6: Site-URL capture — prompt, flag, persistence (`dialog.ts`, `project-config.ts`, `index.ts`, `scaffold.ts` call site)

**Files:**
- Modify: `src/dialog.ts` (add `askText`)
- Modify: `src/project-config.ts:7-10` (add `site`)
- Modify: `src/index.ts:41-48` (ParsedArgs), `:50-91` (parseArgs), `:119-166` (cmdNew)

- [ ] **Step 1: Add `askText()` to `dialog.ts`**

Append this single-line prompt helper (mirrors the readline style already used):

```ts
export function askText(label: string, hint?: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log(chalk.cyan('▸'), chalk.bold(label));
    if (hint) console.log(chalk.dim(`  ${hint}`));
    rl.question(chalk.dim('  > '), (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}
```

- [ ] **Step 2: Add `site` to `ProjectConfig`**

Replace the interface in `project-config.ts`:

```ts
export interface ProjectConfig {
  model: string;
  deployTarget: DeployTarget;
  site?: string;
}
```

- [ ] **Step 3: Add `site` to `ParsedArgs` and parse the `--site` flag**

In `index.ts`, add `site?: string;` to the `ParsedArgs` interface (after `deploy?`). Then in `parseArgs`, add to the returned object:

```ts
    site: flags.site && flags.site !== 'true' ? flags.site : undefined,
```

- [ ] **Step 4: Prompt for the production URL in `cmdNew` and thread it into the scaffold**

In `cmdNew`, import `askText` (add to the existing `./dialog.js` import). After the `deployTarget` selection and before collecting the prompt, add:

```ts
  const site =
    args.site ??
    (await askText(
      'Production URL (for canonical + sitemap):',
      'Optional — press Enter to skip. e.g. https://example.com',
    ));
```

Change the scaffold call to pass it:

```ts
  const scaffoldResult = scaffold(outDir, { deployTarget, site });
```

Change the config write to persist it:

```ts
  writeProjectConfig(outDir, { model, deployTarget, site: site || undefined });
```

- [ ] **Step 5: Add `--site` to the USAGE help text**

In the `USAGE` template `Options:` block, add a line under `--deploy`:

```
  --site <url>            Production URL for canonical + sitemap (skips the prompt)
```

- [ ] **Step 6: Build + check**

Run: `npm run build && npm run check`
Expected: both exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/dialog.ts src/project-config.ts src/index.ts
git commit -m "Capture optional production URL via prompt + --site flag, persisted"
```

---

## Task 7: Update the agent prompt (`prompt.ts`)

**Files:**
- Modify: `src/prompt.ts:28-37` (files-in-place list), `:41-47` (required outcome), `:66` (scope line)

- [ ] **Step 1: Add the SEO files to the "Files in place" list**

In `buildPrompt`, add these bullets to the files list (after the `.prettierrc.json` bullet):

```ts
- \`astro.config.mjs\` — \`site\` is set and \`@astrojs/sitemap\` is already wired. A sitemap (\`sitemap-index.xml\`) is emitted at build; do not install another sitemap integration.
- \`src/components/SEO.astro\` — the head component. Pass \`title\` + \`description\` (and optionally \`image\`, \`type\`, \`noindex\`, \`jsonLd\`) through \`Layout.astro\` for every page.
- \`public/robots.txt\` — allows all crawlers incl. AI bots and points at the sitemap. Keep it valid if you edit it.
```

- [ ] **Step 2: Add an SEO requirement to "Required outcome"**

Add as a new numbered item in the Required outcome list:

```ts
8. Give every page a meaningful \`title\` and \`description\` via \`Layout\`. Add page-appropriate JSON-LD (\`jsonLd\` prop) where it fits the content (e.g. Article, Product, Organization). Use semantic HTML (\`<header>\`, \`<main>\`, \`<article>\`, one \`<h1>\` per page).
```

- [ ] **Step 3: Drop the stale "install sitemap yourself" guidance**

In the scope-discipline bullet that lists `MDX, sitemap, RSS`, remove `sitemap` (it is now pre-installed). Change that bullet to read:

```ts
- Do NOT install extra dependencies unless the user's prompt makes them necessary. No UI kits, no icon libraries, no analytics, no CMS. If the prompt asks for a feature that genuinely needs one (e.g. MDX, RSS), install the official Astro integration. The sitemap integration is already installed — do not add another.
```

- [ ] **Step 4: Build + check**

Run: `npm run build && npm run check`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/prompt.ts
git commit -m "Tell the agent about the SEO baseline; drop stale sitemap guidance"
```

---

## Task 8: Update the README (`README.md`)

**Files:**
- Modify: `README.md` — version list (`:7-13`), model table row (`:63`), deployment section, and a new SEO section

- [ ] **Step 1: Refresh the stack version list**

Replace the bullet list at the top (lines 7-13) with current versions and the sitemap entry:

```markdown
- Astro `^6.4.2`
- Tailwind CSS `^4.3.0` (wired via `@tailwindcss/vite` — not the deprecated `@astrojs/tailwind`)
- `@astrojs/sitemap` `^3.7.3` (pre-wired; emits `sitemap-index.xml`)
- Biome `^2.4.16` (linter + formatter for `.ts` / `.js` / `.json` — no ESLint)
- Prettier `^3.8.3` + `prettier-plugin-astro` (formatter for `.astro` — Biome ignores those)
- TypeScript `^6.0.0` strict (`astro/tsconfigs/strict`)
- `astro check` for `.astro` type-checking
- The [publishing-astro-websites skill](https://github.com/spillwavesolutions/publishing-astro-websites-agentic-skill) installed into `.claude/skills/`
```

- [ ] **Step 2: Update the model flag row and examples**

In the Options table, replace the `--model` row:

```markdown
| `--model <id>` | interactive on `new`, persisted for `fix` | `sonnet`, `opus`, `haiku` (dynamic latest of each tier), or a full ID like `claude-opus-4-8` |
```

Update the two example commands that reference `--model`:

```bash
astro-mate new --model opus --deploy cloudflare --site https://roastery.example "marketing site for a coffee roastery"
astro-mate fix --model haiku "tighten the hero copy"
```

- [ ] **Step 3: Add the `--site` flag row**

Add to the Options table, after the `--deploy` row:

```markdown
| `--site <url>` | interactive on `new` | Production URL used for canonical tags + sitemap. Skippable; persisted for `fix`. |
```

- [ ] **Step 4: Add an SEO section**

Add a new `### SEO & AI discoverability` section after the Deployment section:

```markdown
### SEO & AI discoverability

Every scaffold ships an SEO baseline so generated sites are discoverable from day one:

- **`SEO.astro`** — a head component wired through `Layout.astro`: title, description, canonical URL, Open Graph, Twitter Card, and a JSON-LD slot. Pass `title` + `description` per page.
- **`@astrojs/sitemap`** — pre-installed; builds `sitemap-index.xml`.
- **`public/robots.txt`** — allows all crawlers (incl. GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended) and points at the sitemap.
- **Canonical + sitemap** need a real `site` URL — set it at `new` time (prompt or `--site`), or edit the `https://example.com` placeholder in `astro.config.mjs` later.

There is intentionally **no `llms.txt`**: as of 2026 the major AI crawlers skip it and read HTML directly. The agentic-SEO story here is structured data (JSON-LD) + an AI-friendly `robots.txt` + clean semantic HTML — the things AI search actually consumes.
```

- [ ] **Step 5: Update the "What it does, step by step" file list**

In step 1 of that section, add `SEO.astro`, `public/robots.txt`, and the sitemap wiring to the parenthetical list of pinned files.

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "Document v0.2: versions, --site, SEO baseline, dynamic model aliases"
```

---

## Task 9: Agent-free scaffold smoke test (definition of done)

This exercises every risky change — Biome 2 schema, TS 6, the sitemap integration, `SEO.astro`, the placeholder `site` — without invoking Claude.

**Files:** none modified (uses a throwaway temp directory; nothing committed)

- [ ] **Step 1: Ensure the tool is built**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 2: Scaffold into a temp dir using the built `scaffold()` directly**

Run (from the repo root):

```bash
SMOKE_DIR="$(mktemp -d)/site"
node --input-type=module -e "import { scaffold } from '$(pwd)/dist/scaffold.js'; const r = scaffold(process.argv[1], { site: 'https://smoke.example' }); if (!r.ok) { console.error(r.error); process.exit(1); }" "$SMOKE_DIR"
echo "SMOKE_DIR=$SMOKE_DIR"
```

Expected: scaffold runs `npm install` + git init and prints "Scaffold complete". (`scaffold()` performs install and commit itself.)

- [ ] **Step 3: Run the generated project's own checks**

Run:

```bash
cd "$SMOKE_DIR" && npm run check && npm run build
```

Expected: `astro check` (0 errors), `biome check src/` (0 errors), `prettier --check "**/*.astro"` (0 errors), and `astro build` all pass.

- [ ] **Step 4: Confirm SEO artifacts were emitted**

Run:

```bash
test -f "$SMOKE_DIR/dist/sitemap-index.xml" && echo "sitemap OK"
grep -q "smoke.example" "$SMOKE_DIR/dist/robots.txt" 2>/dev/null || grep -q "smoke.example" "$SMOKE_DIR/public/robots.txt" && echo "robots OK"
grep -rq 'application/ld+json' "$SMOKE_DIR/dist" && echo "json-ld OK"
grep -rq 'rel="canonical"' "$SMOKE_DIR/dist" && echo "canonical OK"
```

Expected: `sitemap OK`, `robots OK`, `json-ld OK`, `canonical OK`.

- [ ] **Step 5: Clean up**

Run: `cd - && rm -rf "$(dirname "$SMOKE_DIR")"`
Expected: temp dir removed. Nothing to commit.

- [ ] **Step 6: If any check failed**

Investigate against the spec's risk list: TS 6 × strict tsconfig (fall back to `typescript: '^5.x'` in `stack.ts` only if 6.0 genuinely breaks the build), exact Biome v2 `files.includes` globs, prettier-plugin-astro × prettier 3.8 compat. Fix in the relevant task's file, rebuild, and re-run this smoke test.

---

## Addendum A — Fonts (Astro 6 Fonts API) + Svelte (on-demand)

Added after Tasks 4-5 were committed (new user requirements). Executed as Tasks
10-11 below; Tasks 7 (prompt.ts), 8 (README), and 9 (smoke test) are extended to
cover them.

### Task 10: Wire the Astro Fonts API into the scaffold (`scaffold.ts`)

**Files:** Modify `src/scaffold.ts` — `astroConfig()`, `layout()`, `globalCss()`.

- [ ] **Step 1:** In `astroConfig()`, import `fontProviders` and add a top-level `fonts` array. The function becomes:

```ts
function astroConfig(site: string, isPlaceholder: boolean): string {
  const todo = isPlaceholder ? '  // TODO: set your production URL\n' : '';
  return `import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
${todo}  site: '${site}',
  integrations: [sitemap()],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
`;
}
```

- [ ] **Step 2:** In `layout()`, import the `Font` component and render it in `<head>`, and add `font-sans` to the `<body>` class. Update the frontmatter import line and the head/body. The frontmatter top becomes:

```
import '../styles/global.css';
import SEO from '../components/SEO.astro';
import { Font } from 'astro:assets';
```

Add `<Font cssVariable="--font-inter" />` inside `<head>` (e.g. right after `<meta name="generator" ... />`, before `<SEO ... />`). Change the body open tag to:

```
  <body class="min-h-screen bg-white font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
```

- [ ] **Step 3:** Replace `globalCss()` to define both font roles and a heading base rule:

```ts
function globalCss(): string {
  return `@import "tailwindcss";

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-heading);
  }
}
`;
}
```

- [ ] **Step 4:** `npm run build && npm run check` — both exit 0. (The generated `.astro`/CSS are validated in Task 9's smoke test, which now also builds the font.)

- [ ] **Step 5:** Commit:

```bash
git add src/scaffold.ts
git commit -m "Wire Astro Fonts API (Inter) into scaffold with heading/body roles"
```

### Task 11: Pin Svelte versions for on-demand use (`stack.ts`)

**Files:** Modify `src/stack.ts` — `STACK` + `STACK_SUMMARY`.

- [ ] **Step 1:** Add two keys to `STACK`:

```ts
  svelte: '^5.56.0',
  astrojsSvelte: '^8.1.2',
```

(insert after `astroCheck: '^0.9.9',`)

- [ ] **Step 2:** Add a line to `STACK_SUMMARY` (after the `astro check` line):

```ts
  `Svelte ${STACK.svelte} + @astrojs/svelte ${STACK.astrojsSvelte} (on-demand: install only when client-side interactivity is needed)`,
```

- [ ] **Step 3:** `npm run build && npm run check` — both exit 0.

- [ ] **Step 4:** Commit:

```bash
git add src/stack.ts
git commit -m "Pin Svelte + @astrojs/svelte for on-demand interactivity"
```

### Task 7 extension (prompt.ts) — also add:

- A **Fonts** note: `astro.config.mjs` ships the Astro Fonts API with Inter wired to Tailwind `--font-sans`/`--font-heading`. Instruct the agent to **auto-select a Google Font (or a heading/body pairing) fitting the site's nature/tone**, updating the `fonts` array (+ a second `<Font/>` and `--font-heading` if pairing) — and that leaving Inter is valid.
- A **Svelte** note: for genuine client-side interactivity, install `@astrojs/svelte` + `svelte` at the pinned versions, register `svelte()`, use `.svelte` with the narrowest `client:*`, and keep all four verification commands green (Biome 2 lints/formats `.svelte`). No React/Vue/vanilla shims.

### Task 8 extension (README) — also document the Fonts API baseline (Inter default, agent auto-selects, heading/body roles) and the Svelte on-demand policy.

### Task 9 extension (smoke test) — after build, also assert the font emitted:
`grep -rq 'font-inter\|@font-face' "$SMOKE_DIR/dist" && echo "fonts OK"` and confirm self-hosted font files exist under `dist/_astro/` (Astro Fonts API output).

## Self-Review

- **Spec coverage:** Versions (Tasks 1-4) ✓; Biome v2 migration, scaffold + root (Tasks 1, 4) ✓; SEO component/layout/index/astro.config/robots/sitemap dep (Tasks 4-5) ✓; agentic SEO = JSON-LD + robots, no llms.txt (Tasks 4-5) ✓; site capture prompt/flag/persist/placeholder (Task 6) ✓; model aliases (Task 2) ✓; prompt.ts guidance (Task 7) ✓; README (Task 8) ✓; agent-free smoke verification (Task 9) ✓.
- **Placeholder scan:** No TBD/TODO-in-plan; the only literal `TODO` is intentional generated content in `astro.config.mjs`.
- **Type consistency:** `seoComponent()` referenced in Task 4 Step 2 is defined in Task 5 Step 1 (commit deferred — noted). `ScaffoldOptions.site`, `ProjectConfig.site`, and `ParsedArgs.site` all use `site?: string`. `askText(label, hint?)` signature matches its Task 6 call. `SEO.astro` `Props` and `Layout.astro` `Props` use identical field names/types.
