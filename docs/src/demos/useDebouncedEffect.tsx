import { useState } from "react";
import { useDebouncedEffect } from "react-honey-hooks";

const TAKEN = ["admin", "root", "support"];

/** A sign-up field that checks the username once typing pauses for half a second. */
export default function UseDebouncedEffectDemo() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<string | null>(null);

  useDebouncedEffect(
    () => {
      if (!username) return;
      // Stands in for a request to your server.
      const taken = TAKEN.includes(username.toLowerCase());
      setResult(`@${username} is ${taken ? "taken" : "available"}`);
    },
    [username],
    500,
  );

  let status = result ?? "Waiting for you to stop typing…";
  if (!username) status = "Pick a username";

  return (
    <div>
      <input
        aria-label="Username"
        placeholder="Username"
        value={username}
        onChange={(event) => {
          setUsername(event.target.value);
          setResult(null);
        }}
      />
      <p role="status">{status}</p>
    </div>
  );
}
