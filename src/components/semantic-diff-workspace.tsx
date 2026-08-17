import React, { useEffect, useState } from "react";

import { JYCMContext, JYCMRender, useJYCM } from "react-jycm-viewer";

import {
  BusinessDiffPolicy,
  BusinessDiffFunction,
  BusinessFunctionEvaluation,
  BusinessDiffSummary,
  JsonPatchOperation,
  applyJsonPatch,
  compileBusinessFunction,
  makeSemanticJsonPatch,
  summarizeBusinessDiff,
} from "../business-diff";
import { DiffDetailViewer } from "./jycm-diff-detail-viewer-simple";
import { GitDiffViewer } from "./git-diff-viewer";
import { CodeInput, JsonInput } from "./json-input";
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
  businessFunction?: BusinessDiffFunction;
  businessFunctionEvaluations: BusinessFunctionEvaluation[];
};

const firstScenario = demoScenarios[0];
const initialLeft = pretty(firstScenario.before);
const initialRight = pretty(firstScenario.after);
const initialPolicy = pretty(firstScenario.policy);
const initialBusinessFunction = firstScenario.businessFunction;

const compare = (
  left: string,
  right: string,
  policyInput: string,
  businessFunctionInput: string,
  businessFunctionEnabled: boolean,
  includeTests: boolean,
): ValidComparison => {
  const leftValue = JSON.parse(left);
  const rightValue = JSON.parse(right);
  const policy = new BusinessDiffPolicy(JSON.parse(policyInput));
  const differ = policy.build(leftValue, rightValue);
  differ.diff();
  const diffResult = differ.to_dict(false) as Record<string, any[]>;
  const businessFunction = businessFunctionEnabled
    ? compileBusinessFunction(businessFunctionInput)
    : undefined;
  const businessFunctionEvaluations: BusinessFunctionEvaluation[] = [];
  const patch = makeSemanticJsonPatch(
    differ,
    includeTests,
    businessFunction,
    (evaluation) => businessFunctionEvaluations.push(evaluation),
  );
  if (businessFunctionEvaluations.length) {
    diffResult["operator:javascript"] = businessFunctionEvaluations.map(
      (evaluation) => ({
        left: evaluation.left,
        right: evaluation.right,
        left_path: evaluation.path,
        right_path: evaluation.path,
        pass: evaluation.equal,
        reason: evaluation.reason,
        severity: evaluation.severity || "info",
        rule: "custom-javascript",
      }),
    );
  }
  const summary = summarizeBusinessDiff(diffResult, false);
  const mutationCount = patch.filter(
    (operation) => operation.op !== "test",
  ).length;
  summary.change_count = mutationCount;
  summary.equal = mutationCount === 0 && summary.rule_violation_count === 0;
  return {
    left,
    right,
    leftValue,
    rightValue,
    policy,
    diffResult,
    summary,
    patch,
    businessFunction,
    businessFunctionEvaluations,
  };
};

