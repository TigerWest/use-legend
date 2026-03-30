import { useObservable, useObserveEffect } from "@legendapp/state/react";
import { usePointerLock, useMouse } from "@usels/web";
import { DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function Demo() {
  const { isSupported$, element$, lock, unlock } = usePointerLock();
  const { x$, y$ } = useMouse({ type: "movement" });

  const rotX$ = useObservable(0);
  const rotY$ = useObservable(0);

  // Accumulate rotation delta while locked
  useObserveEffect(() => {
    const dx = x$.get();
    const dy = y$.get();
    if (!element$.get()) return;
    rotX$.set(rotX$.peek() + dy * 0.4);
    rotY$.set(rotY$.peek() + dx * 0.4);
  });

  // Unlock on mouse button release
  useObserveEffect((e) => {
    if (!element$.get()) return;
    const onMouseUp = () => unlock();
    document.addEventListener("mouseup", onMouseUp);
    e.onCleanup = () => document.removeEventListener("mouseup", onMouseUp);
  });

  // Reset rotation when unlocked
  useObserveEffect(() => {
    if (!element$.get()) {
      rotX$.set(0);
      rotY$.set(0);
    }
  });

  const isLocked$ = useObservable(() => !!element$.get());

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Pointer Lock"
        description="Click the card to lock the pointer, then move your mouse to rotate it. Press Escape to release."
        aside={
          <StatusBadge
            label={!isSupported$.get() ? "Not Supported" : isLocked$.get() ? "Locked" : "Unlocked"}
            tone={!isSupported$.get() ? "orange" : isLocked$.get() ? "green" : "neutral"}
          />
        }
      >
        <div className="flex justify-center py-4" style={{ perspective: "600px" }}>
          <div
            onMouseDown={(e) => lock(e.nativeEvent)}
            style={{
              transform: `rotateX(${rotX$.get()}deg) rotateY(${rotY$.get()}deg)`,
              transition: isLocked$.get() ? "none" : "transform 0.6s ease",
              cursor: isLocked$.get() ? "none" : "pointer",
            }}
            className="flex h-36 w-64 flex-col items-center justify-center gap-2 rounded-2xl bg-linear-to-br from-(--sl-color-accent) to-(--sl-color-accent-high) text-white shadow-lg select-none"
          >
            <span className="text-3xl">{isLocked$.get() ? "🔒" : "🖱️"}</span>
            <span className="text-sm font-semibold">
              {isLocked$.get() ? "Move your mouse" : "Click to drag"}
            </span>
            {isLocked$.get() && <span className="text-xs opacity-70">Press Escape to release</span>}
          </div>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
