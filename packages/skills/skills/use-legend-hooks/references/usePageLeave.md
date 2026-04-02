# usePageLeave

> Part of `@usels/web` | Category: Sensors

## Overview

Reactively detects when the mouse cursor leaves the page. Useful for showing exit-intent popups, saving progress, or pausing animations when the user moves their cursor outside the browser viewport.

## Usage

```tsx
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

## Type Declarations

```typescript
export type UsePageLeaveOptions = ConfigurableWindow;
export declare function usePageLeave(options?: UsePageLeaveOptions): ReadonlyObservable<boolean>;
```

## Source

- Implementation: `packages/web/src/sensors/usePageLeave/index.ts`
- Documentation: `packages/web/src/sensors/usePageLeave/index.md`