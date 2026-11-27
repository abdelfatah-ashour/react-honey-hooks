import { useEffect, useState, useSyncExternalStore } from "react";

/** A permission's state, `"pending"` while the browser is asked, or `"unsupported"`. */
export type PermissionValue = PermissionState | "pending" | "unsupported";

function subscribeToNothing(): () => void {
  return () => undefined;
}

function isSupported(): boolean {
  return typeof navigator !== "undefined" && "permissions" in navigator;
}

/** Assume support on the server, so it renders "pending" like a supporting browser's first render. */
function isSupportedOnServer(): boolean {
  return true;
}

/**
 * Returns the state of the browser permission `name` (for example `"geolocation"`,
 * `"notifications"` or `"camera"`) from the Permissions API: `"granted"`, `"denied"` or
 * `"prompt"`, and re-renders when the user changes it. It is `"pending"` while the browser is
 * asked, during server rendering and on the first render while hydrating, and `"unsupported"`
 * when the browser has no Permissions API or does not know `name`. When `name` changes it is
 * `"pending"` again until the new answer, and answers for the old name are ignored.
 */
export function usePermission(
  name: PermissionName | (string & NonNullable<unknown>),
): PermissionValue {
  // Keyed by name, so after `name` changes the old answer reads as "pending".
  const [answered, setAnswered] = useState<{ name: string; value: PermissionValue } | null>(null);
  const supported = useSyncExternalStore(subscribeToNothing, isSupported, isSupportedOnServer);

  useEffect(() => {
    if (!supported) return;
    let current = true;
    let status: PermissionStatus | undefined;
    const setValue = (value: PermissionValue) => {
      if (current) setAnswered({ name, value });
    };
    const onChange = () => {
      if (status) setValue(status.state);
    };
    // Wrapped, so a query that throws instead of rejecting is handled the same way.
    new Promise<PermissionStatus>((resolve) => {
      resolve(navigator.permissions.query({ name } as PermissionDescriptor));
    }).then(
      (answer) => {
        if (!current) return;
        status = answer;
        setValue(answer.state);
        answer.addEventListener("change", onChange);
      },
      () => {
        setValue("unsupported");
      },
    );
    return () => {
      current = false;
      status?.removeEventListener("change", onChange);
    };
  }, [name, supported]);

  if (!supported) return "unsupported";
  return answered?.name === name ? answered.value : "pending";
}
