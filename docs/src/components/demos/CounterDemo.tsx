import { observable } from "@legendapp/state";
import { Show, useObservable } from "@legendapp/state/react";
import { createInterval, createRef$, useInterval } from "@usels/core";
import { useEffect, useRef } from "react";
import { cx } from "./_shared";

function HookTimer() {
  const count$ = useInterval(1000);
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <>
      <div
        className="font-mono text-[32px] md:text-[44px] font-black leading-none text-white"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {count$.get()}
        <span className="text-[20px] font-bold text-white/35">s</span>
      </div>
      <div className="text-[11px] font-semibold text-white/30">renders: {renderCount.current}</div>
    </>
  );
}

function ScopeTimer() {
  "use scope";
  const count$ = createInterval(1000);
  const renderCount$ = createRef$(0);
  renderCount$.current++;

  return (
    <>
      <div
        className="font-mono text-[32px] md:text-[44px] font-black leading-none text-white"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {count$.get()}
        <span className="text-[20px] font-bold text-white/35">s</span>
      </div>
      <div className="text-[11px] font-semibold text-white/30">renders: {renderCount$.get()}</div>
    </>
  );
}

export default function TimerWidget() {
  const isHook$ = useObservable(true);

  useEffect(() => {
    const handler = (e: Event) => {
      isHook$.set((e as CustomEvent<{ isHook: boolean }>).detail.isHook);
    };
    window.addEventListener("hero-mode-change", handler);
    return () => window.removeEventListener("hero-mode-change", handler);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 md:px-5 md:py-4 backdrop-blur-sm">
      <Show if={isHook$} else={<ScopeTimer />}>
        <HookTimer />
      </Show>
    </div>
  );
}
