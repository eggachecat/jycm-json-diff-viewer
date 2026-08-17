export type DemoScenario = {
  id: string;
  label: string;
  description: string;
  before: unknown;
  after: unknown;
  policy: unknown;
};

const reconciliationPolicy = {
  version: 1,
  name: "order-reconciliation",
  rules: [
    {
      name: "orders-are-a-set",
      path: "^orders$",
      operation: "unordered",
    },
    {
      name: "match-order-id",
      path: "^orders->\\[\\d+\\]$",
      operation: "match_by",
      options: { field: "id" },
    },
    {
      name: "currency-rounding",
      path: "^orders->\\[\\d+\\]->amount$",
      operation: "numeric_tolerance",
      options: { absolute: 0.5 },
    },
    {
      name: "canonical-customer",
      path: "^orders->\\[\\d+\\]->customer$",
      operation: "string_normalize",
      options: {
        trim: true,
        lowercase: true,
        collapse_whitespace: true,
      },
    },
    {
      name: "volatile-timestamp",
      path: "^generated_at$",
      operation: "ignore",
    },
    {
      name: "revision-must-advance",
      path: "^revision$",
      operation: "expect_change",
    },
    {
      name: "status-required",
      path: "^status$",
      operation: "expect_exist",
    },
    {
      name: "risk-envelope",
      path: "^risk_score$",
      operation: "range",
      options: { start: 0, end: 10 },
    },
  ],
};

export const demoScenarios: DemoScenario[] = [
  {
    id: "reconciliation",
    label: "Order reconciliation",
    description:
      "Identity matching, normalization, tolerance, expectations, and range checks.",
    before: {
      generated_at: "2026-08-16T09:00:00Z",
      revision: 7,
      status: "ready",
      legacy_code: "manual-review",
      risk_score: 3,
      orders: [
        {
          id: "A-100",
          customer: " Acme   Corp ",
          amount: 100,
          state: "pending",
        },
        { id: "B-200", customer: "Beta", amount: 49.99, state: "pending" },
      ],
    },
    after: {
      generated_at: "2026-08-17T09:00:00Z",
      revision: 8,
      status: "ready",
      reviewed_by: "policy-engine",
      risk_score: 12,
      orders: [
        { id: "B-200", customer: " beta ", amount: 50.1, state: "paid" },
        { id: "A-100", customer: "acme corp", amount: 100.2, state: "pending" },
        { id: "C-300", customer: "Gamma", amount: 75, state: "new" },
      ],
    },
    policy: reconciliationPolicy,
  },
  {
    id: "api-contract",
    label: "API contract",
    description:
      "Ignore request IDs while enforcing required fields and a version change.",
    before: {
      request_id: "req-old",
      api_version: 3,
      payload: { account_id: "acc-7", enabled: false, region: "eu-west" },
    },
    after: {
      request_id: "req-new",
      api_version: 4,
      payload: { enabled: true, region: "eu-west" },
    },
    policy: {
      version: 1,
      name: "api-contract",
      rules: [
        {
          name: "request-id-is-volatile",
          path: "^request_id$",
          operation: "ignore",
        },
        {
          name: "version-must-change",
          path: "^api_version$",
          operation: "expect_change",
        },
        {
          name: "account-id-required",
          path: "^payload->account_id$",
          operation: "expect_exist",
        },
      ],
    },
  },
  {
    id: "semantic-equality",
    label: "Semantic equality",
    description: "A noisy raw diff collapses to zero business changes.",
    before: {
      exported_at: "yesterday",
      tags: ["featured", "sale"],
      product: { sku: "SKU-7", label: "  RED   Shirt ", price: 19.99 },
    },
    after: {
      exported_at: "today",
      tags: ["sale", "featured"],
      product: { sku: "SKU-7", label: "red shirt", price: 20.01 },
    },
    policy: {
      version: 1,
      name: "catalog-export",
      rules: [
        {
          name: "ignore-export-time",
          path: "^exported_at$",
          operation: "ignore",
        },
        { name: "tags-are-a-set", path: "^tags$", operation: "unordered" },
        {
          name: "normalize-label",
          path: "^product->label$",
          operation: "string_normalize",
          options: { trim: true, lowercase: true, collapse_whitespace: true },
        },
        {
          name: "price-rounding",
          path: "^product->price$",
          operation: "numeric_tolerance",
          options: { absolute: 0.03 },
        },
      ],
    },
  },
];
