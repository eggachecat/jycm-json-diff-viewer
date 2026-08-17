# JYCM Semantic JSON Diff Playground

The browser demo and reference application for
[JYCM](https://github.com/eggachecat/jycm),
[jycm-js](https://github.com/eggachecat/jycm-js), and
[react-jycm-viewer](https://github.com/eggachecat/react-jycm-viewer).

**Live:** https://eggachecat.github.io/jycm-json-diff-viewer/

JYCM compares JSON using business semantics rather than raw text alone. The
playground lets developers edit two JSON documents and a versioned business
policy or a live JavaScript decision function, then inspect the explanation,
executable JSON Patch, machine-readable events, and Git-style visual diff.

## What the demo shows

- four editable real-world scenarios, including a custom-JavaScript lab
- all eight declarative business rules: ignore, unordered, match-by identity,
  numeric tolerance, string normalization, expected change, expected existence,
  and numeric range
- named rule outcomes, affected paths, event counts, and business-level metrics
- semantic RFC 6902 generation with optional safety tests
- standalone Patch exploration with operation filters, pointer search, copy,
  download, apply preview, and semantic verification
- a first-class line diff with guaranteed red removals, green additions,
  line numbers, context folding, and full-document expansion
- collapsible Before, After, policy, JavaScript, and raw-event editors
- path-level JavaScript functions whose boolean or structured decisions change
  semantic equality, explanations, and generated Patch output immediately
- optional aligned before/after navigation for advanced paired-path inspection
- live validation that keeps the latest valid comparison visible while editing
- Codex, Claude, and project-agent installation commands for the portable
  JYCM Business Diff Skill

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

## Publish GitHub Pages

GitHub Pages serves `docs/` from the `gh-pages` branch. Build `main`, copy the
contents of `dist/` into that branch's `docs/` directory, commit, and push.
Wait for the Pages build to report `built` before considering a release
complete.

## JavaScript business functions

The playground accepts a function expression or arrow function. It receives
`path`, `pointer`, `left`, `right`, `leftExists`, and `rightExists`. Return
`true` to treat a path as semantically equal, `false` to require a change, a
structured `{ equal, reason, severity }` decision for explanation output, or
`undefined` to defer to the declarative policy and normal diff engine.

The function runs in the current browser tab. Only execute code you trust.

## Project roles

- `jycm` is the Python semantic diff engine and CLI.
- `jycm-js` computes the same style of diff in browsers and Node.js.
- `react-jycm-viewer` renders JYCM paths and operations with Monaco.
- this repository is the interactive integration demo and public landing page.

## License

MIT
