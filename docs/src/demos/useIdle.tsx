import { useIdle } from "react-honey-hooks";

/** Asks "are you still there?" after 3 seconds without any mouse, keyboard or touch activity. */
export default function UseIdleDemo() {
  const idle = useIdle(3000);

  return (
    <div>
      <span role="status" className={`badge ${idle ? "badge--secondary" : "badge--success"}`}>
        {idle ? "Away" : "Active"}
      </span>
      {idle ? (
        <div className="alert alert--info margin-top--sm">
          <strong>Are you still there?</strong> Move the mouse or press a key.
        </div>
      ) : (
        <p className="margin-top--sm">Keep your hands off the mouse and keyboard for 3 seconds.</p>
      )}
    </div>
  );
}
