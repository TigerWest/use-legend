---
title: useParentElement
category: elements
---

Returns the `parentElement` of a target DOM node as a reactive `Observable`.
Re-evaluates whenever the target `El$` or `Observable` changes.
Targets can be `El$`, `Observable<Element|null>`, or a plain `Element`.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useEl$, useParentElement } from '@usels/core'

function Component() {
  const el$ = useEl$<HTMLDivElement>()
  const parent$ = useParentElement(el$)

  return <div ref={el$} />
}
```

### Reading the parent element

Use inside an `observer` component to reactively render based on the parent:

```tsx twoslash
// @noErrors
import { useEl$, useParentElement } from '@usels/core'
import { observer } from '@legendapp/state/react'

const Component = observer(() => {
  const el$ = useEl$<HTMLDivElement>()
  const parent$ = useParentElement(el$)

  return <div ref={el$}>{parent$.get()?.tagName}</div>
})
```

### With an Observable target

```tsx twoslash
// @noErrors
import { observable } from '@legendapp/state'
import { useParentElement } from '@usels/core'

function Component() {
  const target$ = observable<HTMLElement | null>(null)
  const parent$ = useParentElement(target$)
  // ...
}
```

### With a plain element

```tsx twoslash
// @noErrors
import { useParentElement } from '@usels/core'

function Component({ el }: { el: HTMLElement }) {
  const parent$ = useParentElement(el)
  // ...
}
```
