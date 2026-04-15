# get

> Part of `@usels/core` | Category: Utilities

## Overview

Extract values from MaybeObservable types

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

## Type Declarations

```typescript
export declare function get<T>(v: {
    get(): T;
}): T;
export declare function get<T extends object>(v: DeepMaybeObservable<T>): T;
export declare function get<T extends object>(v: DeepMaybeObservable<T> | undefined): T | undefined;
export declare function get<T>(maybeObservable: MaybeObservable<T>): T;
export declare function get<T>(maybeObservable: MaybeObservable<T> | undefined): T | undefined;
export declare function get<T, K extends keyof T>(maybeObservable: MaybeObservable<T>, key: K): T[K] | undefined;
```

## Source

- Implementation: `packages/core/src/utilities/get/index.ts`
- Documentation: `packages/core/src/utilities/get/index.md`