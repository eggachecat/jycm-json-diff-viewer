# JYCM Semantic JSON Diff Playground

The browser demo and reference application for
[JYCM](https://github.com/eggachecat/jycm),
[jycm-js](https://github.com/eggachecat/jycm-js), and
[react-jycm-viewer](https://github.com/eggachecat/react-jycm-viewer).

**Live:** https://eggachecat.github.io/jycm-json-diff-viewer/

JYCM compares JSON using business semantics rather than raw text alone. The
playground lets developers edit two JSON documents and a rule configuration,
then inspect both the machine-readable operations and a synchronized visual
diff.

## What the demo shows

- path-specific order-insensitive arrays
- list item matching by a business identity field
- custom operation metadata and structured diff output
- aligned before/after navigation for moved values
- live validation that keeps the latest valid comparison visible while editing

Typical use cases include API regression testing, configuration review, audit
logs, approval workflows, catalog changes, and any nested JSON comparison where
generated fields or collection ordering would make a text diff noisy.

## Run locally

```bash
pnpm install
pnpm start
```

## Validate a production build

```bash
pnpm run check
```

The check runs lint, tests, and the optimized webpack build used by GitHub
Pages.

## Project roles

- `jycm` is the Python semantic diff engine and CLI.
- `jycm-js` computes the same style of diff in browsers and Node.js.
- `react-jycm-viewer` renders JYCM paths and operations with Monaco.
- this repository is the interactive integration demo and public landing page.

## License

MIT
