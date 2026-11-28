import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderOnServer } from "./testing/renderOnServer";
import { useCookieState } from "./useCookieState";

/** The cookies the page can see, decoded, as `{ name: value }`. */
function cookies(): Record<string, string> {
  return Object.fromEntries(
    document.cookie
      .split("; ")
      .filter(Boolean)
      .map((pair) => {
        const at = pair.indexOf("=");
        return [decodeURIComponent(pair.slice(0, at)), decodeURIComponent(pair.slice(at + 1))];
      }),
  );
}

afterEach(() => {
  for (const name of document.cookie.split("; ").map((pair) => pair.split("=")[0])) {
    if (name) document.cookie = `${name}=; max-age=0; path=/`;
  }
});

describe("useCookieState", () => {
  it("reads the cookie, and falls back to defaultValue, or undefined, when it is missing", () => {
    document.cookie = "theme=dark; path=/";

    expect(renderHook(() => useCookieState("theme")).result.current[0]).toBe("dark");
    expect(
      renderHook(() => useCookieState("missing", { defaultValue: "light" })).result.current[0],
    ).toBe("light");
    expect(renderHook(() => useCookieState("missing")).result.current[0]).toBeUndefined();
  });

  it("writes the cookie when set, with a value or a function of the current value", () => {
    const { result } = renderHook(() => useCookieState("count", { defaultValue: "0" }));

    act(() => {
      result.current[1]("1");
    });
    expect(result.current[0]).toBe("1");
    expect(cookies().count).toBe("1");

    act(() => {
      result.current[1]((current) => String(Number(current) + 1));
      result.current[1]((current) => String(Number(current) + 1));
    });
    expect(result.current[0]).toBe("3");
    expect(cookies().count).toBe("3");
  });

  it("deletes the cookie when set to undefined, falling back to defaultValue", () => {
    document.cookie = "theme=dark; path=/";
    const { result } = renderHook(() => useCookieState("theme", { defaultValue: "light" }));

    act(() => {
      result.current[1](undefined);
    });
    expect(result.current[0]).toBe("light");
    expect("theme" in cookies()).toBe(false);

    act(() => {
      result.current[1]("dark");
    });
    act(() => {
      result.current[1](() => undefined);
    });
    expect("theme" in cookies()).toBe(false);
  });

  it("stores names and values with spaces, separators and emoji, and reads them back exactly", () => {
    const value = "a=b; c, d % 🍯";
    const { result } = renderHook(() => useCookieState("my cookie;"));

    act(() => {
      result.current[1](value);
    });
    expect(result.current[0]).toBe(value);
    expect(cookies()["my cookie;"]).toBe(value);
    expect(renderHook(() => useCookieState("my cookie;")).result.current[0]).toBe(value);
  });

  it("reads a cookie that another script wrote without encoding, even if it isn't valid encoding", () => {
    document.cookie = "raw=100%; path=/";

    expect(renderHook(() => useCookieState("raw")).result.current[0]).toBe("100%");
  });

  it("writes with the hook's cookie options, which each call can override", () => {
    const { result } = renderHook(() => useCookieState("scoped", { path: "/elsewhere" }));

    act(() => {
      result.current[1]("hidden");
    });
    expect("scoped" in cookies()).toBe(false);
    expect(result.current[0]).toBeUndefined();

    act(() => {
      result.current[1]("visible", { path: "/", maxAge: 60 });
    });
    expect(cookies().scoped).toBe("visible");
    expect(result.current[0]).toBe("visible");

    act(() => {
      result.current[1]("expired", { path: "/", expires: new Date(0) });
    });
    expect("scoped" in cookies()).toBe(false);
  });

  it("deletes a cookie that was written with a path, using the same path", () => {
    const { result } = renderHook(() => useCookieState("pathed", { path: "/" }));

    act(() => {
      result.current[1]("x");
    });
    act(() => {
      result.current[1](undefined);
    });
    expect("pathed" in cookies()).toBe(false);
  });

  it("updates every hook reading the same cookie when one of them sets it", () => {
    const first = renderHook(() => useCookieState("shared"));
    const second = renderHook(() => useCookieState("shared", { defaultValue: "none" }));

    act(() => {
      first.result.current[1]("on");
    });
    expect(second.result.current[0]).toBe("on");
  });

  it("reads the new cookie when the name changes, and the setter writes to the latest name", () => {
    document.cookie = "a=1; path=/";
    document.cookie = "b=2; path=/";
    const { result, rerender } = renderHook(({ name }) => useCookieState(name), {
      initialProps: { name: "a" },
    });
    const setter = result.current[1];

    rerender({ name: "b" });
    expect(result.current[0]).toBe("2");
    expect(result.current[1]).toBe(setter);

    act(() => {
      setter((current) => `${current ?? ""}0`);
    });
    expect(cookies()).toEqual({ a: "1", b: "20" });
  });

  it("uses the latest defaultValue and cookie options, without needing them memoised", () => {
    const { result, rerender } = renderHook(
      ({ path, defaultValue }) => useCookieState("late", { path, defaultValue }),
      { initialProps: { path: "/elsewhere", defaultValue: "x" } },
    );

    rerender({ path: "/", defaultValue: "y" });
    act(() => {
      result.current[1]((current) => `${current ?? ""}!`);
    });
    expect(cookies().late).toBe("y!");
  });

  it("falls back to defaultValue, without throwing, where the page may not use cookies", () => {
    const blocked = () => {
      throw new DOMException("The document is sandboxed", "SecurityError");
    };
    const spies = [
      vi.spyOn(Document.prototype, "cookie", "get").mockImplementation(blocked),
      vi.spyOn(Document.prototype, "cookie", "set").mockImplementation(blocked),
    ];
    try {
      const { result } = renderHook(() => useCookieState("theme", { defaultValue: "light" }));
      expect(result.current[0]).toBe("light");

      expect(() => {
        act(() => {
          result.current[1]("dark");
        });
      }).not.toThrow();
      expect(result.current[0]).toBe("light");
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });

  it("renders defaultValue on the server, then hydrates and shows the cookie without a mismatch", async () => {
    function Probe() {
      const [theme] = useCookieState("theme", { defaultValue: "light" });
      return theme;
    }
    expect(renderOnServer(createElement(Probe))).toBe("light");

    document.cookie = "theme=dark; path=/";
    const container = document.createElement("div");
    container.innerHTML = renderOnServer(createElement(Probe));
    const errors = vi.spyOn(console, "error");

    const root = await act(() => hydrateRoot(container, createElement(Probe)));

    expect(container.textContent).toBe("dark");
    expect(errors).not.toHaveBeenCalled();
    act(() => {
      root.unmount();
    });
  });
});
