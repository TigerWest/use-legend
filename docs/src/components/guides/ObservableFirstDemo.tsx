import { useIntervalFn, useObservable } from "@usels/core";
import { useRef, useState } from "react";

const CARD_BASE_CLASS =
  "m-0 flex min-w-[15rem] flex-col gap-2 rounded-[10px] border bg-sl-bg p-3.5";
const CARD_META_CLASS = "text-sm text-sl-text-accent";

function useRenderCount() {
  const renders = useRef(0);
  renders.current += 1;
  return renders.current;
}

function StateDrivenCard() {
  const [count, setCount] = useState(1);
  const renderCount = useRenderCount();

  useIntervalFn(() => {
    setCount((v) => v + 1);
  }, 500);

  return (
    <div className={`${CARD_BASE_CLASS} border-orange-300`}>
      <h5 className="m-0">Normal</h5>
      <div className={CARD_META_CLASS}>
        Renders: <strong>{renderCount}</strong> (state-based card)
      </div>
      <div className="text-lg font-bold">Count: {count}</div>
    </div>
  );
}

function ObservableDrivenCard() {
  const count$ = useObservable(1);
  const renderCount = useRenderCount();

  useIntervalFn(() => {
    count$.set((v) => v + 1);
  }, 500);

  return (
    <div className={`${CARD_BASE_CLASS} border-green-300`}>
      <h5 className="m-0">Fine-grained</h5>
      <div className={CARD_META_CLASS}>
        Renders: <strong>{renderCount}</strong> (observable-based card)
      </div>
      <div className="text-lg font-bold">Count: {count$.get()}</div>
    </div>
  );
}

export default function ObservableFirstDemo() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-3">
      <StateDrivenCard />
      <ObservableDrivenCard />
    </div>
  );
}
