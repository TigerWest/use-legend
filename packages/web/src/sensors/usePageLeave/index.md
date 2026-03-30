---
title: usePageLeave
category: Sensors
sidebar:
  order: 10
---

Reactively detects when the mouse cursor leaves the page. Useful for showing exit-intent popups, saving progress, or pausing animations when the user moves their cursor outside the browser viewport.

## Demo

## Usage

```tsx twoslash
// @noErrors
import { usePageLeave } from "@usels/web";

function PageLeaveDetector() {
  const isLeft$ = usePageLeave();

  return (
    <div>
      <p>Mouse left the page: {isLeft$.get() ? "Yes" : "No"}</p>
    </div>
  );
}
```