function SemanticDiffWorkspace() {
  const [leftInput, setLeftInput] = useState(initialLeft);
  const [rightInput, setRightInput] = useState(initialRight);
  const [policyInput, setPolicyInput] = useState(initialPolicy);
  const [businessFunctionInput, setBusinessFunctionInput] = useState(
    initialBusinessFunction,
  );
  const [businessFunctionEnabled, setBusinessFunctionEnabled] = useState(true);
  const [activeScenario, setActiveScenario] = useState(firstScenario.id);
  const [includeTests, setIncludeTests] = useState(false);
  const [advancedInspectorOpen, setAdvancedInspectorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ValidComparison>(() =>
    compare(
      initialLeft,
      initialRight,
      initialPolicy,
      initialBusinessFunction,
      true,
      false,
    ),
  );
  const [expandedEditors, setExpandedEditors] = useState({
    before: true,
    after: true,
    policy: false,
    javascript: true,
    events: false,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setComparison(
          compare(
            leftInput,
            rightInput,
            policyInput,
            businessFunctionInput,
            businessFunctionEnabled,
            includeTests,
          ),
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
  }, [
    businessFunctionEnabled,
    businessFunctionInput,
    includeTests,
    leftInput,
    policyInput,
    rightInput,
  ]);

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
    setBusinessFunctionInput(scenario.businessFunction);
    setBusinessFunctionEnabled(true);
    setIncludeTests(false);
  };

  const toggleEditor = (editor: keyof typeof expandedEditors) => {
    setExpandedEditors((current) => ({
      ...current,
      [editor]: !current[editor],
    }));
  };

  const documentsExpanded = expandedEditors.before || expandedEditors.after;
  const toggleDocuments = () => {
    setExpandedEditors((current) => ({
      ...current,
      before: !documentsExpanded,
      after: !documentsExpanded,
    }));
  };

  const applyPatch = () => {
    const document = applyJsonPatch(comparison.leftValue, comparison.patch);
    const verificationDiffer = comparison.policy.build(
      document,
      comparison.rightValue,
    );
    verificationDiffer.diff();
    const verificationSummary = summarizeBusinessDiff(
      verificationDiffer.to_dict(false) as Record<string, any[]>,
      false,
    );
    const verificationEvaluations: BusinessFunctionEvaluation[] = [];
    const remainingPatch = makeSemanticJsonPatch(
      verificationDiffer,
      false,
      comparison.businessFunction,
      (evaluation) => verificationEvaluations.push(evaluation),
    );
    const targetPolicyPass =
      verificationSummary.rule_violation_count === 0 &&
      verificationEvaluations.every((evaluation) => evaluation.equal);
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
          <div className="workspace-actions">
            <button
              type="button"
              className="reset-button"
              onClick={toggleDocuments}
            >
              {documentsExpanded
                ? "Collapse Before / After"
                : "Expand Before / After"}
            </button>
            <button
              type="button"
              className="reset-button"
              onClick={() => loadScenario(firstScenario.id)}
            >
              Reset example
            </button>
          </div>
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
          <EditorCard
            title="Before JSON"
            subtitle="Expected or previous value"
            expanded={expandedEditors.before}
            onToggle={() => toggleEditor("before")}
          >
            <JsonInput value={leftInput} onChange={setLeftInput} />
          </EditorCard>
          <EditorCard
            title="After JSON"
            subtitle="Actual or proposed value"
            expanded={expandedEditors.after}
            onToggle={() => toggleEditor("after")}
          >
            <JsonInput value={rightInput} onChange={setRightInput} />
          </EditorCard>
          <EditorCard
            title="Business policy"
            subtitle="Versioned, portable, JSON-serializable rules"
            expanded={expandedEditors.policy}
            onToggle={() => toggleEditor("policy")}
          >
            <JsonInput value={policyInput} onChange={setPolicyInput} />
          </EditorCard>
          <EditorCard
            title="Raw event dictionary"
            subtitle="Stable machine-readable integration output"
            expanded={expandedEditors.events}
            onToggle={() => toggleEditor("events")}
          >
            <JYCMResultViewer jycmResult={comparison.diffResult} />
          </EditorCard>
          <EditorCard
            title="JavaScript business function"
            subtitle="Live path-level semantics — runs locally in this tab"
            expanded={expandedEditors.javascript}
            onToggle={() => toggleEditor("javascript")}
            wide
          >
            <div className="function-toolbar">
              <label>
                <input
                  type="checkbox"
                  checked={businessFunctionEnabled}
                  onChange={(event) =>
                    setBusinessFunctionEnabled(event.target.checked)
                  }
                />
                Execute custom function
              </label>
              <span>
                {comparison.businessFunctionEvaluations.length} decisions ·
                return
                <code>true</code>, <code>false</code>, or <code>undefined</code>
              </span>
            </div>
            <div className="function-api" aria-label="Business function API">
              <code>path</code>
              <code>pointer</code>
              <code>left</code>
              <code>right</code>
              <code>leftExists</code>
              <code>rightExists</code>
              <span>Trusted code only — executes in the current page.</span>
            </div>
            <div className="function-editor-frame">
              <CodeInput
                language="javascript"
                value={businessFunctionInput}
                onChange={setBusinessFunctionInput}
              />
            </div>
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

      <section className="visual-section" aria-labelledby="visual-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Git-style visual diff</p>
            <h2 id="visual-title">
              See every removed line in red and every added line in green.
            </h2>
          </div>
          <div className="diff-legend" aria-label="Diff color legend">
            <span className="diff-legend__removed">− Removed / before</span>
            <span className="diff-legend__added">+ Added / after</span>
            <span className="diff-legend__ignored">Ignored by policy</span>
          </div>
        </div>
        <p className="visual-guidance">
          This renderer owns its colors instead of depending on editor-theme
          decorations. Modified values are always a red removal followed by a
          green addition, while unchanged blocks collapse automatically.
        </p>
        <GitDiffViewer before={comparison.left} after={comparison.right} />
        <details
          className="advanced-inspector"
          open={advancedInspectorOpen}
          onToggle={(event) =>
            setAdvancedInspectorOpen(event.currentTarget.open)
          }
        >
          <summary>Open paired-path inspector</summary>
          {advancedInspectorOpen && (
            <>
              <p>
                Explore JYCM&apos;s synchronized tree paths and click a line for
                the raw event payload.
              </p>
              <JYCMContext.Provider value={context}>
                <div className="viewer-layout">
                  <div className="viewer-main">
                    <JYCMRender leftTitle="− Before" rightTitle="+ After" />
                  </div>
                  <aside
                    className="detail-panel"
                    aria-label="Selected diff detail"
                  >
                    <div className="panel-heading">Selected change</div>
                    <div className="detail-editor">
                      <DiffDetailViewer />
                    </div>
                  </aside>
                </div>
              </JYCMContext.Provider>
            </>
          )}
        </details>
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
        <PatchWorkbench
          patch={comparison.patch}
          onApply={applyPatch}
          onLoadNonEmptyExample={() => loadScenario(firstScenario.id)}
        />
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
  expanded: boolean;
  onToggle: () => void;
  wide?: boolean;
}> = ({ title, subtitle, expanded, onToggle, wide = false, children }) => (
  <article
    className={`editor-card${wide ? " editor-card--wide" : ""}${
      expanded ? " editor-card--expanded" : " editor-card--collapsed"
    }`}
  >
    <button
      type="button"
      className="editor-card__toggle"
      aria-expanded={expanded}
      onClick={onToggle}
    >
      <span>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <b aria-hidden="true">{expanded ? "−" : "+"}</b>
    </button>
    {expanded && <div className="editor-frame">{children}</div>}
  </article>
);

export default SemanticDiffWorkspace;
