import {
  PLACE_HOLDER_NON_EXIST,
  TreeLevel,
  YouchamaJsonDiffer,
  make_ignore_order_func,
} from "jycm";

export type BusinessRule = {
  name?: string;
  path?: string;
  value?: string;
  operation: string;
  options?: Record<string, any>;
  parameter?: Record<string, any>;
};

export type BusinessPolicyInput =
  | BusinessRule[]
  | { version?: number; name?: string; rules?: BusinessRule[] };

type NormalizedRule = {
  name: string;
  path: string;
  operation: string;
  options: Record<string, any>;
};

export type JsonPatchOperation = {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  from?: string;
  value?: unknown;
};

export type BusinessDiffSummary = {
  equal: boolean;
  change_count: number;
  rule_evaluation_count: number;
  rule_violation_count: number;
  matched_pair_count: number;
  affected_paths: string[];
  events: Record<string, number>;
  violations: Array<Record<string, any>>;
};

export type BusinessFunctionContext = {
  path: string;
  pointer: string;
  left: unknown;
  right: unknown;
  leftExists: boolean;
  rightExists: boolean;
};

export type BusinessFunctionDecision = {
  equal: boolean;
  reason?: string;
  severity?: "info" | "warning" | "error";
};

export type BusinessDiffFunction = (
  context: BusinessFunctionContext,
) => boolean | BusinessFunctionDecision | null | undefined;

export type BusinessFunctionEvaluation = BusinessFunctionDecision &
  BusinessFunctionContext;

const operationAliases: Record<string, string> = {
  ignore: "ignore",
  unordered: "unordered",
  ignore_order: "unordered",
  "operator:list:ignoreOrder": "unordered",
  match_by: "match_by",
  "operator:list:matchWithField": "match_by",
  numeric_tolerance: "numeric_tolerance",
  "operator:number:tolerance": "numeric_tolerance",
  string_normalize: "string_normalize",
  "operator:string:normalize": "string_normalize",
  expect_change: "expect_change",
  "operator:expectChange": "expect_change",
  expect_exist: "expect_exist",
  "operator:expectExist": "expect_exist",
  range: "range",
  "operator:floatInRange": "range",
};

const standardEvents = new Set([
  "dict:add",
  "dict:remove",
  "list:add",
  "list:remove",
  "value_changes",
]);

export class BusinessPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessPolicyError";
    Object.setPrototypeOf(this, BusinessPolicyError.prototype);
  }
}

export class BusinessFunctionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessFunctionError";
    Object.setPrototypeOf(this, BusinessFunctionError.prototype);
  }
}

export const compileBusinessFunction = (
  source: string,
): BusinessDiffFunction => {
  let candidate: unknown;
  try {
    candidate = new Function(`"use strict"; return (${source});`)();
  } catch (error) {
    throw new BusinessFunctionError(
      `JavaScript could not compile: ${
        error instanceof Error ? error.message : "unknown syntax error"
      }`,
    );
  }
  if (typeof candidate !== "function") {
    throw new BusinessFunctionError(
      "JavaScript must evaluate to a function or arrow function",
    );
  }
  return candidate as BusinessDiffFunction;
};

class PolicyOperator {
  path_regex: string;
  regex: RegExp;
  rule_name?: string;

  constructor(path: string, ruleName?: string) {
    this.path_regex = path;
    this.regex = new RegExp(path);
    this.rule_name = ruleName;
  }

  match(level: TreeLevel) {
    return level.get_path().match(this.regex) !== null;
  }

  protected details() {
    return this.rule_name ? { rule: this.rule_name } : {};
  }
}

class IgnoreOperator extends PolicyOperator {
  __event__ = "ignore";

  diff(level: TreeLevel, instance: YouchamaJsonDiffer, drill: boolean) {
    if (!drill) {
      instance.report(this.__event__, level, {
        pass: true,
        path_regex: this.path_regex,
        ...this.details(),
      });
    }
    return { skip: true, score: 1 };
  }
}

class MatchByOperator extends PolicyOperator {
  __event__ = "operator:list:matchWithField";
  field: string;

  constructor(path: string, field: string, ruleName?: string) {
    super(path, ruleName);
    this.field = field;
  }

