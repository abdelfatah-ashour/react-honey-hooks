import { useSetState } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function SignUp() {
  const [form, setForm] = useSetState({ name: "", email: "", newsletter: false });
  return (
    <form>
      <input
        aria-label="Name"
        value={form.name}
        onChange={(event) => {
          setForm({ name: event.target.value });
        }}
      />
      <input
        aria-label="Email"
        value={form.email}
        onChange={(event) => {
          setForm({ email: event.target.value });
        }}
      />
      <label>
        <input
          type="checkbox"
          checked={form.newsletter}
          onChange={() => {
            setForm((current) => ({ newsletter: !current.newsletter }));
          }}
        />
        Newsletter
      </label>
      <output>{JSON.stringify(form)}</output>
    </form>
  );
}

describe("useSetState in a real browser", () => {
  it("keeps every field when each input updates only its own key", async () => {
    const screen = await render(<SignUp />);

    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.click(screen.getByRole("checkbox", { name: "Newsletter" }));

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent('{"name":"Ada","email":"ada@example.com","newsletter":true}');
  });
});
