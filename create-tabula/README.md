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

## How it works

`npm init tabula` is rewritten by npm to `npx create-tabula`, which copies the
bundled `template/` into your target directory and personalizes `package.json`.

The `template/` directory is generated from the project at the repo root — run
`npm run sync` after changing the source project to refresh it (this also runs
automatically on `prepack` before publishing).
