import React, { useEffect, useState } from "react";

import { JYCMContext, JYCMRender, useJYCM } from "react-jycm-viewer";

import {
  BusinessDiffPolicy,
  BusinessDiffSummary,
  JsonPatchOperation,
  applyJsonPatch,
  makeSemanticJsonPatch,
  summarizeBusinessDiff,
} from "../business-diff";
import { DiffDetailViewer } from "./jycm-diff-detail-viewer-simple";
import { JsonInput } from "./json-input";
import { PatchWorkbench } from "./patch-workbench";
import { demoScenarios } from "./render-case/business-cases";
import { JYCMResultViewer } from "./jycm-result-viewer";

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

type ValidComparison = {
  left: string;
  right: string;
  leftValue: unknown;
  rightValue: unknown;
  policy: BusinessDiffPolicy;
  diffResult: Record<string, any[]>;
  summary: BusinessDiffSummary;
  patch: JsonPatchOperation[];
};

const firstScenario = demoScenarios[0];
const initialLeft = pretty(firstScenario.before);
const initialRight = pretty(firstScenario.after);
const initialPolicy = pretty(firstScenario.policy);

const compare = (
  left: string,
  right: string,
  policyInput: string,
  includeTests: boolean,
): ValidComparison => {
  const leftValue = JSON.parse(left);
  const rightValue = JSON.parse(right);
  const policy = new BusinessDiffPolicy(JSON.parse(policyInput));
  const differ = policy.build(leftValue, rightValue);
  const equal = differ.diff();
  const diffResult = differ.to_dict(false) as Record<string, any[]>;
  return {
    left,
    right,
    leftValue,
    rightValue,
    policy,
    diffResult,
    summary: summarizeBusinessDiff(diffResult, equal),
    patch: makeSemanticJsonPatch(differ, includeTests),
  };
};

