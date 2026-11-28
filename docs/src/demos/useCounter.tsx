import { useCounter } from "react-honey-hooks";

/** A cart quantity picker that stays between 1 and 5. */
export default function UseCounterDemo() {
  const [quantity, { inc, dec, reset }] = useCounter(1, { min: 1, max: 5 });

  return (
    <div>
      <p role="status">Quantity: {quantity}</p>
      <div className="button-group">
        <button
          type="button"
          className="button button--secondary"
          aria-label="Remove one"
          onClick={() => {
            dec();
          }}
        >
          −
        </button>
        <button
          type="button"
          className="button button--secondary"
          aria-label="Add one"
          onClick={() => {
            inc();
          }}
        >
          +
        </button>
        <button type="button" className="button button--outline button--secondary" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
