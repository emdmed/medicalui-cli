# Evaluator Component Pattern

An evaluator is the **parent component** for a component group. It manages patient-level state and renders clinical decision support.

## Reference: `components/ckd/ckd-evaluator.tsx`

## File Structure

```
components/{slug}/
  {slug}-evaluator.tsx
  lib.ts
  types/
    {slug}.ts
```

## Type Definitions (`types/{slug}.ts`)

```tsx
/**
 * JSDoc header with key types for consumers.
 */

// Individual reading — labs captured at a point in time
export interface {Name}Reading {
  id: string;
  date: string;           // ISO YYYY-MM-DD

  // Raw lab values (strings)
  labField1: string;      // unit in comment
  labField2: string;      // unit in comment

  // Calculated values (numbers, stored for display)
  calculatedField: number;
  categoryField: string;
}

// Full patient data
export interface {Name}PatientData {
  // Demographics
  age: string;
  sex: string;            // "male" | "female"

  // Comorbidities (booleans for treatment eligibility)
  hasDiabetes: boolean;
  hasHeartFailure: boolean;
  // ... domain-specific flags

  // Readings over time
  readings: {Name}Reading[];
}

// Component props
export interface {Name}Props {
  data?: {Name}PatientData;
  onData?: (data: {Name}PatientData) => void;
}
```

## Component Structure (`{slug}-evaluator.tsx`)

```tsx
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Check, X } from "lucide-react";
import { /* calculation fns */ } from "./lib";
import type { {Name}PatientData, {Name}Reading, {Name}Props } from "./types/{slug}";
import { useContainerNarrow, ViewToggle } from "@/components/{group-folder}/ui-helpers";

const emptyPatient: {Name}PatientData = {
  age: "", sex: "",
  // ... all fields with defaults
  readings: [],
};

const {Name}Evaluator = ({ data, onData }: {Name}Props) => {
  // ── State ──
  const [patientData, setPatientData] = useState<{Name}PatientData>(
    data ?? { ...emptyPatient }
  );
  const [isAddingReading, setIsAddingReading] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");

  // Temp fields for header editing
  const [tempAge, setTempAge] = useState("");
  const [tempSex, setTempSex] = useState("");

  // New reading fields
  const [newField1, setNewField1] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  // ── Data sync ──
  const onDataRef = useRef(onData);
  onDataRef.current = onData;
  const prevDataRef = useRef<string>("");

  // Sync inbound
  useEffect(() => {
    if (!data) return;
    const s = JSON.stringify(data);
    if (s !== prevDataRef.current) {
      prevDataRef.current = s;
      setPatientData(data);
    }
  }, [data]);

  // Emit outbound
  useEffect(() => {
    const s = JSON.stringify(patientData);
    if (s !== prevDataRef.current) {
      prevDataRef.current = s;
      onDataRef.current?.(patientData);
    }
  }, [patientData]);

  // ── Derived values ──
  const latest = patientData.readings[patientData.readings.length - 1];
  // ... compute staging, risk, treatment eligibility from latest + patientData

  // ── Handlers ──
  const saveHeader = () => { /* validate + setPatientData */ };
  const addReading = () => { /* calculate, create reading, append */ };

  // ── Render ──
  return (
    <div className="w-full space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        {/* Header bar */}
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-2 px-2 py-1.5 bg-secondary rounded-t-sm">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-sm">{Title}</span>
          </div>
          <div className="flex items-center gap-1">
            {isNarrow && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!isAddingReading && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAddingReading(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Demographics row (click to edit) */}
        {/* Hero section with staging/classification */}
        {/* Status + History side-by-side layout */}
        {/* Add Reading inline form */}
      </div>
    </div>
  );
};

export default {Name}Evaluator;
```

## Key Patterns

### Data Sync (bidirectional)
- Use `prevDataRef` to prevent echo loops between inbound `data` prop and outbound `onData` callback
- `onDataRef` avoids stale closure issues

### Responsive Layout
- `useContainerNarrow()` from ui-helpers — uses ResizeObserver on the container
- When narrow: show `ViewToggle` for latest/history switching
- When wide: show latest (left) + history (right) side-by-side with `border-l` divider

### Header Editing
- Demographics shown as compact text (`{age}y {sex}`)
- Click toggles to edit mode with inputs + comorbidity checkboxes
- Save/cancel with Check/X icon buttons (h-5 w-5)

### Add Reading Form
- Triggered by Plus button in header bar
- Inline form with grid layout below Separator
- Check (save) + X (cancel) buttons
- Validate before enabling save

### History Table
- Reverse chronological (newest first)
- Sticky headers with `bg-background`
- Alternating row shading: `i % 2 === 1 ? "bg-muted/10" : ""`
- `tabular-nums` for numeric alignment
