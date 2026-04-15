import { useObservable, useTimeAgo } from "@usels/core";
import { DemoPanel, DemoShell, ValueToken, demoClasses } from "@demos/_shared";

const INITIAL_TIME = Date.now();

export default function UseTimeAgoDemo() {
  const slider$ = useObservable(0);
  const targetTime$ = useObservable(INITIAL_TIME);

  const timeAgo$ = useTimeAgo(targetTime$);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    slider$.set(val);
    targetTime$.set(Date.now() + val ** 3);
  };

  return (
    <DemoShell eyebrow="Timer">
      <DemoPanel
        title="Time Ago"
        description="Drag the slider to shift time offset."
        aside={<ValueToken>{timeAgo$.get()}</ValueToken>}
      >
        <input
          type="range"
          min={-3800}
          max={3800}
          value={slider$.get()}
          onChange={handleChange}
          className={demoClasses.slider}
        />
        <p className="m-0 text-center text-xs text-(--sl-color-gray-3)">
          {slider$.get() ** 3}ms
        </p>
      </DemoPanel>
    </DemoShell>
  );
}
