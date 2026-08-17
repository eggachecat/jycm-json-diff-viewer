import {
  BusinessDiffPolicy,
  BusinessPolicyError,
  applyJsonPatch,
  makeSemanticJsonPatch,
  summarizeBusinessDiff,
} from "../src/business-diff";
import { demoScenarios } from "../src/components/render-case/business-cases";

describe("business diff integration", () => {
  test("compiles every business rule and produces a verifiable semantic patch", () => {
    const scenario = demoScenarios[0];
    const policy = new BusinessDiffPolicy(scenario.policy as any);
    const differ = policy.build(scenario.before, scenario.after);
    const equal = differ.diff();
    const result = differ.to_dict(false) as Record<string, any[]>;
    const summary = summarizeBusinessDiff(result, equal);
    const patch = makeSemanticJsonPatch(differ, true);
    const patched = applyJsonPatch(scenario.before, patch);

    expect(equal).toBe(false);
    expect(summary.rule_evaluation_count).toBeGreaterThanOrEqual(8);
    expect(summary.rule_violation_count).toBe(1);
    expect(summary.violations[0]).toMatchObject({
      rule: "risk-envelope",
      right_invalid: true,
    });
    expect(result["dict:remove"]).toHaveLength(1);
    expect(result["dict:add"]).toHaveLength(1);
    expect(patch.some((operation) => operation.op === "remove")).toBe(true);
    expect(patch.some((operation) => operation.op === "add")).toBe(true);
    expect(patch.some((operation) => operation.op === "test")).toBe(true);
    const verificationDiffer = policy.build(patched, scenario.after);
    expect(verificationDiffer.diff()).toBe(false);
    expect(makeSemanticJsonPatch(verificationDiffer)).toHaveLength(0);
    expect((patched as any).generated_at).toBe(
      (scenario.before as any).generated_at,
    );
  });

  test("supports all RFC 6902 operation types", () => {
    const document = {
      source: { value: 1 },
      list: ["first", "second"],
      obsolete: true,
    };
    const patched = applyJsonPatch(document, [
      { op: "test", path: "/source/value", value: 1 },
      { op: "copy", from: "/source", path: "/copy" },
      { op: "move", from: "/list/0", path: "/list/1" },
      { op: "replace", path: "/source/value", value: 2 },
      { op: "add", path: "/created", value: true },
      { op: "remove", path: "/obsolete" },
    ]);

    expect(patched).toEqual({
      source: { value: 2 },
      copy: { value: 1 },
      list: ["second", "first"],
      created: true,
    });
    expect(document.source.value).toBe(1);
  });

  test("rejects invalid policy versions and malformed identity rules", () => {
    expect(() => new BusinessDiffPolicy({ version: 2, rules: [] })).toThrow(
      BusinessPolicyError,
    );
    expect(
      () =>
        new BusinessDiffPolicy([{ operation: "match_by", path: "^items$" }]),
    ).toThrow("requires options.field");
  });
});
