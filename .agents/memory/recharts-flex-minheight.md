---
name: Recharts -1 height in flex containers
description: ResponsiveContainer with height="100%" inside a flex-1 div fires a -1 width/height warning on first render before layout is computed.
---

# Recharts -1 height in flex-1 containers

## The rule
Any `ResponsiveContainer height="100%"` inside a `flex-1` div must have a `style={{ minHeight: 'NNNpx' }}` on the wrapper div, AND `min-h-0` to prevent overflow.

**Why:** On first render, the browser has not yet computed the flex layout. Recharts reads the container dimensions immediately and gets -1, triggering the warning. A `minHeight` ensures Recharts always sees a valid non-zero height regardless of layout state.

**How to apply:**
```jsx
<div className="flex-1 min-h-0 text-xs" style={{ minHeight: '200px' }}>
  <ResponsiveContainer width="100%" height="100%">
    ...
  </ResponsiveContainer>
</div>
```
Alternatively, use an explicit pixel `height={280}` on `ResponsiveContainer` directly (bypasses the DOM measurement entirely).
