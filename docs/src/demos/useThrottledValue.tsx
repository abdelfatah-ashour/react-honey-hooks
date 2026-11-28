import { useState } from "react";
import { useThrottledValue } from "react-honey-hooks";

/** A live preview that redraws at most twice a second, however fast you type. */
export default function UseThrottledValueDemo() {
  const [message, setMessage] = useState("");
  const preview = useThrottledValue(message, 500);

  return (
    <div>
      <textarea
        aria-label="Message"
        rows={3}
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
        }}
      />
      <p className="margin-top--sm">Preview, updated at most every 0.5 s:</p>
      <blockquote>
        <p role="status">{preview || "Nothing to preview"}</p>
      </blockquote>
    </div>
  );
}
