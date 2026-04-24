# Standalone Component Pattern

A standalone component is a **self-contained** medical calculator/monitor that doesn't belong to a group. It lives in its own folder with its own lib/types.

## Reference: `components/bmi/`, `components/pafi/`, `components/water-balance/`

## File Structure

```
components/{slug}/
  {slug}-calculator.tsx    ← or {slug}-monitor.tsx, {slug}.tsx
  lib.ts                   ← Pure calculation functions
  types/                   ← (optional, can inline types)
    interfaces.ts
```

## Props Pattern

Simple standalone components may have no props or minimal props:

```tsx
export default function Calculator() { ... }
```

Or with data/onData:

```tsx
export interface {Name}Props {
  data?: {DataType};
  onData?: (data: {DataType}) => void;
}
export default function {Name}({ data, onData }: {Name}Props) { ... }
```

## State Pattern

Uses `useState` for local form state with `isEditMode` toggle:
- Display mode: show calculated results (click to edit)
- Edit mode: show input fields with Check/X buttons

## Registration

Add to `dependencies` in `index.js`:
```js
"{slug}": "",
```

No group or subComponent entry needed.
