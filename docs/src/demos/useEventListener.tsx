import { useRef, useState } from "react";
import { useEventListener } from "react-honey-hooks";

/** Terms of service whose Accept button turns on once you have scrolled to the end. */
export default function UseEventListenerDemo() {
  const [readToEnd, setReadToEnd] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);
  useEventListener(
    "scroll",
    () => {
      const terms = termsRef.current;
      if (terms && terms.scrollTop + terms.clientHeight >= terms.scrollHeight - 1) {
        setReadToEnd(true);
      }
    },
    { target: termsRef, passive: true, enabled: !readToEnd },
  );

  return (
    <div>
      <div
        ref={termsRef}
        role="region"
        aria-label="Terms of service"
        tabIndex={0}
        style={{ height: 120, overflowY: "auto", overscrollBehavior: "contain" }}
      >
        {["Using the hooks", "Your content", "Honey", "Changes to these terms", "Contact"].map(
          (heading, index) => (
            <p key={heading}>
              <strong>
                {index + 1}. {heading}.
              </strong>{" "}
              These terms are only a demo, so there is nothing to agree to here.
            </p>
          ),
        )}
      </div>
      <button type="button" className="button button--primary margin-top--sm" disabled={!readToEnd}>
        Accept
      </button>
    </div>
  );
}
