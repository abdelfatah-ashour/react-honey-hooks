import { useMap } from "react-honey-hooks";

const fruits = ["Apples", "Pears"];

/** A fruit basket that maps each fruit to how many are in it. */
export default function UseMapDemo() {
  const [basket, { set, remove, clear }] = useMap<string, number>();
  const contents = [...basket].map(([fruit, count]) => `${fruit} ×${String(count)}`).join(", ");

  return (
    <div>
      {fruits.map((fruit) => (
        <div key={fruit} className="button-group margin-bottom--sm">
          <button
            type="button"
            className="button button--sm button--secondary"
            aria-label={`Add ${fruit}`}
            onClick={() => {
              set(fruit, (basket.get(fruit) ?? 0) + 1);
            }}
          >
            + {fruit}
          </button>
          <button
            type="button"
            className="button button--sm button--outline button--secondary"
            aria-label={`Remove ${fruit}`}
            onClick={() => {
              remove(fruit);
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <p role="status">{contents || "Basket is empty"}</p>
      <button
        type="button"
        className="button button--sm button--outline button--secondary"
        onClick={clear}
      >
        Empty basket
      </button>
    </div>
  );
}
