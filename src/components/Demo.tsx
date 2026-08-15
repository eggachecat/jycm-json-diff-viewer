import * as React from "react";

const SemanticDiffWorkspace = React.lazy(
  () => import("./semantic-diff-workspace"),
);

function Demo() {
  return (
    <main className="site-shell">
      <header className="hero">
        <nav className="topbar" aria-label="Project navigation">
          <a className="brand" href="#top" aria-label="JYCM home">
            <span className="brand-mark">J</span>
            <span>JYCM</span>
          </a>
          <div className="nav-links">
            <a
              href="https://github.com/eggachecat/jycm"
              target="_blank"
              rel="noreferrer"
            >
              Python
            </a>
            <a
              href="https://github.com/eggachecat/jycm-js"
              target="_blank"
              rel="noreferrer"
            >
              JavaScript
            </a>
            <a
              className="github-link"
              href="https://github.com/eggachecat/jycm-json-diff-viewer"
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub ↗
            </a>
          </div>
        </nav>

        <section className="hero-copy" id="top">
          <div>
            <p className="eyebrow">Semantic JSON diff playground</p>
            <h1>Compare JSON by what your business actually means.</h1>
            <p className="hero-description">
              Match array items by identity, ignore order only where it is safe,
              and plug in domain-specific comparison rules. JYCM keeps noisy
              structural changes out of the way so the important change is
              obvious.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#playground">
                Try the playground
              </a>
              <a
                className="secondary-action"
                href="https://github.com/eggachecat/jycm#custom-operator"
                target="_blank"
                rel="noreferrer"
              >
                Read custom operator docs
              </a>
            </div>
          </div>
          <div className="feature-grid" aria-label="JYCM capabilities">
            <article>
              <span>01</span>
              <strong>Domain-aware</strong>
              <p>
                Define equality, tolerance, identity, and ignored fields per
                path.
              </p>
            </article>
            <article>
              <span>02</span>
              <strong>Actionable</strong>
              <p>
                Inspect machine-readable operations and synchronized visual
                detail.
              </p>
            </article>
            <article>
              <span>03</span>
              <strong>Portable</strong>
              <p>Use the same model from Python, JavaScript, CLI, or React.</p>
            </article>
          </div>
        </section>
      </header>

      <div id="playground">
        <React.Suspense fallback={<WorkspaceFallback />}>
          <SemanticDiffWorkspace />
        </React.Suspense>
      </div>

      <section className="use-cases" aria-labelledby="use-cases-title">
        <p className="eyebrow">Built for real change review</p>
        <h2 id="use-cases-title">One diff engine, many business workflows.</h2>
        <div className="use-case-grid">
          <article>
            <strong>API regression</strong>
            <p>
              Separate breaking payload changes from generated IDs and reordered
              collections.
            </p>
          </article>
          <article>
            <strong>Configuration review</strong>
            <p>
              Compare nested policy and infrastructure documents with
              path-specific rules.
            </p>
          </article>
          <article>
            <strong>Audit and approval</strong>
            <p>
              Pair moved records by identity and surface the fields a reviewer
              must approve.
            </p>
          </article>
        </div>
      </section>

      <footer>
        <span>JYCM · JSON You-Cha-Ma</span>
        <span>Open source under the MIT License</span>
      </footer>
    </main>
  );
}

const WorkspaceFallback = () => (
  <section className="workspace-fallback" aria-live="polite">
    <p className="eyebrow">Loading playground</p>
    <h2>Preparing the semantic diff editors…</h2>
  </section>
);

export default Demo;
