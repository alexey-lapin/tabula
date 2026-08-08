#!/usr/bin/env node
// create-tabula — scaffolds a fresh Tabula start page.
//   npm init tabula <dir>   |   npm create tabula <dir>   |   npx create-tabula <dir>
import { cp, readFile, writeFile, rename, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const templateDir = join(here, 'template');

const targetArg = process.argv[2] ?? 'tabula-app';
const targetDir = resolve(process.cwd(), targetArg);
const name = basename(targetDir);

if (existsSync(targetDir) && (await readdir(targetDir)).length > 0) {
	console.error(`✖ Target directory "${targetArg}" already exists and is not empty.`);
	process.exit(1);
}

await mkdir(targetDir, { recursive: true });
await cp(templateDir, targetDir, { recursive: true });

// Restore the dotfile npm dropped at publish time.
const shippedGitignore = join(targetDir, 'gitignore');
if (existsSync(shippedGitignore)) {
	await rename(shippedGitignore, join(targetDir, '.gitignore'));
}

// Personalize the scaffolded project's manifest.
const pkgPath = join(targetDir, 'package.json');
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
pkg.name = name;
pkg.version = '0.0.1';
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log(`\n✔ Created ${name} at ${targetDir}\n`);
console.log('Next steps:');
console.log(`  cd ${targetArg}`);
console.log('  npm install');
console.log('  npm run dev\n');
