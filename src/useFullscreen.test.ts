import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useFullscreen } from "./useFullscreen";

let video: HTMLDivElement;
let fullscreenElement: Element | null = null;
let refuseNext = false;

/** jsdom has no Fullscreen API; this behaves like a browser's, firing fullscreenchange. */
function installFullscreen(enabled = true) {
  fullscreenElement = null;
  refuseNext = false;
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: enabled });
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    get: () => fullscreenElement,
  });
  Object.defineProperty(Element.prototype, "requestFullscreen", {
    configurable: true,
    value(this: Element) {
      if (refuseNext) {
        refuseNext = false;
        return Promise.reject(new TypeError("Permissions check failed"));
      }
      // The stand-in records which element asked, as the browser does.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      fullscreenElement = this;
      document.dispatchEvent(new Event("fullscreenchange"));
      return Promise.resolve();
    },
  });
  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    value() {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
      return Promise.resolve();
    },
  });
}

function refTo(element: Element | null): RefObject<Element | null> {
  return { current: element };
}

beforeEach(() => {
  installFullscreen();
  video = document.createElement("div");
  document.body.append(video);
});

afterEach(() => {
  video.remove();
  for (const key of ["fullscreenEnabled", "fullscreenElement", "exitFullscreen"]) {
    Reflect.deleteProperty(document, key);
  }
  Reflect.deleteProperty(Element.prototype, "requestFullscreen");
});

describe("useFullscreen", () => {
  it("enters and exits fullscreen for the element, reporting it in isFullscreen", async () => {
    const { result } = renderHook(() => useFullscreen(refTo(video)));
    expect(result.current).toMatchObject({ isFullscreen: false, supported: true });

    let entered: boolean | undefined;
    await act(async () => {
      entered = await result.current.enter();
    });
    expect(entered).toBe(true);
    expect(result.current.isFullscreen).toBe(true);

    await act(() => result.current.exit());
    expect(result.current.isFullscreen).toBe(false);
  });

  it("is only true for its own element, and exit leaves another element's fullscreen alone", async () => {
    const other = document.createElement("div");
    document.body.append(other);
    const mine = renderHook(() => useFullscreen(refTo(video)));
    const theirs = renderHook(() => useFullscreen(refTo(other)));

    await act(() => theirs.result.current.enter());
    expect(mine.result.current.isFullscreen).toBe(false);

    let exited: boolean | undefined;
    await act(async () => {
      exited = await mine.result.current.exit();
    });
    expect(exited).toBe(false);
    expect(theirs.result.current.isFullscreen).toBe(true);
    other.remove();
  });

  it("resolves enter to false when the browser refuses, or there is no element", async () => {
    refuseNext = true;
    const { result } = renderHook(() => useFullscreen(refTo(video)));
    const empty = renderHook(() => useFullscreen(refTo(null)));

    let entered: boolean | undefined;
    await act(async () => {
      entered = await result.current.enter();
    });
    expect(entered).toBe(false);
    expect(result.current.isFullscreen).toBe(false);

    await act(async () => {
      entered = await empty.result.current.enter();
    });
    expect(entered).toBe(false);
  });

  it("toggle enters when not fullscreen and exits when it is", async () => {
    const { result } = renderHook(() => useFullscreen(refTo(video)));

    await act(() => result.current.toggle());
    expect(result.current.isFullscreen).toBe(true);

    await act(() => result.current.toggle());
    expect(result.current.isFullscreen).toBe(false);
  });

  it("follows the user leaving fullscreen with Escape", async () => {
    const { result } = renderHook(() => useFullscreen(refTo(video)));
    await act(() => result.current.enter());

    act(() => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(result.current.isFullscreen).toBe(false);
  });

  it("is unsupported where elements can't go fullscreen, as on iPhone, and enter does nothing", async () => {
    installFullscreen(false);
    const requestFullscreen = vi.spyOn(Element.prototype, "requestFullscreen");
    const { result } = renderHook(() => useFullscreen(refTo(video)));

    let entered: boolean | undefined;
    await act(async () => {
      entered = await result.current.enter();
    });

    expect(result.current.supported).toBe(false);
    expect(entered).toBe(false);
    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("is unsupported where the browser has no Fullscreen API", () => {
    Reflect.deleteProperty(document, "fullscreenEnabled");

    const { result } = renderHook(() => useFullscreen(refTo(video)));

    expect(result.current.supported).toBe(false);
  });

  it("keeps enter, exit and toggle the same across renders", async () => {
    const ref = refTo(video);
    const { result, rerender } = renderHook(() => useFullscreen(ref));
    const { enter, exit, toggle } = result.current;

    await act(() => enter());
    rerender();

    expect(result.current.enter).toBe(enter);
    expect(result.current.exit).toBe(exit);
    expect(result.current.toggle).toBe(toggle);
  });

  it("renders on the server as not fullscreen", () => {
    function Probe() {
      return String(useFullscreen(refTo(null)).isFullscreen);
    }

    expect(renderOnServer(createElement(Probe))).toBe("false");
  });
});
