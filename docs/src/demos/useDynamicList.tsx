import { useDynamicList } from "react-honey-hooks";

/** A guest list whose rows can be added and removed, each keeping a stable key. */
export default function UseDynamicListDemo() {
  const { list, getKey, push, remove, replace } = useDynamicList(["Ada"]);
  const count = list.length;

  return (
    <div>
      {list.map((name, index) => (
        <div key={getKey(index)} className="margin-bottom--sm">
          <input
            aria-label={`Guest ${String(index + 1)}`}
            value={name}
            onChange={(event) => {
              replace(index, event.target.value);
            }}
          />{" "}
          <button
            type="button"
            className="button button--sm button--outline button--secondary"
            aria-label={`Remove guest ${String(index + 1)}`}
            onClick={() => {
              remove(index);
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button button--sm button--secondary"
        onClick={() => {
          push("");
        }}
      >
        Add guest
      </button>
      <p role="status" className="margin-top--sm">
        {count === 0 ? "No guests yet" : `${String(count)} ${count === 1 ? "guest" : "guests"}`}
      </p>
    </div>
  );
}
