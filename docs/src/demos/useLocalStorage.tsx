import { useLocalStorage } from "react-honey-hooks";

/** A greeting that remembers your name after a reload, and in other tabs, until you clear it. */
export default function UseLocalStorageDemo() {
  const [name, setName, forget] = useLocalStorage("react-honey-hooks-docs:name", "");

  return (
    <div>
      <label>
        Your name{" "}
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </label>{" "}
      <button
        type="button"
        className="button button--sm button--outline button--secondary"
        onClick={forget}
      >
        Forget me
      </button>
      <p role="status">Hello, {name || "stranger"}!</p>
      <p>Reload the page: your name stays.</p>
    </div>
  );
}
