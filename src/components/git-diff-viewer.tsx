import React, { useMemo, useState } from "react";

export type GitDiffLine = {
  kind: "context" | "add" | "remove" | "omitted";
  text: string;
  oldLine?: number;
  newLine?: number;
  omittedCount?: number;
};

const MAX_LCS_CELLS = 250_000;

export const buildLineDiff = (before: string, after: string): GitDiffLine[] => {
  const left = before.split("\n");
  const right = after.split("\n");

  if (left.length * right.length > MAX_LCS_CELLS) {
    return [
      ...left.map((text, index) => ({
        kind: "remove" as const,
        text,
        oldLine: index + 1,
      })),
      ...right.map((text, index) => ({
        kind: "add" as const,
        text,
        newLine: index + 1,
      })),
    ];
  }

  const matrix = Array.from(
    { length: left.length + 1 },
    () => new Uint16Array(right.length + 1),
  );
  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex -= 1) {
      matrix[leftIndex][rightIndex] =
        left[leftIndex] === right[rightIndex]
          ? matrix[leftIndex + 1][rightIndex + 1] + 1
          : Math.max(
              matrix[leftIndex + 1][rightIndex],
              matrix[leftIndex][rightIndex + 1],
            );
    }
  }

  const rows: GitDiffLine[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  while (leftIndex < left.length || rightIndex < right.length) {
    if (
      leftIndex < left.length &&
      rightIndex < right.length &&
      left[leftIndex] === right[rightIndex]
    ) {
      rows.push({
        kind: "context",
        text: left[leftIndex],
        oldLine: leftIndex + 1,
        newLine: rightIndex + 1,
      });
      leftIndex += 1;
      rightIndex += 1;
    } else if (
      rightIndex >= right.length ||
      (leftIndex < left.length &&
        matrix[leftIndex + 1][rightIndex] >= matrix[leftIndex][rightIndex + 1])
    ) {
      rows.push({
        kind: "remove",
        text: left[leftIndex],
        oldLine: leftIndex + 1,
      });
      leftIndex += 1;
    } else {
      rows.push({
        kind: "add",
        text: right[rightIndex],
        newLine: rightIndex + 1,
      });
      rightIndex += 1;
    }
  }
  return rows;
};

export const collapseContext = (
  rows: GitDiffLine[],
  contextLines = 2,
): GitDiffLine[] => {
  const changed = rows
    .map((row, index) => (row.kind === "context" ? -1 : index))
    .filter((index) => index >= 0);
  if (!changed.length) return rows;

  const visible = new Set<number>();
  changed.forEach((index) => {
    for (
      let cursor = Math.max(0, index - contextLines);
      cursor <= Math.min(rows.length - 1, index + contextLines);
      cursor += 1
    ) {
      visible.add(cursor);
    }
  });

  const result: GitDiffLine[] = [];
  let index = 0;
  while (index < rows.length) {
    if (visible.has(index)) {
      result.push(rows[index]);
      index += 1;
      continue;
    }
    const start = index;
    while (index < rows.length && !visible.has(index)) index += 1;
    result.push({
      kind: "omitted",
      text: "",
      omittedCount: index - start,
    });
  }
  return result;
};

export const GitDiffViewer: React.FC<{ before: string; after: string }> = ({
  before,
  after,
}) => {
  const [showAll, setShowAll] = useState(false);
  const rows = useMemo(() => buildLineDiff(before, after), [after, before]);
  const visibleRows = useMemo(
    () => (showAll ? rows : collapseContext(rows)),
    [rows, showAll],
  );
  const additions = rows.filter((row) => row.kind === "add").length;
  const removals = rows.filter((row) => row.kind === "remove").length;

  return (
    <section className="git-diff-shell" aria-label="Git-style JSON diff">
      <header className="git-diff-header">
        <div className="git-diff-file">
          <strong>before.json → after.json</strong>
          <span>{rows.length} rendered lines</span>
        </div>
        <div className="git-diff-stats" aria-label="Line change counts">
          <strong className="git-diff-stats__add">+{additions}</strong>
          <strong className="git-diff-stats__remove">−{removals}</strong>
          <button type="button" onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Collapse unchanged" : "Show full document"}
          </button>
        </div>
      </header>
      {additions === 0 && removals === 0 ? (
        <div className="git-diff-empty">No raw line changes.</div>
      ) : (
        <div className="git-diff-scroll">
          <table className="git-diff-table">
            <tbody>
              {visibleRows.map((row, index) =>
                row.kind === "omitted" ? (
                  <tr
                    className="git-diff-row git-diff-row--omitted"
                    key={index}
                  >
                    <td colSpan={4}>
                      ⋯ {row.omittedCount} unchanged lines collapsed ⋯
                    </td>
                  </tr>
                ) : (
                  <tr
                    className={`git-diff-row git-diff-row--${row.kind}`}
                    key={`${row.kind}-${row.oldLine || 0}-${row.newLine || 0}`}
                  >
                    <td className="git-diff-line-number">
                      {row.oldLine || ""}
                    </td>
                    <td className="git-diff-line-number">
                      {row.newLine || ""}
                    </td>
                    <td className="git-diff-marker">
                      {row.kind === "add"
                        ? "+"
                        : row.kind === "remove"
                        ? "−"
                        : " "}
                    </td>
                    <td>
                      <code>{row.text || " "}</code>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
