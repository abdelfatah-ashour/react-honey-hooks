import { useRef, useState } from "react";
import { useFocusTrap, useHotkey } from "react-honey-hooks";

/** A rename dialog that keeps Tab inside it while open, then hands focus back to its opener. */
export default function UseFocusTrapDemo() {
  const [fileName, setFileName] = useState("notes.txt");
  const [draft, setDraft] = useState<string | null>(null);
  const open = draft !== null;
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  const close = () => {
    setDraft(null);
  };
  useHotkey("Escape", close, { enabled: open, ignoreInputs: false });

  return (
    <div>
      <p>
        File: <code>{fileName}</code>{" "}
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => {
            setDraft(fileName);
          }}
        >
          Rename file
        </button>
      </p>
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-label="Rename"
          className="card shadow--md padding--md"
        >
          <input
            aria-label="File name"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
          />
          <div className="button-group margin-top--sm">
            <button type="button" className="button button--sm button--secondary" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="button button--sm button--primary"
              onClick={() => {
                setFileName(draft.trim() || fileName);
                close();
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
