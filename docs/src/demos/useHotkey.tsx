import { useRef, useState } from "react";
import { useFocusWithin, useHotkey } from "react-honey-hooks";

/** Press ? for a list of shortcuts, Escape to close it; only while this box has focus. */
export default function UseHotkeyDemo() {
  const [open, setOpen] = useState(false);
  // Listen only while the box has focus, so ? and Escape keep working on the rest of the page.
  const boxRef = useRef<HTMLDivElement>(null);
  const focused = useFocusWithin(boxRef);
  useHotkey(
    "?",
    () => {
      setOpen(true);
    },
    { enabled: focused },
  );
  useHotkey(
    "Escape",
    () => {
      setOpen(false);
    },
    { enabled: focused && open },
  );

  return (
    <div ref={boxRef} role="group" aria-label="Shortcut demo" tabIndex={0} className="padding--sm">
      <p role="status">{open ? "Press Escape to close" : "Click here, then press ?"}</p>
      {open && (
        <ul aria-label="Keyboard shortcuts">
          <li>
            <kbd>J</kbd> / <kbd>K</kbd>: next / previous message
          </li>
          <li>
            <kbd>E</kbd>: archive
          </li>
        </ul>
      )}
    </div>
  );
}
