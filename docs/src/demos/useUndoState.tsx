import { useUndoState } from "react-honey-hooks";

/** A title field with undo and redo, one step per keystroke. */
export default function UseUndoStateDemo() {
  const [title, setTitle, { undo, redo, canUndo, canRedo }] = useUndoState("Draft");

  return (
    <div>
      <label>
        Title{" "}
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
      </label>
      <div className="button-group margin-top--sm">
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={undo}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={redo}
          disabled={!canRedo}
        >
          Redo
        </button>
      </div>
    </div>
  );
}
