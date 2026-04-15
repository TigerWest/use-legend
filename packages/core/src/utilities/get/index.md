---
title: get
description: Extract values from MaybeObservable types
category: Utilities
sidebar:
  order: 0
---

Extract raw values from `MaybeObservable` types (works with both raw values and Legend-State observables).

## Usage

```typescript
import { get, observable } from "@usels/core";

// With raw values
const rawValue = { name: "John", age: 30 };
console.log(get(rawValue)); // { name: 'John', age: 30 }
console.log(get(rawValue, "name")); // 'John'

// With observables
const obs$ = observable({ name: "John", age: 30 });
console.log(get(obs$)); // { name: 'John', age: 30 }
console.log(get(obs$, "name")); // 'John'
```