  diff(level: TreeLevel, instance: YouchamaJsonDiffer, drill: boolean) {
    if (drill && level.left?.[this.field] === level.right?.[this.field]) {
      return { skip: true, score: 1 };
    }
    if (!drill) {
      instance.report(this.__event__, level, {
        field: this.field,
        path_regex: this.path_regex,
        ...this.details(),
      });
    }
    return { skip: false, score: -1 };
  }
}

class NumericToleranceOperator extends PolicyOperator {
  __event__ = "operator:number:tolerance";
  absolute: number;
  relative: number;

  constructor(path: string, absolute = 0, relative = 0, ruleName?: string) {
    super(path, ruleName);
    if (absolute < 0 || relative < 0) {
      throw new BusinessPolicyError("numeric tolerances must be non-negative");
    }
    this.absolute = absolute;
    this.relative = relative;
  }

  diff(level: TreeLevel, instance: YouchamaJsonDiffer, drill: boolean) {
    const numeric =
      typeof level.left === "number" && typeof level.right === "number";
    const delta = numeric ? Math.abs(level.left - level.right) : null;
    const scale = numeric
      ? Math.max(Math.abs(level.left), Math.abs(level.right))
      : 0;
    const threshold = Math.max(this.absolute, this.relative * scale);
    const pass = numeric && (delta as number) <= threshold;
    if (!drill) {
      instance.report(this.__event__, level, {
        pass,
        delta,
        threshold,
        absolute_tolerance: this.absolute,
        relative_tolerance: this.relative,
        path_regex: this.path_regex,
        ...this.details(),
      });
    }
    return { skip: true, score: pass ? 1 : 0 };
  }
}

class StringNormalizeOperator extends PolicyOperator {
  __event__ = "operator:string:normalize";
  trim: boolean;
  lowercase: boolean;
  collapseWhitespace: boolean;

  constructor(
    path: string,
    trim = true,
    lowercase = false,
    collapseWhitespace = false,
    ruleName?: string,
  ) {
    super(path, ruleName);
    this.trim = trim;
    this.lowercase = lowercase;
    this.collapseWhitespace = collapseWhitespace;
  }

  private normalize(value: unknown) {
    if (typeof value !== "string") return value;
    let normalized = this.trim ? value.trim() : value;
    if (this.collapseWhitespace) normalized = normalized.replace(/\s+/g, " ");
    if (this.lowercase) normalized = normalized.toLowerCase();
    return normalized;
  }

  diff(level: TreeLevel, instance: YouchamaJsonDiffer, drill: boolean) {
    const left = this.normalize(level.left);
    const right = this.normalize(level.right);
    const pass =
      typeof level.left === "string" &&
      typeof level.right === "string" &&
      left === right;
    if (!drill) {
      instance.report(this.__event__, level, {
        pass,
        normalized_left: left,
        normalized_right: right,
        trim: this.trim,
        lowercase: this.lowercase,
        collapse_whitespace: this.collapseWhitespace,
        path_regex: this.path_regex,
        ...this.details(),
      });
    }
    return { skip: true, score: pass ? 1 : 0 };
  }
}

class ExpectChangeOperator extends PolicyOperator {
  __event__ = "operator:primitive:expectChange";

  diff(level: TreeLevel, instance: YouchamaJsonDiffer, drill: boolean) {
    const pass = level.left !== level.right;
    if (!drill) {
      instance.report(this.__event__, level, {
        pass,
        path_regex: this.path_regex,
        ...this.details(),
      });
    }
    return { skip: true, score: pass ? 1 : 0 };
  }
}

class ExpectExistOperator extends PolicyOperator {
  __event__ = "operator:expectExist";

  diff(level: TreeLevel, instance: YouchamaJsonDiffer, drill: boolean) {
    const leftMissing = level.left === PLACE_HOLDER_NON_EXIST;
    const rightMissing = level.right === PLACE_HOLDER_NON_EXIST;
    const pass = !leftMissing && !rightMissing;
    if (!drill) {
      instance.report(this.__event__, level, {
        pass,
        ...(leftMissing ? { left_non_exist: true } : {}),
        ...(rightMissing ? { right_non_exist: true } : {}),
        path_regex: this.path_regex,
        ...this.details(),
      });
    }
    return { skip: true, score: pass ? 1 : 0 };
  }
}

