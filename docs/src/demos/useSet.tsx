import { useSet } from "react-honey-hooks";

const toppings = ["Cheese", "Mushrooms", "Olives"];

/** A pizza order that keeps the chosen toppings in a set. */
export default function UseSetDemo() {
  const [chosen, { toggle, clear }] = useSet(["Cheese"]);

  return (
    <div>
      {toppings.map((topping) => (
        <label key={topping} className="margin-right--md">
          <input
            type="checkbox"
            checked={chosen.has(topping)}
            onChange={() => {
              toggle(topping);
            }}
          />{" "}
          {topping}
        </label>
      ))}
      <p role="status" className="margin-top--sm">
        {chosen.size === 0 ? "Plain pizza" : `Toppings: ${[...chosen].join(", ")}`}
      </p>
      <button
        type="button"
        className="button button--sm button--outline button--secondary"
        onClick={clear}
      >
        Clear
      </button>
    </div>
  );
}
