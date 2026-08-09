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

### Variants

A link can fan out into several destinations — the same service across `dev`,
`uat`, and `prd`, say. The label then becomes plain text and each variant
renders as a colored monospace chip, which keeps a whole matrix of environments
in one compact card.

Define variants once under `variantDefs`, then select them by name with
`variants`:

```yaml
variantDefs:
  dev: { color: "#60c4a2", vars: { env: dev,  branch: develop } }
  prd: { color: "#ff6b6b", vars: { env: prod, branch: main } }

categories:
  - name: "Swagger UI"
    accent: "#5da8ff"
    variants: [dev, prd]      # every link in this card shows both chips
    links:
      - label: "Orders API"
        url: "https://orders.{{env}}.example.com/swagger-ui"
      - label: "Billing API"
        url: "https://billing.{{env}}.example.com/swagger-ui"
        variants: [dev]       # this link shows only dev
```

`variantDefs` always defines; `variants` always selects:

| Where           | Key           | Meaning                                          |
| :-------------- | :------------ | :----------------------------------------------- |
| root            | `variantDefs` | Declare variants available everywhere             |
| card            | `variantDefs` | Redefine them locally, merged over the inherited  |
| card            | `variants`    | Which chips its links show; nested cards inherit  |
| link            | `variants`    | Which chips this link shows; replaces the card's  |

- Card definitions merge field by field, so you can override just a color or a
  single var and keep the rest.
- Each variant's `vars` are merged over the card's `vars` before `{{token}}`
  substitution, and a variant may carry its own `url` to opt out of the
  template entirely. Selecting an undefined name fails the build.
- Chips without an explicit `color` fall back to the card's `accent`.
- `variants: []` opts a single link out of a variant card — it renders as an
  ordinary clickable row using its own `url`.

Built with [Astro](https://astro.build).
