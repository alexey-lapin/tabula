# create-tabula

Scaffold a new [Tabula](https://github.com/alexey-lapin/tabula) start page.

```bash
npm init tabula my-start-page
# or
npm create tabula my-start-page
# or
npx create-tabula my-start-page
```

Then:

```bash
cd my-start-page
npm install
npm run dev
```

## Upgrading

A scaffolded project is a copy of Tabula, not a dependency on it, so new Tabula
features arrive through an explicit upgrade:

```bash
cd my-start-page
npx create-tabula@latest upgrade
```

Use `@latest` — the upgrade applies the template bundled in the package npx just
downloaded, so a stale npx cache would "upgrade" you to what you already have.
The version being applied is printed, along with the version you came from
(recorded as `tabula` in your `package.json`).

Your `src/data/links.yaml` is never touched. Everything else Tabula ships is
replaced: `src/components/` and `src/layouts/` wholesale, so renamed files don't
linger, while `src/pages/index.astro`, `src/types.ts`, `src/variants.ts`,
`astro.config.mjs`, and `tsconfig.json` are overwritten individually —
`src/pages/` is left otherwise intact so your own routes survive. `package.json` keeps your name and version while taking
Tabula's dependencies and scripts, so run `npm install` afterwards.

Because the replacement is wholesale, a component of your own inside
`src/components/` will be deleted (and reported). The upgrade therefore refuses
to run on a dirty working tree, or outside a git repository at all, so the
result is always reviewable with `git diff` and revertable:

```bash
npx create-tabula@latest upgrade --dry-run   # preview, write nothing
npx create-tabula@latest upgrade --force     # skip the git checks
npx create-tabula@latest upgrade ../my-dash  # target another directory
```

## How it works

`npm init tabula` is rewritten by npm to `npx create-tabula`, which copies the
bundled `template/` into your target directory and personalizes `package.json`.

The `template/` directory is generated from the project at the repo root — run
`npm run sync` after changing the source project to refresh it (this also runs
automatically on `prepack` before publishing).

`upgrade` copies from that same bundled `template/`, which is why this package's
version doubles as the Tabula version stamped into scaffolded projects.

Tabula and create-tabula are therefore released in lockstep — set both
`package.json` versions to the same number when publishing. `npm run sync`
(and so `prepack`) fails on drift, so a mismatch can't reach npm.
