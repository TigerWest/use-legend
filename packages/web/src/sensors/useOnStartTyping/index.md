---
title: useOnStartTyping
description: "Fires a callback when the user starts typing on non-editable elements. Useful for implementing search-on-type or keyboard shortcut activation."
category: Sensors
sidebar:
  order: 1
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useOnStartTyping } from "@usels/web";
import { useRef } from "react";

function SearchOnType() {
  const inputRef = useRef<HTMLInputElement>(null);

  useOnStartTyping(() => {
    inputRef.current?.focus();
  });

  return <input ref={inputRef} placeholder="Start typing anywhere..." />;
}
```
