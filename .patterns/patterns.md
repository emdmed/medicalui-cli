# MedProtocol UI — Component Patterns

> Binding constraints for all workflows. Violations are treated the same as workflow violations.

## Routing

| Task | Load |
|------|------|
| New component group (e.g., diabetes, hepatology) | `component-group.md` |
| New sub-component within a group | `sub-component.md` |
| New standalone component (single file) | `standalone-component.md` |
| Evaluator / parent component with state | `evaluator.md` |
| Classification / calculation logic | `lib-functions.md` |
| CLI registry (index.js) updates | `cli-registry.md` |

## Global Constraints

- **No `index.ts` / `index.tsx` barrel files** — import from the file directly
- **`"use client"` directive** — required at top of every `.tsx` component file
- **Default exports** — every component uses `export default function ComponentName`
- **Severity system** — use semantic CSS classes: `severity-normal`, `severity-warning`, `severity-critical`, `severity-watch`, `severity-urgent`
- **Severity text** — use `severity-normal-text`, `severity-warning-text`, `severity-critical-text`, `severity-watch-text`
- **UI primitives** — import from `@/components/ui/*` (shadcn): `Button`, `Input`, `Badge`, `Label`, `Separator`, `Checkbox`
- **Icons** — import from `lucide-react`: `Plus`, `Check`, `X`, `Trash2`, etc.
- **Typography** — headings use `text-[11px] font-heading uppercase tracking-widest text-muted-foreground`
- **All lab values are strings** — never use `number` for user-input lab values in interfaces; calculated values (like `egfr`) can be `number`
- **Date format** — ISO string `YYYY-MM-DD` stored as `string`
- **Reading IDs** — use `crypto.randomUUID()` for sub-component readings; `Date.now().toString()` for evaluator readings
