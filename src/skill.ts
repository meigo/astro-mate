import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { log } from './logger.js';
import { SKILL_DIR_IN_REPO, SKILL_REPO } from './stack.js';

export interface SkillInstallResult {
  ok: boolean;
  reason?: string;
}

export function installAstroSkill(targetDir: string): SkillInstallResult {
  const targetSkill = path.join(targetDir, '.claude', 'skills', SKILL_DIR_IN_REPO);
  if (fs.existsSync(targetSkill) && fs.readdirSync(targetSkill).length > 0) {
    log.info('Astro skill already present, skipping install');
    return { ok: true };
  }

  log.step('Installing Astro Claude Code skill');

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-mate-skill-'));
  try {
    const clone = spawnSync('git', ['clone', '--depth=1', '--quiet', SKILL_REPO, tmpRoot], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120_000,
    });
    if (clone.status !== 0) {
      const stderr = clone.stderr?.toString() ?? '';
      return { ok: false, reason: `git clone failed: ${stderr.trim() || clone.status}` };
    }

    const src = path.join(tmpRoot, SKILL_DIR_IN_REPO);
    if (!fs.existsSync(src)) {
      return { ok: false, reason: `skill dir "${SKILL_DIR_IN_REPO}" not found in cloned repo` };
    }

    fs.mkdirSync(path.dirname(targetSkill), { recursive: true });
    fs.cpSync(src, targetSkill, { recursive: true });

    ensureClaudeSettings(targetDir);

    log.ok(`Installed skill at .claude/skills/${SKILL_DIR_IN_REPO}`);
    return { ok: true };
  } finally {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

function ensureClaudeSettings(targetDir: string): void {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) return;
  const settings = {
    permissions: {
      allow: [
        'Read(./**)',
        'Write(./**)',
        'Edit(./**)',
        'Bash(npm:*)',
        'Bash(npx:*)',
        'Bash(biome:*)',
        'Bash(prettier:*)',
        'Bash(astro:*)',
        'Bash(git:*)',
      ],
    },
  };
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf-8');
}
