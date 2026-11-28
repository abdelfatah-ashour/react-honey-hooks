import { useCopyToClipboard } from "react-honey-hooks";

const COUPON = "HONEY20";

/** A coupon code with a copy button that confirms the copy, then resets. */
export default function UseCopyToClipboardDemo() {
  const { copy, copied, error } = useCopyToClipboard();

  return (
    <div>
      <p>
        20% off your first order with <code>{COUPON}</code>
      </p>
      <button
        type="button"
        className="button button--sm button--secondary"
        onClick={() => {
          void copy(COUPON);
        }}
      >
        {copied ? "Copied!" : "Copy code"}
      </button>
      {error && (
        <p role="alert" className="margin-top--sm">
          Couldn&apos;t copy: {error.message}
        </p>
      )}
    </div>
  );
}
