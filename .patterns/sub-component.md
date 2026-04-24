# Sub-Component Pattern

A sub-component is a **readings panel** within a component group. It tracks a specific set of lab values over time, displays the latest reading with clinical classifications, and maintains a history table.

## Reference: `components/nephrology/anemia.tsx`, `cardio-metabolic.tsx`, `phospho-calcic.tsx`

## File Location

```
components/{group-name}/{sub-component-name}.tsx
```

## Component Template

```tsx
/**
 * {Title} — {Description}.
 * @props data? — {Reading}[], onData? — callback on change
 */
"use client";

import { useState } from "react";
import type { {Reading} } from "./types/interfaces";
import { classifyFn1, classifyFn2 } from "./lib";
import {
  useSyncedReadings, ValueGrid, useAddForm, AddFormTrigger,
  AddForm, HistoryTable, V, useContainerNarrow, ViewToggle,
} from "./ui-helpers";

// ── Props ──
export interface {Name}Props {
  data?: {Reading}[];
  onData?: (data: {Reading}[]) => void;
  // Optional context from evaluator:
  // gfrCategory?: string;
  // sex?: string;
}

// ── Constants ──
const N = { label: "", severity: "normal" as const };  // neutral classification

const FIELDS = [
  ["Label (unit)", "fieldKey", "placeholder"],
  ["Label (unit)", "fieldKey", "placeholder"],
  // ... all input fields
] as const;

type FK = (typeof FIELDS)[number][1];
const EMPTY: Record<FK, string> = { fieldKey: "", /* ... */ };

// ── Component ──
export default function {Name}({ data, onData }: {Name}Props) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [form, setForm] = useState({ ...EMPTY });
  const addForm = useAddForm();
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    add({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      ...form,
    });
    setForm({ ...EMPTY });
  };

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        {/* Header */}
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">{Title}</h3>
          <div className="flex items-center gap-1">
            {isNarrow && readings.length > 0 && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!addForm.adding && <AddFormTrigger onClick={addForm.open} />}
          </div>
        </div>

        {/* Content: latest values + history */}
        {latest ? (
          <div className={isNarrow ? "" : "flex flex-row gap-3"}>
            {/* Left: Latest values */}
            {(!isNarrow || view === "latest") && (
              <div className="shrink-0">
                <ValueGrid items={[
                  { label: "Label", value: latest.field, unit: "unit", cls: classifyFn(latest.field) },
                  // ... all display fields
                ]} />
                {/* Optional: clinical decision badges below ValueGrid */}
              </div>
            )}

            {/* Right: History table */}
            {readings.length > 0 && (!isNarrow || view === "history") && (
              <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                {!isNarrow && <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History</h3>}
                <HistoryTable readings={readings} onRemove={remove} cols={[
                  { label: "Col", render: (r) => <V v={r.field} s={classifyFn(r.field).severity} /> },
                  // ... history columns
                ]} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">No {title} readings.</div>
        )}
      </div>

      {/* Add form (renders outside the main card) */}
      {addForm.adding && (
        <AddForm
          title="Add {title} reading"
          fields={FIELDS}
          form={form}
          setForm={setForm}
          onAdd={handleAdd}
          canAdd={!!form.requiredField}
          onClose={addForm.close}
          gridCols="grid-cols-2 sm:grid-cols-3"  // or "grid-cols-2 sm:grid-cols-4"
        >
          {/* Optional: extra form fields (e.g., sex selector) */}
        </AddForm>
      )}
    </div>
  );
}
```

## Key Patterns

### FIELDS constant
- Tuple array: `[label, key, placeholder]`
- Drives both the `AddForm` inputs and the `EMPTY` record
- Use `as const` for type inference of keys

### useSyncedReadings hook
- Manages bidirectional sync between `data` prop and internal state
- Returns `{ readings, add, remove }`
- Prevents echo loops with `prevRef` + JSON stringify comparison

### ValueGrid
- Displays latest reading as a label/value/badge grid
- Each item: `{ label, value, unit, cls: { label, severity } }`
- Use `N` constant for fields without classification

### Clinical Decision Badges
- Placed after `ValueGrid` as `div` blocks with severity classes
- Pattern: `<span className="font-medium">Label: </span>` + conditional text
- Example: iron supplementation indicator, statin suggestion, ESA eligibility

### HistoryTable
- Columns defined as `{ label, render }` array
- Render uses `<V v={value} s={severity} />` for classified values
- Use `<span className="opacity-70">{value || "—"}</span>` for unclassified values

### Responsive Layout
- Wide: latest (left, `shrink-0`) + history (right, `flex-1 min-w-0`) with `border-l` divider
- Narrow: toggle between latest and history via `ViewToggle`
- `useContainerNarrow(480)` — threshold defaults to 480px

### AddForm
- Renders **outside** the main bordered card (in a separate `div`)
- `canAdd` — boolean for enabling the save button (at least one required field filled)
- `gridCols` — controls form layout grid
- Supports `children` for extra fields not in `FIELDS`
