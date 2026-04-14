import fs from 'node:fs';
import path from 'node:path';
import { log } from './logger.js';

export type DeployTarget = 'none' | 'cloudflare' | 'vercel' | 'netlify';

export const DEPLOY_TARGETS: { value: DeployTarget; label: string; hint?: string }[] = [
  { value: 'none', label: 'None', hint: "I'll wire up deployment later" },
  { value: 'cloudflare', label: 'Cloudflare Pages', hint: 'wrangler pages deploy' },
  { value: 'vercel', label: 'Vercel', hint: 'vercel deploy --prod' },
  { value: 'netlify', label: 'Netlify', hint: 'netlify deploy --prod' },
];

interface DeployConfig {
  devDeps: Record<string, string>;
  deployScript: string;
  platformFile: { path: string; contents: string };
  gitignoreExtras: string[];
}

const DEPLOY_CONFIGS: Record<
  Exclude<DeployTarget, 'none'>,
  (projectName: string) => DeployConfig
> = {
  cloudflare: (name) => ({
    devDeps: { wrangler: '^3.90.0' },
    deployScript: 'wrangler pages deploy dist',
    platformFile: {
      path: 'wrangler.toml',
      contents: `name = "${name}"
compatibility_date = "2024-11-01"
pages_build_output_dir = "dist"
`,
    },
    gitignoreExtras: ['.wrangler/'],
  }),
  vercel: () => ({
    devDeps: { vercel: '^37.0.0' },
    deployScript: 'vercel deploy --prod --yes',
    platformFile: {
      path: 'vercel.json',
      contents: `${JSON.stringify(
        {
          $schema: 'https://openapi.vercel.sh/vercel.json',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          framework: 'astro',
        },
        null,
        2,
      )}\n`,
    },
    gitignoreExtras: ['.vercel/'],
  }),
  netlify: () => ({
    devDeps: { 'netlify-cli': '^17.0.0' },
    deployScript: 'netlify deploy --prod --dir=dist',
    platformFile: {
      path: 'netlify.toml',
      contents: `[build]
  command = "npm run build"
  publish = "dist"
`,
    },
    gitignoreExtras: ['.netlify/'],
  }),
};

export function applyDeployConfig(projectDir: string, target: DeployTarget): void {
  if (target === 'none') return;

  const projectName = path.basename(projectDir);
  const config = DEPLOY_CONFIGS[target](projectName);

  log.step(`Wiring ${target} deployment`);

  // Platform file
  fs.writeFileSync(
    path.join(projectDir, config.platformFile.path),
    config.platformFile.contents,
    'utf-8',
  );

  // Update package.json: add devDeps + deploy script
  const pkgPath = path.join(projectDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  pkg.scripts = { ...pkg.scripts, deploy: config.deployScript };
  pkg.devDependencies = { ...pkg.devDependencies, ...config.devDeps };
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');

  // Append to .gitignore
  const gitignorePath = path.join(projectDir, '.gitignore');
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
  const missing = config.gitignoreExtras.filter((line) => !existing.includes(line));
  if (missing.length > 0) {
    const appended = `${existing.trimEnd()}\n${missing.join('\n')}\n`;
    fs.writeFileSync(gitignorePath, appended, 'utf-8');
  }
}
