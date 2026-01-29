# Tabula

A calm, beautiful start page for your browser. Quick access to categorized shortcuts for the places you visit most.

## Project Structure

```text
/
├── src/
│   ├── components/     # UI components
│   ├── data/
│   │   └── links.yaml  # Configure your links and categories here
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

## Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

## Customization

Edit `src/data/links.yaml` to add your own categories and links. Each category supports:

- `name` - Category title
- `cols` - Grid width (4, 6, 8, or 12)
- `accent` - Accent color (hex code)
- `description` - Short description
- `links` - Array of links with label, url, and description

Built with [Astro](https://astro.build).
