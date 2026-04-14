import React from "react";
import { getCurrentScope } from "./effectScope";

/**
 * Must be called inside a `useScope` factory (during first mount).
 *
 * - On the first mount run, the active scope records the Context ref and
 *   calls `React.useContext(ctx)` inline (legal — during component render).
 * - On every subsequent render, `useScope` replays `React.useContext(ctx)` in
 *   the same order so React subscribes the component to Context updates.
 *
 * Returns the raw Context value. When the provided value is an Observable
 * (idiomatic for `createProvider`), reactivity flows through that reference.
 */
export function inject<T>(ctx: React.Context<T>): T {
  const scope = getCurrentScope();
  if (!scope || !scope._injectRecording) {
    throw new Error("inject() must be called inside useScope factory (during first mount)");
  }
  scope._recordedCtxs.push(ctx);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return React.useContext(ctx);
}
