import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { usePermission } from "./usePermission";

/** Stands in for a browser's PermissionStatus: `change` fires when the user changes it. */
class FakePermissionStatus extends EventTarget {
  /** How many `change` listeners are attached, to catch leaks. */
  changeListeners = 0;

  constructor(public state: PermissionState) {
    super();
  }

  override addEventListener(...args: Parameters<EventTarget["addEventListener"]>) {
    if (args[0] === "change") this.changeListeners++;
    super.addEventListener(...args);
  }

  override removeEventListener(...args: Parameters<EventTarget["removeEventListener"]>) {
    if (args[0] === "change") this.changeListeners--;
    super.removeEventListener(...args);
  }

  set(state: PermissionState) {
    this.state = state;
    this.dispatchEvent(new Event("change"));
  }
}

interface PendingQuery {
  name: string;
  resolve: (status: FakePermissionStatus) => void;
  reject: (error: Error) => void;
}

/** jsdom has no Permissions API. Each query waits until the test settles it. */
let queries: PendingQuery[] = [];

function installPermissions() {
  queries = [];
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value: {
      query: ({ name }: { name: string }) =>
        new Promise<FakePermissionStatus>((resolve, reject) => {
          queries.push({ name, resolve, reject });
        }),
    },
  });
}

/** Settles the latest query for `name` with a status in `state`, and returns that status. */
async function answer(name: string, state: PermissionState): Promise<FakePermissionStatus> {
  const status = new FakePermissionStatus(state);
  const query = [...queries].reverse().find((candidate) => candidate.name === name);
  if (!query) throw new Error(`no query for ${name}`);
  await act(async () => {
    query.resolve(status);
    await Promise.resolve();
  });
  return status;
}

beforeEach(() => {
  installPermissions();
});

afterEach(() => {
  Reflect.deleteProperty(navigator, "permissions");
});

describe("usePermission", () => {
  it("is pending until the browser answers, then reports the permission's state", async () => {
    const { result } = renderHook(() => usePermission("geolocation"));
    expect(result.current).toBe("pending");

    await answer("geolocation", "prompt");

    expect(result.current).toBe("prompt");
  });

  it("follows the user changing the permission", async () => {
    const { result } = renderHook(() => usePermission("geolocation"));
    const status = await answer("geolocation", "prompt");

    act(() => {
      status.set("granted");
    });
    expect(result.current).toBe("granted");

    act(() => {
      status.set("denied");
    });
    expect(result.current).toBe("denied");
  });

  it("is unsupported where the browser has no Permissions API", () => {
    Reflect.deleteProperty(navigator, "permissions");

    const { result } = renderHook(() => usePermission("geolocation"));

    expect(result.current).toBe("unsupported");
  });

  it("is unsupported when the browser rejects the permission name", async () => {
    const { result } = renderHook(() => usePermission("not-a-permission"));

    await act(async () => {
      queries[0]?.reject(new TypeError("'not-a-permission' is not a valid PermissionName"));
      await Promise.resolve();
    });

    expect(result.current).toBe("unsupported");
  });

  it("is unsupported when query throws instead of rejecting", async () => {
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        query: () => {
          throw new TypeError("not supported");
        },
      },
    });

    const { result } = renderHook(() => usePermission("geolocation"));
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBe("unsupported");
  });

  it("when name changes, is pending again and ignores the old permission's answer", async () => {
    const { result, rerender } = renderHook(({ name }) => usePermission(name), {
      initialProps: { name: "geolocation" },
    });

    rerender({ name: "notifications" });
    expect(result.current).toBe("pending");

    await answer("notifications", "denied");
    await answer("geolocation", "granted");

    expect(result.current).toBe("denied");
  });

  it("stops following the old permission's changes after name changes", async () => {
    const { result, rerender } = renderHook(({ name }) => usePermission(name), {
      initialProps: { name: "geolocation" },
    });
    const geolocation = await answer("geolocation", "prompt");

    rerender({ name: "notifications" });
    expect(result.current).toBe("pending");
    await answer("notifications", "denied");
    act(() => {
      geolocation.set("granted");
    });

    expect(result.current).toBe("denied");
  });

  it("stops following the permission when it unmounts", async () => {
    const { unmount } = renderHook(() => usePermission("geolocation"));
    const status = await answer("geolocation", "prompt");
    expect(status.changeListeners).toBe(1);

    unmount();

    expect(status.changeListeners).toBe(0);
  });

  it("doesn't start following a permission whose answer arrives after unmounting", async () => {
    const { unmount } = renderHook(() => usePermission("geolocation"));
    unmount();

    const status = await answer("geolocation", "prompt");

    expect(status.changeListeners).toBe(0);
  });

  it("renders on the server as pending", () => {
    function Probe() {
      return usePermission("geolocation");
    }

    expect(renderOnServer(createElement(Probe))).toBe("pending");
  });
});
