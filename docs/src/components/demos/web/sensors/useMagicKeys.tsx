"use client";
import { useMagicKeys } from "@usels/web";
import { DemoPanel, DemoShell, StatusBadge } from "../../_shared";

export default function Demo() {
  const keys = useMagicKeys();

  const ctrl$ = keys["ctrl"];
  const shift$ = keys["shift"];
  const alt$ = keys["alt"];
  const ctrlA$ = keys["ctrl+a"];
  const ctrlS$ = keys["ctrl+s"];
  const current$ = keys.current$;

  return (
    <DemoShell eyebrow="Sensors">
      <DemoPanel
        title="Magic Keys"
        description="Press keys to see their reactive state change in real-time."
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Modifier Keys</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={`Ctrl: ${ctrl$.get() ? "On" : "Off"}`}
                tone={ctrl$.get() ? "green" : "neutral"}
              />
              <StatusBadge
                label={`Shift: ${shift$.get() ? "On" : "Off"}`}
                tone={shift$.get() ? "green" : "neutral"}
              />
              <StatusBadge
                label={`Alt: ${alt$.get() ? "On" : "Off"}`}
                tone={alt$.get() ? "green" : "neutral"}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Combos</p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={`Ctrl+A: ${ctrlA$.get() ? "On" : "Off"}`}
                tone={ctrlA$.get() ? "green" : "neutral"}
              />
              <StatusBadge
                label={`Ctrl+S: ${ctrlS$.get() ? "On" : "Off"}`}
                tone={ctrlS$.get() ? "green" : "neutral"}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Currently Pressed</p>
            <p className="text-sm text-gray-500 font-mono">
              {[...current$.get()].join(", ") || "(none)"}
            </p>
          </div>
        </div>
      </DemoPanel>
    </DemoShell>
  );
}
