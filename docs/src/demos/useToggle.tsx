import { useToggle } from "react-honey-hooks";

/** A FAQ answer that opens with its question and closes with a button. */
export default function UseToggleDemo() {
  const [open, { toggle, setFalse }] = useToggle();

  return (
    <div>
      <button
        type="button"
        className="button button--secondary"
        aria-expanded={open}
        onClick={toggle}
      >
        Do you ship abroad?
      </button>
      {open && (
        <div className="margin-top--sm">
          <p>Yes, to over 40 countries.</p>
          <button
            type="button"
            className="button button--sm button--outline button--secondary"
            onClick={setFalse}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
