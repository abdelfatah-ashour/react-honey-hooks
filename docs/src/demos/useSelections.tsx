import { useSelections } from "react-honey-hooks";

const emails = [
  { id: 1, subject: "Your invoice" },
  { id: 2, subject: "Lunch on Friday?" },
  { id: 3, subject: "Release notes" },
];

/** An inbox with a checkbox per email and a select-all box that is partly checked in between. */
export default function UseSelectionsDemo() {
  const { selected, isSelected, toggle, toggleAll, allSelected, partiallySelected } = useSelections(
    emails,
    { getKey: (email) => email.id },
  );

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={allSelected}
          ref={(box) => {
            if (box) box.indeterminate = partiallySelected;
          }}
          onChange={toggleAll}
        />{" "}
        <strong>Select all</strong>
      </label>
      {emails.map((email) => (
        <div key={email.id}>
          <label>
            <input
              type="checkbox"
              checked={isSelected(email)}
              onChange={() => {
                toggle(email);
              }}
            />{" "}
            {email.subject}
          </label>
        </div>
      ))}
      <p role="status" className="margin-top--sm">
        {selected.length === 0
          ? "Nothing selected"
          : `${String(selected.length)} of ${String(emails.length)} selected`}
      </p>
    </div>
  );
}
