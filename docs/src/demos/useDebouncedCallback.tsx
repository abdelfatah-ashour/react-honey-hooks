import { useState } from "react";
import { useDebouncedCallback } from "react-honey-hooks";

/** A note that autosaves once typing pauses for a second, or at once with Save now. */
export default function UseDebouncedCallbackDemo() {
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  // Stands in for a request to your server.
  const saveSoon = useDebouncedCallback((text: string) => {
    setSavedNote(text);
  }, 1000);

  return (
    <div>
      <textarea
        aria-label="Note"
        rows={3}
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          saveSoon(event.target.value);
        }}
      />
      <p role="status">{note === savedNote ? "All changes saved" : "Unsaved changes"}</p>
      <button
        type="button"
        className="button button--secondary button--sm"
        onClick={saveSoon.flush}
      >
        Save now
      </button>
    </div>
  );
}
