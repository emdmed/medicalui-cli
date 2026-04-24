# CLI Registry Pattern

When adding a new component group, update `index.js` in three places.

## Reference: `index.js`

### 1. `dependencies` — register each folder

```js
const dependencies = {
  // ... existing entries
  "{evaluator-slug}": "",          // e.g., "diabetes": ""
  "{group-name}": "",              // e.g., "endocrine": ""
};
```

Value is npm dependency string (empty string if none beyond shadcn).

### 2. `groups` — register the group mapping

```js
const groups = {
  // ... existing entries
  "{group-name}": ["{evaluator-slug}", "{group-name}"],
  // e.g., endocrine: ["diabetes", "endocrine"],
};
```

This allows `npx medprotocol-ui add {group-name}` to install both the evaluator folder and the sub-components folder.

### 3. `subComponents` — register sub-component aliases

```js
const subComponents = {
  // ... existing entries
  "{sub-component-1}": "{group-name}",
  "{sub-component-2}": "{group-name}",
  // e.g., "retinopathy": "endocrine",
};
```

This allows `npx medprotocol-ui add {sub-component-name}` to install the parent group folder.

### 4. `categories` — assign medical category tags

```js
const categories = {
  // ... existing entries
  "{component-name}": ["{category-1}", "{category-2}"],
  // e.g., "diabetes": ["endocrine", "internal-medicine"],
};
```

A component can belong to multiple categories. Tags are displayed next to each component in `npx medprotocol-ui list` output. Use lowercase, hyphenated names for categories (e.g., `critical-care`, `internal-medicine`).