class RangeOperator extends PolicyOperator {
  __event__ = "operator:floatInRange";
  start: number;
  end: number;

  constructor(path: string, start: number, end: number, ruleName?: string) {
    super(path, ruleName);
    this.start = start;
    this.end = end;
  }

  diff(level: TreeLevel, instance: YouchamaJsonDiffer, drill: boolean) {
    const leftValid =
      typeof level.left === "number" &&
      this.start < level.left &&
      level.left <= this.end;
    const rightValid =
      typeof level.right === "number" &&
      this.start < level.right &&
      level.right <= this.end;
    const pass = leftValid && rightValid;
    if (!drill) {
      instance.report(this.__event__, level, {
        pass,
        ...(!leftValid ? { left_invalid: true } : {}),
        ...(!rightValid ? { right_invalid: true } : {}),
        interval_start: this.start,
        interval_end: this.end,
        path_regex: this.path_regex,
        ...this.details(),
      });
    }
    return { skip: true, score: pass ? 1 : 0 };
  }
}

export class BusinessDiffPolicy {
  static readonly VERSION = 1;
  name?: string;
  rules: NormalizedRule[];

  constructor(policy: BusinessPolicyInput = { version: 1, rules: [] }) {
    const input = Array.isArray(policy)
      ? { version: BusinessDiffPolicy.VERSION, rules: policy }
      : policy;
    if (!input || typeof input !== "object") {
      throw new BusinessPolicyError(
        "policy must be an object or a list of rules",
      );
    }
    const version = input.version ?? BusinessDiffPolicy.VERSION;
    if (version !== BusinessDiffPolicy.VERSION) {
      throw new BusinessPolicyError(`unsupported policy version: ${version}`);
    }
    if (input.rules !== undefined && !Array.isArray(input.rules)) {
      throw new BusinessPolicyError("policy.rules must be a list");
    }
    this.name = input.name;
    this.rules = (input.rules || []).map((rule, index) => {
      if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
        throw new BusinessPolicyError(`rule ${index} must be an object`);
      }
      const operation = operationAliases[rule.operation];
      if (!operation) {
        throw new BusinessPolicyError(
          `rule ${index} has unsupported operation: ${rule.operation}`,
        );
      }
      const path = rule.path ?? rule.value;
      if (typeof path !== "string" || !path) {
        throw new BusinessPolicyError(
          `rule ${index} requires a non-empty path regex`,
        );
      }
      const options = rule.options ?? rule.parameter ?? {};
      if (!options || typeof options !== "object" || Array.isArray(options)) {
        throw new BusinessPolicyError(
          `rule ${index} options must be an object`,
        );
      }
      if (
        operation === "match_by" &&
        (typeof options.field !== "string" || !options.field)
      ) {
        throw new BusinessPolicyError(
          `match_by rule ${index} requires options.field`,
        );
      }
      return {
        name: rule.name || `rule-${index + 1}`,
        path,
        operation,
        options: { ...options },
      };
    });
  }

  compile() {
    const custom_operators: any[] = [];
    const unorderedPaths: string[] = [];
    this.rules.forEach(({ operation, path, options, name }) => {
      if (operation === "unordered") unorderedPaths.push(path);
      else if (operation === "ignore") {
        custom_operators.push(new IgnoreOperator(path, name));
      } else if (operation === "match_by") {
        custom_operators.push(new MatchByOperator(path, options.field, name));
      } else if (operation === "numeric_tolerance") {
        custom_operators.push(
          new NumericToleranceOperator(
            path,
            options.absolute ?? 0,
            options.relative ?? 0,
            name,
          ),
        );
      } else if (operation === "string_normalize") {
        custom_operators.push(
          new StringNormalizeOperator(
            path,
            options.trim ?? true,
            options.lowercase ?? false,
            options.collapse_whitespace ?? false,
            name,
          ),
        );
      } else if (operation === "expect_change") {
        custom_operators.push(new ExpectChangeOperator(path, name));
      } else if (operation === "expect_exist") {
        custom_operators.push(new ExpectExistOperator(path, name));
      } else if (operation === "range") {
        if (options.start === undefined || options.end === undefined) {
          throw new BusinessPolicyError(
            `range rule ${name} requires options.start and options.end`,
          );
        }
        custom_operators.push(
          new RangeOperator(path, options.start, options.end, name),
        );
      }
    });
    return {
      custom_operators,
      ignore_order_func: make_ignore_order_func(unorderedPaths),
    };
  }

  build(left: unknown, right: unknown) {
    const differ = new YouchamaJsonDiffer(left, right, this.compile());
    (differ as any).business_policy = this.toJSON();
    return differ;
  }

  toJSON() {
    return {
      version: BusinessDiffPolicy.VERSION,
      ...(this.name === undefined ? {} : { name: this.name }),
      rules: this.rules.map((rule) => ({
        ...rule,
        options: { ...rule.options },
      })),
    };
  }
}

