# peek

> Part of `@usels/core` | Category: Utilities

## Overview

Extract values from MaybeObservable types without registering a tracking dependency

## Usage

```typescript
import { observable, peek } from "@usels/core";

// With raw values — returned as-is
const rawValue = { name: "John", age: 30 };
console.log(peek(rawValue)); // { name: 'John', age: 30 }
console.log(peek(rawValue, "name")); // 'John'

// With observables — reads without tracking
const obs$ = observable({ name: "John", age: 30 });
console.log(peek(obs$)); // { name: 'John', age: 30 }  — no dep registered
console.log(peek(obs$, "name")); // 'John'                     — no dep registered
```

## Type Declarations

```typescript
export declare function peek<T>(v: {
    peek(): T;
}): T;
export declare function peek<T extends object>(v: DeepMaybeObservable<T>): T;
export declare function peek<T extends object>(v: DeepMaybeObservable<T> | undefined): T | undefined;
export declare function peek<T>(maybeObservable: MaybeObservable<T>): T;
export declare function peek<T>(maybeObservable: MaybeObservable<T> | undefined): T | undefined;
export declare function peek<T, K extends keyof T>(maybeObservable: MaybeObservable<T>, key: K): T[K] | undefined;
```

## Source

- Implementation: `packages/core/src/utilities/peek/index.ts`
- Documentation: `packages/core/src/utilities/peek/index.md`