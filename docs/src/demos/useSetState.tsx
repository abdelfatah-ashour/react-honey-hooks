import { useSetState } from "react-honey-hooks";

/** A contact form whose fields each update their own key and leave the rest alone. */
export default function UseSetStateDemo() {
  const [contact, setContact] = useSetState({ name: "", email: "" });

  return (
    <div>
      <label>
        Name{" "}
        <input
          value={contact.name}
          onChange={(event) => {
            setContact({ name: event.target.value });
          }}
        />
      </label>{" "}
      <label>
        Email{" "}
        <input
          value={contact.email}
          onChange={(event) => {
            setContact({ email: event.target.value });
          }}
        />
      </label>{" "}
      <button
        type="button"
        className="button button--sm button--outline button--secondary"
        onClick={() => {
          setContact({ email: "" });
        }}
      >
        Clear email
      </button>
      <p role="status" className="margin-top--sm">
        {contact.name || "No name"} · {contact.email || "no email"}
      </p>
    </div>
  );
}
