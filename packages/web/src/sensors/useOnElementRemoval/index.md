---
title: useOnElementRemoval
category: Sensors
sidebar:
  order: 6
---

Fires a callback when the target element or any ancestor containing it is removed from the DOM. Uses [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) internally.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useOnElementRemoval } from "@usels/web";
import { useRef, useState } from "react";

function RemovalDetector() {
  const ref = useRef<HTMLDivElement>(null);
  const [removed, setRemoved] = useState(false);

  useOnElementRemoval(
    () => ref.current,
    () => setRemoved(true)
  );

  return (
    <div>
      {!removed && <div ref={ref}>Watch me!</div>}
      {removed && <p>Element was removed!</p>}
    </div>
  );
}
```
