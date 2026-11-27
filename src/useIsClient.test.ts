import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderOnServer } from "./testing/renderOnServer";
import { useIsClient } from "./useIsClient";

function Probe() {
  return useIsClient() ? "client" : "server";
}

describe("useIsClient", () => {
  it("is true from the very first render in an app without server rendering", () => {
    const rendered: boolean[] = [];

    renderHook(() => {
      rendered.push(useIsClient());
    });

    expect(rendered).toEqual([true]);
  });

  it("renders on the server as false", () => {
    expect(renderOnServer(createElement(Probe))).toBe("server");
  });

  it("is false while hydrating, so it matches the server, then true", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderOnServer(createElement(Probe));
    const errors = vi.spyOn(console, "error");
    const rendered: string[] = [];
    function Recorder() {
      const text = useIsClient() ? "client" : "server";
      rendered.push(text);
      return text;
    }

    const root = await act(() => hydrateRoot(container, createElement(Recorder)));

    expect(rendered[0]).toBe("server");
    expect(container.textContent).toBe("client");
    expect(errors).not.toHaveBeenCalled();
    act(() => {
      root.unmount();
    });
  });
});
