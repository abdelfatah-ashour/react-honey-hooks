import { useState } from "react";
import { useDebouncedValue } from "react-honey-hooks";

/** A search box that only searches once typing pauses for half a second. */
export default function UseDebouncedValueDemo() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 500);

  return (
    <div>
      <input
        type="search"
        aria-label="Search hooks"
        placeholder="Search hooks…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
        }}
      />
      <p role="status">{debouncedQuery ? `Searching for “${debouncedQuery}”` : "Type to search"}</p>
    </div>
  );
}
