import React, { useEffect, useMemo, useState } from "react";

import { get_jycm_instance_from_json } from "jycm";
import { JYCMContext, JYCMRender, useJYCM } from "react-jycm-viewer";

import { DiffDetailViewer } from "./jycm-diff-detail-viewer-simple";
import { JsonInput } from "./json-input";
import { JYCMResultViewer } from "./jycm-result-viewer";
import {
  jycmConfig as defaultJYCMConfig,
  leftJson as defaultLeftJson,
  rightJson as defaultRightJson,
} from "./render-case/case-1";

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

const getDiff = (left: string, right: string, config: string) =>
  get_jycm_instance_from_json(
    JSON.parse(left),
    JSON.parse(right),
    JSON.parse(config),
  ).get_diff(false);

type ValidComparison = {
  left: string;
  right: string;
  diffResult: Record<string, any[]>;
};

const initialLeft = pretty(defaultLeftJson);
const initialRight = pretty(defaultRightJson);
const initialRules = pretty(defaultJYCMConfig);

function SemanticDiffWorkspace() {
  const [leftInput, setLeftInput] = useState(initialLeft);
  const [rightInput, setRightInput] = useState(initialRight);
  const [rulesInput, setRulesInput] = useState(initialRules);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ValidComparison>(() => ({
    left: initialLeft,
    right: initialRight,
    diffResult: getDiff(initialLeft, initialRight, initialRules),
  }));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const diffResult = getDiff(leftInput, rightInput, rulesInput);
        setComparison({ left: leftInput, right: rightInput, diffResult });
        setError(null);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Invalid JSON or rule configuration",
        );
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [leftInput, rightInput, rulesInput]);

  const stats = useMemo(() => {
    const entries = Object.entries(comparison.diffResult).filter(
      ([operation]) => operation !== "just4vis:pairs",
    );
    return {
      operations: entries.length,
      changes: entries.reduce(
        (total, [, records]) => total + records.length,
        0,
      ),
      pairs: comparison.diffResult["just4vis:pairs"]?.length || 0,
    };
  }, [comparison.diffResult]);

  const context = useJYCM({
    leftJsonStr: comparison.left,
    rightJsonStr: comparison.right,
    diffResult: comparison.diffResult,
  });

  const reset = () => {
    setLeftInput(initialLeft);
    setRightInput(initialRight);
    setRulesInput(initialRules);
  };

  return (
    <>
      <section className="playground" aria-labelledby="playground-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live workspace</p>
            <h2 id="playground-title">
              Edit values and rules. See the semantic diff instantly.
            </h2>
          </div>
          <button type="button" className="reset-button" onClick={reset}>
            Reset example
          </button>
        </div>

        <div className="status-row" aria-live="polite">
          <span
            className={error ? "status-dot status-dot--error" : "status-dot"}
          />
          <span>
            {error
              ? `Waiting for valid input: ${error}`
              : "Comparison is up to date"}
          </span>
          <div className="stats">
            <span>
              <strong>{stats.changes}</strong> changes
            </span>
            <span>
              <strong>{stats.operations}</strong> operation types
            </span>
            <span>
              <strong>{stats.pairs}</strong> aligned paths
            </span>
          </div>
        </div>

        <div className="input-grid">
          <EditorCard
            title="Before JSON"
            subtitle="The expected or previous value"
          >
            <JsonInput value={leftInput} onChange={setLeftInput} />
          </EditorCard>
          <EditorCard
            title="After JSON"
            subtitle="The actual or proposed value"
          >
            <JsonInput value={rightInput} onChange={setRightInput} />
          </EditorCard>
          <EditorCard
            title="Business rules"
            subtitle="Operators and order handling"
          >
            <JsonInput value={rulesInput} onChange={setRulesInput} />
          </EditorCard>
          <EditorCard
            title="Diff result"
            subtitle="Structured output for apps and APIs"
          >
            <JYCMResultViewer jycmResult={comparison.diffResult} />
          </EditorCard>
        </div>
      </section>

      <section className="visual-section" aria-labelledby="visual-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Synchronized inspection</p>
            <h2 id="visual-title">
              Select a changed line to follow its matched path.
            </h2>
          </div>
        </div>
        <JYCMContext.Provider value={context}>
          <div className="viewer-layout">
            <div className="viewer-main">
              <JYCMRender leftTitle="Before" rightTitle="After" />
            </div>
            <aside className="detail-panel" aria-label="Selected diff detail">
              <div className="panel-heading">Selected change</div>
              <div className="detail-editor">
                <DiffDetailViewer />
              </div>
            </aside>
          </div>
        </JYCMContext.Provider>
      </section>
    </>
  );
}

const EditorCard: React.FC<{
  title: string;
  subtitle: string;
}> = ({ title, subtitle, children }) => (
  <article className="editor-card">
    <header>
      <strong>{title}</strong>
      <span>{subtitle}</span>
    </header>
    <div className="editor-frame">{children}</div>
  </article>
);

export default SemanticDiffWorkspace;
