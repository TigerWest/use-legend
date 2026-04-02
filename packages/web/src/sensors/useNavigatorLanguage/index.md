---
title: useNavigatorLanguage
description: "Reactively tracks the browser's preferred language via `navigator.language`. Automatically updates when the user changes their language preference."
category: Sensors
sidebar:
  order: 10
---

## Demo

## Usage

```tsx twoslash
// @noErrors
import { useNavigatorLanguage } from "@usels/web";

function LanguageDisplay() {
  const { isSupported$, language$ } = useNavigatorLanguage();

  return (
    <div>
      <p>Supported: {isSupported$.get() ? "Yes" : "No"}</p>
      <p>Language: {language$.get()}</p>
    </div>
  );
}
```