const cloneValue = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(cloneValue) as T;
  if (value !== null && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).reduce((copy, key) => {
      (copy as any)[key] = cloneValue((value as any)[key]);
      return copy;
    }, {} as T);
  }
  return value;
};

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => deepEqual(value, right[index]))
    );
  }
  if (
    left !== null &&
    right !== null &&
    typeof left === "object" &&
    typeof right === "object"
  ) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(right, key) &&
          deepEqual((left as any)[key], (right as any)[key]),
      )
    );
  }
  return false;
};

const escapeToken = (token: string | number) =>
  String(token).replace(/~/g, "~0").replace(/\//g, "~1");

const joinPointer = (path: string, token: string | number) =>
  `${path}/${escapeToken(token)}`;

export const makeJsonPatch = (
  left: unknown,
  right: unknown,
  equivalent?: (
    left: unknown,
    right: unknown,
    leftPath: Array<string | number>,
    rightPath: Array<string | number>,
  ) => boolean,
  includeTests = false,
) => {
  const operations: JsonPatchOperation[] = [];
  const addTest = (path: string, value: unknown) => {
    if (includeTests) {
      operations.push({ op: "test", path, value: cloneValue(value) });
    }
  };
  const walk = (
    leftValue: any,
    rightValue: any,
    leftPath: Array<string | number>,
    rightPath: Array<string | number>,
    pointer: string,
  ) => {
    if (deepEqual(leftValue, rightValue)) return;
    if (equivalent?.(leftValue, rightValue, leftPath, rightPath)) return;
    const leftObject =
      leftValue !== null &&
      typeof leftValue === "object" &&
      !Array.isArray(leftValue);
    const rightObject =
      rightValue !== null &&
      typeof rightValue === "object" &&
      !Array.isArray(rightValue);
    if (leftObject && rightObject) {
      const leftKeys = Object.keys(leftValue);
      const rightKeys = Object.keys(rightValue);
      leftKeys
        .filter((key) => !rightKeys.includes(key))
        .sort()
        .forEach((key) => {
          const path = joinPointer(pointer, key);
          if (
            equivalent?.(
              leftValue[key],
              PLACE_HOLDER_NON_EXIST,
              [...leftPath, key],
              [...rightPath, key],
            )
          ) {
            return;
          }
          addTest(path, leftValue[key]);
          operations.push({ op: "remove", path });
        });
      leftKeys
        .filter((key) => rightKeys.includes(key))
        .sort()
        .forEach((key) =>
          walk(
            leftValue[key],
            rightValue[key],
            [...leftPath, key],
            [...rightPath, key],
            joinPointer(pointer, key),
          ),
        );
      rightKeys
        .filter((key) => !leftKeys.includes(key))
        .sort()
        .forEach((key) => {
          if (
            equivalent?.(
              PLACE_HOLDER_NON_EXIST,
              rightValue[key],
              [...leftPath, key],
              [...rightPath, key],
            )
          ) {
            return;
          }
          operations.push({
            op: "add",
            path: joinPointer(pointer, key),
            value: cloneValue(rightValue[key]),
          });
        });
      return;
    }
    if (Array.isArray(leftValue) && Array.isArray(rightValue)) {
      const shared = Math.min(leftValue.length, rightValue.length);
      for (let index = 0; index < shared; index += 1) {
        walk(
          leftValue[index],
          rightValue[index],
          [...leftPath, index],
          [...rightPath, index],
          joinPointer(pointer, index),
        );
      }
      for (let index = leftValue.length - 1; index >= shared; index -= 1) {
        const path = joinPointer(pointer, index);
        if (
          equivalent?.(
            leftValue[index],
            PLACE_HOLDER_NON_EXIST,
            [...leftPath, index],
            [...rightPath, index],
          )
        ) {
          continue;
        }
        addTest(path, leftValue[index]);
        operations.push({ op: "remove", path });
      }
      for (let index = shared; index < rightValue.length; index += 1) {
        if (
          equivalent?.(
            PLACE_HOLDER_NON_EXIST,
            rightValue[index],
            [...leftPath, index],
            [...rightPath, index],
          )
        ) {
          continue;
        }
        operations.push({
          op: "add",
          path: joinPointer(pointer, index),
          value: cloneValue(rightValue[index]),
        });
      }
      return;
    }
    addTest(pointer, leftValue);
    operations.push({
      op: "replace",
      path: pointer,
      value: cloneValue(rightValue),
    });
  };
  walk(left, right, [], [], "");
  return operations;
};

const pointerTokens = (path: string) => {
  if (path === "") return [];
  if (typeof path !== "string" || !path.startsWith("/")) {
    throw new Error("JSON Pointer paths must be empty or start with '/'");
  }
  return path
    .slice(1)
    .split("/")
    .map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~"));
};

const arrayIndex = (token: string, length: number, allowEnd = false) => {
  if (token === "-" && allowEnd) return length;
  if (!/^(0|[1-9]\d*)$/.test(token)) {
    throw new Error(`Invalid array index: ${token}`);
  }
  const index = Number(token);
  if (index > (allowEnd ? length : length - 1)) {
    throw new Error(`Array index out of bounds: ${index}`);
  }
  return index;
};

const resolvePointer = (document: any, path: string) => {
  let value = document;
  pointerTokens(path).forEach((token) => {
    if (Array.isArray(value)) value = value[arrayIndex(token, value.length)];
    else if (
      value !== null &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, token)
    ) {
      value = value[token];
    } else throw new Error(`Path does not exist: ${path}`);
  });
  return value;
};

