# Lib Functions Pattern

Each component group has a `lib.ts` with **pure calculation and classification functions**. No React, no side effects.

## Reference: `components/nephrology/lib.ts`, `components/ckd/lib.ts`

## File Location

- Evaluator-specific: `components/{evaluator-slug}/lib.ts`
- Group-shared: `components/{group-name}/lib.ts`

## Safe Parse Helper

Every lib starts with a safe float parser:

```ts
const sf = (v: string): number => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};
```

Or the longer form:
```ts
const safeParseFloat = (value: any): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};
```

## Classification Function Pattern

All classification functions return `{ label: string; severity: "normal" | "warning" | "critical" }`.

```ts
export function classifyParameter(value: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(value);
  if (v === 0) return { label: "—", severity: "normal" };  // empty/invalid → dash, normal
  if (v < LOW_THRESHOLD) return { label: "Low label", severity: "warning" };
  if (v > HIGH_THRESHOLD) return { label: "High label", severity: "critical" };
  return { label: "Normal", severity: "normal" };
}
```

### Rules
- **Empty/zero always returns `{ label: "—", severity: "normal" }`** — never error for missing data
- **Return type is always the same shape** — `{ label: string; severity: Severity }`
- **Severity is a 3-level enum**: `"normal"`, `"warning"`, `"critical"`
- **Functions are pure** — no side effects, no state
- **All inputs are strings** (lab values come from form inputs)
- **Optional context parameters** (e.g., `gfrCategory?`, `sex?`) for stage-dependent thresholds

## Calculation Function Pattern

```ts
export function calculateDerivedValue(
  input1: string,
  input2: string,
): number | null {
  const v1 = sf(input1);
  const v2 = sf(input2);
  if (v1 === 0 || v2 === 0) return null;  // null when inputs missing
  return Math.round(result * 10) / 10;     // round to 1 decimal
}
```

## Recommendation Function Pattern

For clinical decision support:

```ts
export function getRecommendation(
  parameter: string,
  context?: string,
): { status: string; recommendation: string } {
  const v = sf(parameter);
  if (v === 0) return { status: "unknown", recommendation: "" };
  // ... clinical logic
  return { status: "high", recommendation: "Clinical action text" };
}
```

## Eligibility / Boolean Assessment Pattern

```ts
export function checkEligibility(
  param1: string,
  param2: string,
  flag: boolean,
): { eligible: boolean; grade: string } {
  // ... clinical criteria
  if (meetsAllCriteria) return { eligible: true, grade: "1A" };
  return { eligible: false, grade: "" };
}
```

## Organization

Group calculations by clinical domain using section headers:

```ts
// ═══════════════════════════════════════════════════════════════════
// SECTION NAME
// ═══════════════════════════════════════════════════════════════════
```

Or for evaluator libs:

```ts
// ─── Section Name ─────────────────────────────────────────────────
```

## JSDoc

Use JSDoc for non-obvious calculations:
```ts
/** CKD-EPI 2021 race-free equation. Formula: ... */
export const calculateEGFR = (...) => { ... };
```
