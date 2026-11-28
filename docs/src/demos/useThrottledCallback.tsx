import { useState } from "react";
import { useThrottledCallback } from "react-honey-hooks";

/** A draft saved at most once a second while you type, without waiting for you to stop. */
export default function UseThrottledCallbackDemo() {
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");
  // Stands in for a request to your server.
  const save = useThrottledCallback((text: string) => {
    setSaved(text);
  }, 1000);

  return (
    <div>
      <textarea
        aria-label="Draft"
        rows={3}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          save(event.target.value);
        }}
      />
      <p className="margin-top--sm">Last saved:</p>
      <blockquote>
        <p role="status">{saved || "Nothing saved yet"}</p>
      </blockquote>
    </div>
  );
}
