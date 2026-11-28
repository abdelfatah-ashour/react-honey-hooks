import { useRef, useState } from "react";
import { useClickOutside } from "react-honey-hooks";

/** A dropdown menu that closes when you click or tap anywhere outside it. */
export default function UseClickOutsideDemo() {
  const [open, setOpen] = useState(false);
  // The button is inside too, so clicking it toggles the menu rather than counting as outside.
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(
    menuRef,
    () => {
      setOpen(false);
    },
    { enabled: open },
  );

  return (
    <div>
      <div ref={menuRef} style={{ display: "inline-block" }}>
        <button
          type="button"
          className="button button--secondary"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
          }}
        >
          Menu
        </button>
        {open && (
          <ul aria-label="Menu items" className="margin-top--sm">
            <li>Profile</li>
            <li>Settings</li>
            <li>Sign out</li>
          </ul>
        )}
      </div>
      <p className="margin-top--md">Click outside the menu to close it.</p>
    </div>
  );
}
