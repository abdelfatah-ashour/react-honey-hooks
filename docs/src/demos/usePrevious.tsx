import { useState } from "react";
import { usePrevious } from "react-honey-hooks";

/** A price tag that also shows what the price was before its last change. */
export default function UsePreviousDemo() {
  const [price, setPrice] = useState(20);
  const previous = usePrevious(price);

  return (
    <div>
      <p role="status">${price}</p>
      <p>{previous === undefined ? "No change yet" : `Was $${String(previous)}`}</p>
      <div className="button-group">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            setPrice(price - 1);
          }}
        >
          Lower price
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            setPrice(price + 1);
          }}
        >
          Raise price
        </button>
      </div>
    </div>
  );
}
