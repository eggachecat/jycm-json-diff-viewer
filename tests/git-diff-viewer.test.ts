import {
  buildLineDiff,
  collapseContext,
} from "../src/components/git-diff-viewer";

describe("Git diff renderer", () => {
  test("emits stable red/green line semantics for replacements", () => {
    const rows = buildLineDiff(
      '{\n  "status": "draft"\n}',
      '{\n  "status": "approved"\n}',
    );

    expect(rows.map((row) => row.kind)).toEqual([
      "context",
      "remove",
      "add",
      "context",
    ]);
    expect(rows.find((row) => row.kind === "remove")?.oldLine).toBe(2);
    expect(rows.find((row) => row.kind === "add")?.newLine).toBe(2);
  });

  test("collapses distant unchanged blocks while preserving context", () => {
    const before = Array.from({ length: 20 }, (_, index) => `line-${index}`);
    const after = [...before];
    after[10] = "changed";
    const collapsed = collapseContext(
      buildLineDiff(before.join("\n"), after.join("\n")),
    );

    expect(collapsed.some((row) => row.kind === "omitted")).toBe(true);
    expect(collapsed.some((row) => row.kind === "remove")).toBe(true);
    expect(collapsed.some((row) => row.kind === "add")).toBe(true);
  });
});
