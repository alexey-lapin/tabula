#!/usr/bin/env node
// Copies the real Tabula project files from the repo root into ./template so
// they ship bundled inside the published create-tabula package. Runs on demand
// (`npm run sync`) and automatically before publish (`prepack`).
import { cp, rm, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..'); // create-tabula/
const repoRoot = resolve(pkgRoot, '..'); // repo root — the template project itself
const templateDir = join(pkgRoot, 'template');

// Files/dirs that make up a fresh Tabula project.
const include = ['src', 'astro.config.mjs', 'tsconfig.json', 'package.json'];

// npm refuses to publish a file literally named `.gitignore`, so it is shipped
// as `gitignore` and renamed back to `.gitignore` when the project is scaffolded.
const gitignore =
	['node_modules/', 'dist/', '.astro/', '.DS_Store', '*.log', '.env', '.env.*'].join('\n') + '\n';

await rm(templateDir, { recursive: true, force: true });
await mkdir(templateDir, { recursive: true });

for (const entry of include) {
	await cp(join(repoRoot, entry), join(templateDir, entry), { recursive: true });
}
await writeFile(join(templateDir, 'gitignore'), gitignore);

console.log(`✔ Synced template (${include.join(', ')}) from repo root`);
