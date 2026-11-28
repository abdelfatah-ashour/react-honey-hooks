import { useEffect, useState } from "react";
import { usePageVisibility } from "react-honey-hooks";

/** A video that pauses while you're on another tab, so its watch time only counts while seen. */
export default function UsePageVisibilityDemo() {
  const visible = usePageVisibility();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => {
      setSeconds((count) => count + 1);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [visible]);

  return (
    <div>
      <span role="status" className="badge badge--primary">
        {visible ? "Playing" : "Paused"}
      </span>
      <p role="timer" className="margin-top--sm">
        Watched for {seconds}s
      </p>
      <p>
        Switch to another tab for a while, then come back: the count paused while you were away.
      </p>
    </div>
  );
}
