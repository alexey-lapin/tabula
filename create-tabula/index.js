#!/usr/bin/env node
// create-tabula — scaffolds a fresh Tabula start page, and upgrades one in place.
//   npm init tabula <dir>   |   npm create tabula <dir>   |   npx create-tabula <dir>
//   npx create-tabula@latest upgrade [dir]
import { cp, readFile, writeFile, rename, readdir, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename, join, relative, sep } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const templateDir = join(here, 'template');
const selfVersion = JSON.parse(await readFile(join(here, 'package.json'), 'utf8')).version;

// Files the scaffolded project owns outright — an upgrade must never touch them.
const PRESERVED = new Set(['package.json', 'gitignore', '.gitignore']);
// Directories under src/ that stay yours: your links, and any routes you add.
const PRESERVED_SRC_DIRS = new Set(['data', 'pages']);

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith('--')));
const positional = args.filter((arg) => !arg.startsWith('--'));

if (flags.has('--help')) {
	usage();
	process.exit(0);
}

if (positional[0] === 'upgrade') {
	await upgrade(positional[1] ?? '.', {
		dryRun: flags.has('--dry-run'),
		force: flags.has('--force'),
	});
} else {
	await create(positional[0] ?? 'tabula-app');
}

function usage() {
	console.log(`
create-tabula ${selfVersion}

  create-tabula [dir]              Scaffold a new start page (default: tabula-app)
  create-tabula upgrade [dir]      Update an existing one to this version (default: .)

Options for upgrade:
  --dry-run                        Show what would change, write nothing
  --force                          Skip the git safety checks
`);
}

async function create(targetArg) {
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

	// Personalize the scaffolded project's manifest. The `tabula` field records
	// which version the files came from, so `upgrade` can report from → to.
	const pkgPath = join(targetDir, 'package.json');
	const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
	pkg.name = name;
	pkg.version = '0.0.1';
	pkg.tabula = selfVersion;
	await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

	console.log(`\n✔ Created ${name} at ${targetDir}\n`);
	console.log('Next steps:');
	console.log(`  cd ${targetArg}`);
	console.log('  npm install');
	console.log('  npm run dev\n');
}

async function upgrade(targetArg, { dryRun, force }) {
	const targetDir = resolve(process.cwd(), targetArg);

	if (!looksLikeTabula(targetDir)) {
		console.error(`✖ "${targetArg}" does not look like a Tabula project.`);
		console.error('  Expected package.json, src/data/links.yaml, and src/components/.');
		process.exit(1);
	}

	if (!force && !dryRun) {
		const state = gitState(targetDir);
		if (state === 'none') {
			console.error('✖ Not a git repository — an upgrade would overwrite files with no way to');
			console.error('  review or undo it. Commit to git first, or re-run with --force.');
			process.exit(1);
		}
		if (state === 'dirty') {
			console.error('✖ Working tree has uncommitted changes. Commit or stash them so the');
			console.error('  upgrade is reviewable with `git diff`, or re-run with --force.');
			process.exit(1);
		}
	}

	const pkgPath = join(targetDir, 'package.json');
	const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
	const from = pkg.tabula ?? 'unknown';

	const replaceDirs = (await readdir(join(templateDir, 'src'), { withFileTypes: true }))
		.filter((entry) => entry.isDirectory() && !PRESERVED_SRC_DIRS.has(entry.name))
		.map((entry) => join('src', entry.name));

	const overwriteFiles = (await listFiles(templateDir)).filter(
		(file) =>
			!PRESERVED.has(file) &&
			!file.startsWith(`src${sep}data${sep}`) &&
			!replaceDirs.some((dir) => file.startsWith(dir + sep)),
	);

	console.log(`\n  Tabula upgrade  ${from} → ${selfVersion}   ${targetArg}\n`);

	for (const dir of replaceDirs) {
		const incoming = await listFiles(join(templateDir, dir));
		const existing = existsSync(join(targetDir, dir)) ? await listFiles(join(targetDir, dir)) : [];
		const dropped = existing.filter((file) => !incoming.includes(file));

		if (!dryRun) {
			await rm(join(targetDir, dir), { recursive: true, force: true });
			await cp(join(templateDir, dir), join(targetDir, dir), { recursive: true });
		}

		row('✔', `${dir}/`, `${incoming.length} file${incoming.length === 1 ? '' : 's'}`);
		for (const file of dropped) {
			row('-', join(dir, file), 'removed (no longer in Tabula)');
		}
	}

	for (const file of overwriteFiles) {
		const isNew = !existsSync(join(targetDir, file));
		if (!dryRun) {
			await cp(join(templateDir, file), join(targetDir, file));
		}
		row(isNew ? '+' : '✔', file, isNew ? 'new' : '');
	}

	row('─', 'src/data/links.yaml', 'kept (yours)');

	const changes = await mergeManifest(pkgPath, pkg, dryRun);
	if (changes.length === 0) {
		row('─', 'package.json', 'no dependency changes');
	}
	for (const change of changes) {
		row('↑', 'package.json', change);
	}

	if (dryRun) {
		console.log('\n  Dry run — nothing was written.\n');
		return;
	}
	console.log('\n  Review with `git diff`, then run `npm install`.\n');
}

/**
 * Takes the template's dependencies and scripts while preserving the project's
 * own name, version, and any fields it added. Returns a human-readable list of
 * dependency changes.
 */
async function mergeManifest(pkgPath, pkg, dryRun) {
	const tpl = JSON.parse(await readFile(join(templateDir, 'package.json'), 'utf8'));
	const changes = [];

	for (const field of ['dependencies', 'devDependencies']) {
		for (const [name, range] of Object.entries(tpl[field] ?? {})) {
			const current = pkg[field]?.[name];
			if (current !== range) {
				changes.push(current ? `${name} ${current} → ${range}` : `${name} ${range} (added)`);
			}
		}
	}

	const next = {
		...pkg,
		type: tpl.type ?? pkg.type,
		scripts: { ...pkg.scripts, ...tpl.scripts },
		dependencies: { ...pkg.dependencies, ...tpl.dependencies },
		devDependencies: { ...pkg.devDependencies, ...tpl.devDependencies },
		tabula: selfVersion,
	};

	if (!dryRun) {
		await writeFile(pkgPath, JSON.stringify(next, null, 2) + '\n');
	}
	return changes;
}

/** One aligned report line: `  ✔ src/types.ts        new` */
function row(mark, label, note) {
	console.log((`  ${mark} ${label}`.padEnd(30) + (note ? ` ${note}` : '')).trimEnd());
}

function looksLikeTabula(dir) {
	return (
		existsSync(join(dir, 'package.json')) &&
		existsSync(join(dir, 'src', 'data', 'links.yaml')) &&
		existsSync(join(dir, 'src', 'components'))
	);
}

function gitState(dir) {
	try {
		execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
			cwd: dir,
			stdio: ['ignore', 'ignore', 'ignore'],
		});
	} catch {
		return 'none';
	}
	try {
		const out = execFileSync('git', ['status', '--porcelain'], {
			cwd: dir,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		});
		return out.trim() ? 'dirty' : 'clean';
	} catch {
		return 'none';
	}
}

async function listFiles(dir, base = dir) {
	const out = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...(await listFiles(full, base)));
		else out.push(relative(base, full));
	}
	return out;
}
