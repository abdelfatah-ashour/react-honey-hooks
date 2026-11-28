import { useResetState } from "react-honey-hooks";

const saved = "Buy milk";

/** A note editor whose edits can be thrown away, back to the saved text. */
export default function UseResetStateDemo() {
  const [note, setNote, discard] = useResetState(saved);

  return (
    <div>
      <label>
        Note{" "}
        <textarea
          rows={2}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
          }}
        />
      </label>
      <div className="margin-top--sm">
        <button
          type="button"
          className="button button--sm button--outline button--secondary"
          onClick={discard}
          disabled={note === saved}
        >
          Discard changes
        </button>
      </div>
    </div>
  );
}
