import { useRef, useState } from "react";
import { useLongPress } from "react-honey-hooks";

type Status = "idle" | "tooSoon" | "deleted";

const MESSAGES: Record<Status, string> = {
  idle: "Hold the button to delete the draft.",
  tooSoon: "Keep holding to delete.",
  deleted: "Draft deleted.",
};

/** Hold-to-delete: a quick click only explains, so a slip can't delete the draft. */
export default function UseLongPressDemo() {
  const [status, setStatus] = useState<Status>("idle");
  const buttonRef = useRef<HTMLButtonElement>(null);
  useLongPress(
    buttonRef,
    () => {
      setStatus("deleted");
    },
    { delayMs: 600, enabled: status !== "deleted" },
  );

  return (
    <div>
      <p role="status">{MESSAGES[status]}</p>
      <div className="button-group">
        <button
          ref={buttonRef}
          type="button"
          className="button button--danger"
          disabled={status === "deleted"}
          onClick={() => {
            setStatus("tooSoon");
          }}
        >
          Hold to delete
        </button>
        <button
          type="button"
          className="button button--outline button--secondary"
          disabled={status !== "deleted"}
          onClick={() => {
            setStatus("idle");
          }}
        >
          Restore
        </button>
      </div>
    </div>
  );
}
