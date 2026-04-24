# Component Group Pattern

A **component group** is a medical specialty domain (e.g., nephrology, diabetes) that contains:
1. An **evaluator** (parent component with patient-level state) — lives in its own folder
2. **Sub-components** (readings panels) — live in a shared group folder
3. Shared **UI helpers** reused across sub-components
4. Shared **lib functions** for clinical calculations
5. Shared **type definitions**

## Reference: Nephrology Group

```
components/
  ckd/                          ← Evaluator (parent)
    ckd-evaluator.tsx           ← Main evaluator component
    lib.ts                      ← CKD-specific calculations (eGFR, KFRE, staging)
    types/
      ckd.ts                    ← CKDReading, CKDPatientData, CKDProps
  nephrology/                   ← Sub-components (group folder)
    anemia.tsx                  ← Sub-component: anemia monitoring
    cardio-metabolic.tsx        ← Sub-component: lipids, HbA1c, BP
    phospho-calcic.tsx          ← Sub-component: Ca, P, PTH, Vit D
    lib.ts                      ← Group-shared calculations
    ui-helpers.tsx              ← Shared UI primitives for the group
    types/
      interfaces.ts             ← Reading interfaces for each sub-component
```

## Creating a New Component Group

### Step 1: Plan the domain

Identify:
- **Evaluator name** — the parent component (e.g., `DiabetesEvaluator`)
- **Evaluator folder** — `components/{evaluator-slug}/` (e.g., `components/diabetes/`)
- **Group folder** — `components/{group-name}/` (e.g., `components/endocrine/`)
- **Sub-components** — individual monitoring panels within the group
- **Patient-level data** — demographics + comorbidities the evaluator tracks
- **Reading types** — what lab readings each sub-component tracks

### Step 2: Create the evaluator folder

```
components/{evaluator-slug}/
  {evaluator-slug}-evaluator.tsx   ← or {name}.tsx
  lib.ts                           ← Domain-specific pure calculation functions
  types/
    {evaluator-slug}.ts            ← Type definitions
```

See `evaluator.md` for the evaluator component pattern.

### Step 3: Create the group folder

```
components/{group-name}/
  {sub-component-1}.tsx
  {sub-component-2}.tsx
  lib.ts                           ← Shared classification functions
  ui-helpers.tsx                   ← Copy from nephrology/ui-helpers.tsx (reusable)
  types/
    interfaces.ts                  ← Reading interfaces
```

See `sub-component.md` for the sub-component pattern.

### Step 4: Register in CLI (`index.js`)

See `cli-registry.md`.

### Step 5: Add to playground (`playground/src/App.tsx`)

```tsx
import NewEvaluator from "@/components/{evaluator-slug}/{evaluator-slug}-evaluator"
import SubComp1 from "@/components/{group-name}/{sub-component-1}"
import SubComp2 from "@/components/{group-name}/{sub-component-2}"

// Add to components array:
{ name: "New Evaluator", el: <NewEvaluator onData={() => {}} /> },
{ name: "Group: Sub-Comp 1", el: <SubComp1 onData={() => {}} /> },
{ name: "Group: Sub-Comp 2", el: <SubComp2 onData={() => {}} /> },
```

## Data Flow

```
Evaluator (patient-level state: age, sex, comorbidities, readings[])
  ├── onData callback → emits full patient data upstream
  ├── Sub-component 1 (data={readings}, onData={handler}, gfrCategory={...})
  ├── Sub-component 2 (data={readings}, onData={handler}, sex={...})
  └── Sub-component 3 (data={readings}, onData={handler})
```

- Evaluator owns **patient-level state** (demographics, comorbidities, main readings)
- Sub-components own **their own reading arrays** via `useSyncedReadings`
- Evaluator passes context props (age, sex, gfrCategory, comorbidity flags) down to sub-components
- Sub-components fire `onData` callbacks when readings change
