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
              Author portable business policies, explain every rule outcome,
              generate executable RFC 6902 patches, and inspect synchronized
              paths. One browser workspace now covers design through delivery.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#playground">
                Try the playground
              </a>
              <a
                className="secondary-action"
                href="https://github.com/eggachecat/jycm/tree/master/skills/jycm-business-diff"
                target="_blank"
                rel="noreferrer"
              >
                Install the Agent Skill
              </a>
            </div>
          </div>
          <div className="feature-grid" aria-label="JYCM capabilities">
            <article>
              <span>01</span>
              <strong>Domain-aware</strong>
              <p>
                Combine identity, tolerance, normalization, expectations,
                ranges, ignored fields, and set semantics per path.
              </p>
            </article>
            <article>
              <span>02</span>
              <strong>Actionable</strong>
              <p>
                Review business summaries, named rule violations, affected
                paths, and synchronized visual detail.
              </p>
            </article>
            <article>
              <span>03</span>
              <strong>Portable</strong>
              <p>
                Generate, validate, copy, download, and apply semantic JSON
                Patch from Python, JavaScript, CLI, or React.
              </p>
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

      <section className="agent-skill" aria-labelledby="agent-skill-title">
        <div>
          <p className="eyebrow">Agent-ready workflow</p>
          <h2 id="agent-skill-title">
            Give Codex, Claude, and other agents the business context.
          </h2>
          <p>
            The portable JYCM Business Diff Skill teaches agents how to design
            policies, collect fixtures, verify semantic patches, wire the UI,
            and deploy safely—without hiding business logic in prompts.
          </p>
          <a
            href="https://github.com/eggachecat/jycm/tree/master/skills/jycm-business-diff"
            target="_blank"
            rel="noreferrer"
          >
            Open skill documentation ↗
          </a>
        </div>
        <div className="install-grid" aria-label="Agent Skill install commands">
          <InstallCommand
            label="Codex"
            command="python skills/jycm-business-diff/scripts/install_skill.py --client codex"
          />
          <InstallCommand
            label="Claude"
            command="python skills/jycm-business-diff/scripts/install_skill.py --client claude"
          />
          <InstallCommand
            label="Project agents"
            command="python skills/jycm-business-diff/scripts/install_skill.py --client agents --project ."
          />
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

const InstallCommand: React.FC<{ label: string; command: string }> = ({
  label,
  command,
}) => (
  <article>
    <span>{label}</span>
    <code>{command}</code>
  </article>
);

export default Demo;
