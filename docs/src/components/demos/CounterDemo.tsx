import { useInterval } from "@usels/core";
import { useObserve } from "@legendapp/state/react";
import { useRef } from "react";

export default function TimerWidget() {
  const count$ = useInterval(1000);
  const renderCount = useRef(0);
  renderCount.current++;

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5  md:px-5 md:py-4 backdrop-blur-sm">
      <div
        className="font-mono text-[32px] md:text-[44px] font-black leading-none text-white"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {count$.get()}
        <span className="text-[20px] font-bold text-white/35">s</span>
      </div>
      <div className="text-[11px] font-semibold text-white/30">renders: {renderCount.current}</div>
    </div>
  );
}
