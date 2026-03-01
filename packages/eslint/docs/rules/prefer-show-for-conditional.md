# prefer-show-for-conditional

Prefer `<Show>` component over inline `&&` / `||` / ternary with observable conditions in JSX.

## Rule Details

When an observable is used as the condition in a JSX `&&`, `||`, or ternary expression, the entire parent component re-renders each time the observable changes. Legend-State's `<Show>` component accepts the observable directly and only re-renders the conditional content — not the parent.

### Incorrect

```tsx
// ❌ Direct observable as condition
{isVisible$ && <Modal />}

// ❌ .get() call as condition
{isLoading$.get() && <Spinner />}

// ❌ .peek() call as condition
{isActive$.peek() && <Panel />}

// ❌ Observable || JSXElement
{error$ || <Fallback />}

// ❌ Observable ternary (JSX on either branch)
{isLoading$.get() ? <Spinner /> : <Content />}
{isLoading$.get() ? <Spinner /> : null}
{isLoading$.get() ? null : <Content />}
{isActive$ ? <A /> : <B />}
```

### Correct

```tsx
// ✅ Only the Show content re-renders
<Show if={isVisible$}><Modal /></Show>

// ✅ Show handles else branch too
<Show if={isLoading$} else={<Content />}><Spinner /></Show>

// ✅ Auto from @usels/core
<Auto if={isVisible$}><Modal /></Auto>
```

## Not Flagged

These patterns are **not flagged** — by design or as known limitations:

```tsx
// ✅ Not flagged — non-observable condition (no $ suffix)
{isVisible && <Modal />}
{count > 0 && <span>items</span>}

// ✅ Not flagged — observable condition but branch is a string (requireJsxBranch: true)
{isLoading$ && 'Loading...'}
{isActive$ ? 'yes' : 'no'}

// ✅ Not flagged — JSX attribute value (cannot use <Show> here)
<Button disabled={isDisabled$ && someCondition} />
<Component className={isActive$ ? 'active' : 'inactive'} />
<Tooltip content={isVisible$ && <TooltipBody />} />

// ✅ Not flagged — nullish coalescing (v1 exclusion)
{value$ ?? <Fallback />}

// ✅ Not flagged — already inside <Show> or <Auto>
<Show if={isVisible$}>
  {isActive$ && <div>active</div>}  {/* suppressed */}
</Show>
```

### Known Limitations

The condition check only matches **direct observable expressions**. Complex comparisons that wrap a `.get()` call are not detected:

```tsx
// ⚠️ Not flagged by this rule — complex condition (BinaryExpression)
// Still bad practice: parent re-renders when count$ changes
{count$.get() > 0 && <Badge />}
{items$.get().length > 0 && <List />}
```

These patterns cause the same whole-component re-render issue but are excluded to minimize false positives. Consider using `<Show>` manually for these cases:

```tsx
// ✅ Preferred
<Show if={() => count$.get() > 0}><Badge /></Show>
```

## Options

```ts
{
  "use-legend/prefer-show-for-conditional": ["warn", {
    "showComponents": ["Show", "Auto"],
    "requireJsxBranch": true
  }]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showComponents` | `string[]` | `["Show", "Auto"]` | Component names considered as `<Show>` equivalents (suppresses warning inside them). |
| `showImportSources` | `string[]` | `["@legendapp/state/react", "@usels/core"]` | Import sources for `showComponents` (currently informational). |
| `requireJsxBranch` | `boolean` | `true` | Only flag when at least one branch is a JSX element or fragment. Set to `false` to also warn when branches are strings/numbers. |

## Related Rules

- [`no-observable-in-jsx`](./no-observable-in-jsx.md) — Catches raw `{obs$}` without `.get()` (overlaps with `{obs$ && <A />}` pattern).
- [`prefer-for-component`](./prefer-for-component.md) — Fine-grained alternative for list rendering.
- [`no-reactive-hoc`](./no-reactive-hoc.md) — Discourages whole-component reactive wrappers.
- [`observable-naming`](./observable-naming.md) — Accuracy is highest when this rule is active.