const pointerParent = (document: any, path: string): [any, string] => {
  const tokens = pointerTokens(path);
  if (!tokens.length) return [null, ""];
  let value = document;
  tokens.slice(0, -1).forEach((token) => {
    if (Array.isArray(value)) value = value[arrayIndex(token, value.length)];
    else if (
      value !== null &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, token)
    ) {
      value = value[token];
    } else throw new Error(`Parent path does not exist: ${path}`);
  });
  return [value, tokens[tokens.length - 1]];
};

const addValue = (document: any, path: string, value: unknown) => {
  if (path === "") return value;
  const [parent, token] = pointerParent(document, path);
  if (Array.isArray(parent)) {
    parent.splice(arrayIndex(token, parent.length, true), 0, value);
  } else if (parent !== null && typeof parent === "object")
    parent[token] = value;
  else throw new Error(`Add target is not a container: ${path}`);
  return document;
};

const removeValue = (document: any, path: string) => {
  if (path === "")
    throw new Error("Removing the document root is not supported");
  const [parent, token] = pointerParent(document, path);
  if (Array.isArray(parent)) parent.splice(arrayIndex(token, parent.length), 1);
  else if (
    parent !== null &&
    typeof parent === "object" &&
    Object.prototype.hasOwnProperty.call(parent, token)
  ) {
    delete parent[token];
  } else throw new Error(`Remove path does not exist: ${path}`);
  return document;
};

export const applyJsonPatch = (
  document: unknown,
  patch: JsonPatchOperation[],
) => {
  let result: any = cloneValue(document);
  patch.forEach((operation) => {
    if (operation.op === "test") {
      if (!deepEqual(resolvePointer(result, operation.path), operation.value)) {
        throw new Error(`Test failed at path: ${operation.path}`);
      }
    } else if (operation.op === "add") {
      result = addValue(result, operation.path, cloneValue(operation.value));
    } else if (operation.op === "remove") {
      result = removeValue(result, operation.path);
    } else if (operation.op === "replace") {
      if (operation.path !== "") {
        resolvePointer(result, operation.path);
        result = removeValue(result, operation.path);
      }
      result = addValue(result, operation.path, cloneValue(operation.value));
    } else if (operation.op === "move" || operation.op === "copy") {
      if (operation.from === undefined) {
        throw new Error(`${operation.op} requires a from pointer`);
      }
      const value = cloneValue(resolvePointer(result, operation.from));
      if (operation.op === "move") result = removeValue(result, operation.from);
      result = addValue(result, operation.path, value);
    }
  });
  return result;
};