function SemanticDiffWorkspace() {
  const [leftInput, setLeftInput] = useState(initialLeft);
  const [rightInput, setRightInput] = useState(initialRight);
  const [policyInput, setPolicyInput] = useState(initialPolicy);
  const [activeScenario, setActiveScenario] = useState(firstScenario.id);
  const [includeTests, setIncludeTests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ValidComparison>(() =>
    compare(initialLeft, initialRight, initialPolicy, false),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setComparison(
          compare(leftInput, rightInput, policyInput, includeTests),
        );
        setError(null);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Invalid JSON or business policy",
        );
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [includeTests, leftInput, policyInput, rightInput]);

  const context = useJYCM({
    leftJsonStr: comparison.left,
    rightJsonStr: comparison.right,
    diffResult: comparison.diffResult,
  });

  const loadScenario = (id: string) => {
    const scenario = demoScenarios.find((candidate) => candidate.id === id);
    if (!scenario) return;
    setActiveScenario(id);
    setLeftInput(pretty(scenario.before));
    setRightInput(pretty(scenario.after));
    setPolicyInput(pretty(scenario.policy));
    setIncludeTests(false);
  };

  const applyPatch = () => {
    const document = applyJsonPatch(comparison.leftValue, comparison.patch);
    const verificationDiffer = comparison.policy.build(
      document,
      comparison.rightValue,
    );
    const targetPolicyPass = verificationDiffer.diff();
    const remainingPatch = makeSemanticJsonPatch(verificationDiffer);
    const semanticallyValid = remainingPatch.length === 0;
    return {
      semantically_valid: semanticallyValid,
      target_policy_pass: targetPolicyPass,
      remaining_patch_operations: remainingPatch.length,
      note: semanticallyValid
        ? targetPolicyPass
          ? "Patch verified and the target passes every business-policy rule."
          : "Patch verified against the target. The target itself still has a policy violation shown above."
        : "The patched document still differs from the target under this business policy.",
      document,
    };
  };

  return (
    <>
      <section className="playground" aria-labelledby="playground-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live business diff workspace</p>
            <h2 id="playground-title">
              Edit documents and policy. Explain, patch, and verify instantly.
            </h2>
          </div>
          <button
            type="button"
            className="reset-button"
            onClick={() => loadScenario(firstScenario.id)}
          >
            Reset example
          </button>
        </div>

        <div className="scenario-picker" aria-label="Demo scenarios">
          {demoScenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              className={activeScenario === scenario.id ? "active" : undefined}
              aria-pressed={activeScenario === scenario.id}
              onClick={() => loadScenario(scenario.id)}
            >
              <strong>{scenario.label}</strong>
              <span>{scenario.description}</span>
            </button>
          ))}
        </div>

        <div className="status-row" aria-live="polite">
          <span
            className={error ? "status-dot status-dot--error" : "status-dot"}
          />
          <span>
            {error
              ? `Keep typing — last valid result shown: ${error}`
              : "Comparison is up to date"}
          </span>
          <div className="stats">
            <span
              className={
                comparison.summary.equal ? "semantic-pass" : "semantic-fail"
              }
            >
              {comparison.summary.equal
                ? "Semantically equal"
                : "Review required"}
            </span>
            <span>
              <strong>{comparison.summary.change_count}</strong> changes
            </span>
            <span>
              <strong>{comparison.summary.rule_evaluation_count}</strong> checks
            </span>
            <span>
              <strong>{comparison.summary.rule_violation_count}</strong>{" "}
              violations
            </span>
          </div>
        </div>

        <div className="input-grid">
          <EditorCard title="Before JSON" subtitle="Expected or previous value">
            <JsonInput value={leftInput} onChange={setLeftInput} />
          </EditorCard>
          <EditorCard title="After JSON" subtitle="Actual or proposed value">
            <JsonInput value={rightInput} onChange={setRightInput} />
          </EditorCard>
          <EditorCard
            title="Business policy"
            subtitle="Versioned, portable, JSON-serializable rules"
          >
            <JsonInput value={policyInput} onChange={setPolicyInput} />
          </EditorCard>
          <EditorCard
            title="Raw event dictionary"
            subtitle="Stable machine-readable integration output"
          >
            <JYCMResultViewer jycmResult={comparison.diffResult} />
          </EditorCard>
        </div>
      </section>

      <section className="explain-section" aria-labelledby="explain-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Business explanation</p>
            <h2 id="explain-title">
              A review-ready answer, not just a tree walk.
            </h2>
          </div>
        </div>
        <div className="metric-grid">
          <Metric
            label="Semantic result"
            value={comparison.summary.equal ? "Equal" : "Different"}
            tone={comparison.summary.equal ? "pass" : "fail"}
          />
          <Metric
            label="Meaningful changes"
            value={comparison.summary.change_count}
          />
          <Metric
            label="Rule evaluations"
            value={comparison.summary.rule_evaluation_count}
          />
          <Metric
            label="Rule violations"
            value={comparison.summary.rule_violation_count}
            tone={comparison.summary.rule_violation_count ? "fail" : "pass"}
          />
          <Metric
            label="Matched paths"
            value={comparison.summary.matched_pair_count}
          />
          <Metric label="Patch operations" value={comparison.patch.length} />
        </div>
        <div className="explanation-grid">
          <article className="explanation-card">
            <header>Rule outcomes</header>
            {comparison.summary.violations.length ? (
              <ul className="violation-list">
                {comparison.summary.violations.map((violation, index) => (
                  <li key={`${violation.event}-${index}`}>
                    <strong>{violation.rule || violation.event}</strong>
                    <code>
                      {violation.right_path || violation.left_path || "root"}
                    </code>
                    <span>{violation.event}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-copy">
                Every evaluated business rule passed.
              </p>
            )}
          </article>
          <article className="explanation-card">
            <header>Affected paths</header>
            {comparison.summary.affected_paths.length ? (
              <div className="path-cloud">
                {comparison.summary.affected_paths.map((path) => (
                  <code key={path}>{path}</code>
                ))}
              </div>
            ) : (
              <p className="empty-copy">No business-relevant path changed.</p>
            )}
            <div className="event-cloud">
              {Object.entries(comparison.summary.events).map(
                ([event, count]) => (
                  <span key={event}>
                    {event} <strong>{count}</strong>
                  </span>
                ),
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="patch-section" aria-labelledby="patch-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Executable delivery</p>
            <h2 id="patch-title">
              Inspect and apply the semantic RFC 6902 patch.
            </h2>
          </div>
          <label className="test-toggle">
            <input
              type="checkbox"
              checked={includeTests}
              onChange={(event) => setIncludeTests(event.target.checked)}
            />
            Include safety test operations
          </label>
        </div>
        <p className="operation-support">
          Full operation support: <code>add</code> <code>remove</code>{" "}
          <code>replace</code> <code>move</code> <code>copy</code>{" "}
          <code>test</code>
        </p>
        <PatchWorkbench patch={comparison.patch} onApply={applyPatch} />
      </section>

      <section className="visual-section" aria-labelledby="visual-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Synchronized inspection</p>
            <h2 id="visual-title">
              Follow each operation through aligned before and after paths.
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

const Metric: React.FC<{
  label: string;
  value: React.ReactNode;
  tone?: "pass" | "fail";
}> = ({ label, value, tone }) => (
  <article className={`metric-card${tone ? ` metric-card--${tone}` : ""}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

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
