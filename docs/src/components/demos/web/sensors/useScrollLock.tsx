"use client";
import { useScrollLock } from "@usels/web";
import { ActionButton, DemoShell, DemoPanel, StatusBadge, demoClasses } from "../../_shared";

function ScrollLockDemo() {
  const { isLocked$, toggle } = useScrollLock();

  return (
    <>
      <div className={demoClasses.valueRow}>
        <StatusBadge
          label={isLocked$.get() ? "Locked" : "Unlocked"}
          tone={isLocked$.get() ? "orange" : "green"}
        />
      </div>
      <div className={demoClasses.actionRow}>
        <ActionButton onClick={toggle} tone="accent" grow>
          {isLocked$.get() ? "Unlock scroll" : "Lock scroll"}
        </ActionButton>
      </div>
    </>
  );
}

export default function UseScrollLockDemo() {
  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="useScrollLock"
        description="Lock and unlock page scrolling. Try scrolling the page after locking."
      >
        <ScrollLockDemo />
      </DemoPanel>
    </DemoShell>
  );
}