export const makeSemanticJsonPatch = (
  differ: YouchamaJsonDiffer,
  includeTests = false,
  businessFunction?: BusinessDiffFunction,
  onEvaluation?: (evaluation: BusinessFunctionEvaluation) => void,
) => {
  const patchContext = Object.create(differ) as YouchamaJsonDiffer;
  patchContext.report = () => undefined;
  return makeJsonPatch(
    differ.left,
    differ.right,
    (left, right, leftPath, rightPath) => {
      const level = new TreeLevel(left, right, leftPath, rightPath, null);
      if (businessFunction) {
        const leftExists = left !== PLACE_HOLDER_NON_EXIST;
        const rightExists = right !== PLACE_HOLDER_NON_EXIST;
        const context: BusinessFunctionContext = Object.freeze({
          path: level.get_path(),
          pointer: rightPath.length
            ? "/" + rightPath.map((token) => escapeToken(token)).join("/")
            : "",
          left: leftExists ? cloneValue(left) : undefined,
          right: rightExists ? cloneValue(right) : undefined,
          leftExists,
          rightExists,
        });
        let rawDecision: ReturnType<BusinessDiffFunction>;
        try {
          rawDecision = businessFunction(context);
        } catch (error) {
          throw new BusinessFunctionError(
            `JavaScript failed at ${context.path || "root"}: ${
              error instanceof Error ? error.message : "unknown runtime error"
            }`,
          );
        }
        if (rawDecision !== undefined && rawDecision !== null) {
          const decision =
            typeof rawDecision === "boolean"
              ? { equal: rawDecision }
              : rawDecision;
          if (
            !decision ||
            typeof decision !== "object" ||
            typeof decision.equal !== "boolean"
          ) {
            throw new BusinessFunctionError(
              `JavaScript must return boolean, { equal, reason? }, or undefined at ${
                context.path || "root"
              }`,
            );
          }
          const evaluation = { ...context, ...decision };
          onEvaluation?.(evaluation);
          return decision.equal;
        }
      }
      for (const operator of differ.custom_operators) {
        if (operator.match(level)) {
          const { skip, score } = operator.diff(level, patchContext, false);
          if (skip) return score === 1;
        }
      }
      if (Array.isArray(left) && differ.ignore_order_func(level, false)) {
        const isolated = new YouchamaJsonDiffer(left, right, {
          custom_operators: differ.custom_operators,
          ignore_order_func: differ.ignore_order_func,
          use_cache: differ.use_cache,
        });
        return isolated.diff_level(level, false) === 1;
      }
      return false;
    },
    includeTests,
  );
};

export const summarizeBusinessDiff = (
  diffResult: Record<string, any[]>,
  equal: boolean,
): BusinessDiffSummary => {
  const events: Record<string, number> = {};
  const violations: Array<Record<string, any>> = [];
  const affectedPaths = new Set<string>();
  let changeCount = 0;
  let ruleEvaluationCount = 0;
  Object.entries(diffResult || {}).forEach(([event, records]) => {
    if (event === "just4vis:pairs" || records.length === 0) return;
    events[event] = records.length;
    if (standardEvents.has(event)) {
      changeCount += records.length;
      records.forEach((record) => {
        const path = record.right_path || record.left_path;
        if (path) affectedPaths.add(path);
      });
      return;
    }
    ruleEvaluationCount += records.length;
    records.forEach((record) => {
      if (record.pass === false) {
        violations.push({ event, ...record });
        const path = record.right_path || record.left_path;
        if (path) affectedPaths.add(path);
      }
    });
  });
  return {
    equal,
    change_count: changeCount,
    rule_evaluation_count: ruleEvaluationCount,
    rule_violation_count: violations.length,
    matched_pair_count: diffResult?.["just4vis:pairs"]?.length || 0,
    affected_paths: Array.from(affectedPaths).sort(),
    events,
    violations,
  };
};
