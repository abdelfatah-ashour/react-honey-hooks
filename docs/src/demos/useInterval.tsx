import { useState } from "react";
import { useInterval } from "react-honey-hooks";

/** A stopwatch that ticks every tenth of a second while running. */
export default function UseIntervalDemo() {
  const [tenths, setTenths] = useState(0);
  const [running, setRunning] = useState(false);

  useInterval(
    () => {
      setTenths((t) => t + 1);
    },
    running ? 100 : null,
  );

  return (
    <div>
      <p role="timer">{(tenths / 10).toFixed(1)} s</p>
      <div className="button-group">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            setRunning((r) => !r);
          }}
        >
          {running ? "Stop" : "Start"}
        </button>
        <button
          type="button"
          className="button button--outline button--secondary"
          onClick={() => {
            setTenths(0);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
