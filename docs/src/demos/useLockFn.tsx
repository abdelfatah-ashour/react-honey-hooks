import { useState } from "react";
import { useLockFn } from "react-honey-hooks";

/** Stands in for a request that places an order: takes a second. */
function sendOrder() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1000));
}

/** An order button that ignores extra clicks while the order is being placed. */
export default function UseLockFnDemo() {
  const [placing, setPlacing] = useState(false);
  const [orders, setOrders] = useState(0);
  const placeOrder = useLockFn(async () => {
    setPlacing(true);
    await sendOrder();
    setOrders((count) => count + 1);
    setPlacing(false);
  });

  return (
    <div>
      <p>Click as fast as you like: only one order goes through at a time.</p>
      <button type="button" className="button button--primary" onClick={() => void placeOrder()}>
        Place order
      </button>
      <p role="status" className="margin-top--sm">
        {placing ? "Placing order…" : `Orders placed: ${String(orders)}`}
      </p>
    </div>
  );
}
