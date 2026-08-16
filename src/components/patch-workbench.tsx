import React, { useMemo, useState } from "react";

import { JsonPatchOperation } from "../business-diff";

const operations = ["add", "remove", "replace", "move", "copy", "test"];

const validate = (patch: JsonPatchOperation[]) => {
  const issues: string[] = [];
  patch.forEach((operation, index) => {
    if (!operations.includes(operation.op)) {
      issues.push(`#${index + 1}: unsupported operation`);
    }
    if (operation.path && !operation.path.startsWith("/")) {
      issues.push(`#${index + 1}: path must be a JSON Pointer`);
    }
    if (
      ["add", "replace", "test"].includes(operation.op) &&
      !("value" in operation)
    ) {
      issues.push(`#${index + 1}: ${operation.op} requires a value`);
    }
    if (
      ["move", "copy"].includes(operation.op) &&
      typeof operation.from !== "string"
    ) {
      issues.push(`#${index + 1}: ${operation.op} requires a from pointer`);
    }
  });
  return issues;
};

export const PatchWorkbench: React.FC<{
  patch: JsonPatchOperation[];
  onApply: () => unknown;
}> = ({ patch, onApply }) => {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copyState, setCopyState] = useState("Copy");
  const [applyResult, setApplyResult] = useState<unknown>();
  const [applyError, setApplyError] = useState("");
  const serialized = useMemo(() => JSON.stringify(patch, null, 2), [patch]);
  const counts = useMemo(
    () =>
      patch.reduce<Record<string, number>>((result, operation) => {
        result[operation.op] = (result[operation.op] || 0) + 1;
        return result;
      }, {}),
    [patch],
  );
  const issues = useMemo(() => validate(patch), [patch]);
  const visible = useMemo(
    () =>
      patch
        .map((operation, index) => ({ operation, index }))
        .filter(({ operation }) => filter === "all" || operation.op === filter)
        .filter(({ operation }) =>
          `${operation.op} ${operation.path} ${operation.from || ""}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        ),
    [filter, patch, query],
  );
  const selected =
    visible.find(({ index }) => index === selectedIndex) || visible[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(serialized);
      setCopyState("Copied");
    } catch {
      setCopyState("Copy failed");
    }
    window.setTimeout(() => setCopyState("Copy"), 1500);
  };

  const download = () => {
    const url = URL.createObjectURL(
      new Blob([serialized], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jycm.patch.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const apply = () => {
    try {
      setApplyResult(onApply());
      setApplyError("");
    } catch (error) {
      setApplyResult(undefined);
      setApplyError(
        error instanceof Error ? error.message : "Patch application failed",
      );
    }
  };

  return (
    <section className="patch-shell" aria-label="JSON Patch workbench">
      <header className="patch-header">
        <div>
          <h3>Semantic JSON Patch</h3>
          <span>{patch.length} RFC 6902 operations</span>
        </div>
        <div className="patch-actions">
          <button type="button" onClick={apply}>
            Apply preview
          </button>
          <button type="button" onClick={copy}>
            {copyState}
          </button>
          <button type="button" onClick={download}>
            Download
          </button>
        </div>
      </header>

      {issues.length > 0 && (
        <ul className="patch-issues">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
      {(applyResult !== undefined || applyError) && (
        <pre
          className={
            applyError
              ? "patch-apply-result patch-apply-result--error"
              : "patch-apply-result"
          }
          aria-live="polite"
        >
          {applyError || JSON.stringify(applyResult, null, 2)}
        </pre>
      )}

      {patch.length === 0 ? (
        <div className="patch-empty">
          No operations — the documents are semantically equal.
        </div>
      ) : (
        <>
          <div className="patch-filters" aria-label="Patch filters">
            <button
              type="button"
              className={filter === "all" ? "active" : undefined}
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              all {patch.length}
            </button>
            {operations
              .filter((operation) => counts[operation])
              .map((operation) => (
                <button
                  type="button"
                  key={operation}
                  className={filter === operation ? "active" : undefined}
                  aria-pressed={filter === operation}
                  onClick={() => setFilter(operation)}
                >
                  {operation} {counts[operation]}
                </button>
              ))}
            <input
              type="search"
              aria-label="Filter patch paths"
              placeholder="Filter JSON Pointer paths"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="patch-body">
            <ol className="patch-list">
              {visible.map(({ operation, index }) => (
                <li key={`${index}-${operation.op}-${operation.path}`}>
                  <button
                    type="button"
                    className={
                      selected?.index === index
                        ? "patch-row patch-row--selected"
                        : "patch-row"
                    }
                    aria-pressed={selected?.index === index}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <span className="patch-index">{index + 1}</span>
                    <span className={`patch-op patch-op--${operation.op}`}>
                      {operation.op}
                    </span>
                    <span className="patch-path">{operation.path || "/"}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="patch-detail" aria-live="polite">
              {selected ? (
                <>
                  <h4>
                    Operation {selected.index + 1}: {selected.operation.op}
                  </h4>
                  <code>path: {selected.operation.path || "/"}</code>
                  {selected.operation.from !== undefined && (
                    <code>from: {selected.operation.from}</code>
                  )}
                  {"value" in selected.operation && (
                    <pre>
                      {JSON.stringify(selected.operation.value, null, 2)}
                    </pre>
                  )}
                </>
              ) : (
                <div className="patch-empty">No matching operation.</div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
