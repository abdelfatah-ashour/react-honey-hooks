import { useState } from "react";
import { useCountdown } from "react-honey-hooks";

/** A two-second flash sale that counts down to its end once started. */
export default function UseCountdownDemo() {
  // No end time until the sale starts, so the server and the browser render the same thing.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const { seconds, isExpired } = useCountdown(endsAt ?? 0);

  let label = "No sale running";
  if (endsAt !== null) label = isExpired ? "Sale over" : `Ends in ${String(seconds)}s`;

  return (
    <div>
      <p role="timer">{label}</p>
      <button
        type="button"
        className="button button--secondary"
        onClick={() => {
          setEndsAt(Date.now() + 2000);
        }}
      >
        Start flash sale
      </button>
    </div>
  );
}
