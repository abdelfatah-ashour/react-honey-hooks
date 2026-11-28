import { useRef } from "react";
import { useFocusWithin } from "react-honey-hooks";

/** A sign-up form that shows the password rules only while you are in a password field. */
export default function UseFocusWithinDemo() {
  const passwordsRef = useRef<HTMLFieldSetElement>(null);
  const focused = useFocusWithin(passwordsRef);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <label>
        Email <input type="email" autoComplete="off" />
      </label>
      <fieldset ref={passwordsRef} className="margin-top--sm">
        <label>
          Password <input type="password" autoComplete="new-password" />
        </label>{" "}
        <label>
          Confirm password <input type="password" autoComplete="new-password" />
        </label>
        {focused && (
          <ul aria-label="Password rules" className="margin-top--sm margin-bottom--none">
            <li>At least 12 characters</li>
            <li>Not the same as your email</li>
          </ul>
        )}
      </fieldset>
    </form>
  );
}
