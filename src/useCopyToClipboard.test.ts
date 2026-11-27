import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useCopyToClipboard } from "./useCopyToClipboard";

/** jsdom has no Clipboard API, so this stands in for `navigator.clipboard`. */
function installClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("useCopyToClipboard", () => {
  it("copies the text, resolves true and reports copied", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    installClipboard(writeText);
    const { result } = renderHook(() => useCopyToClipboard());
    expect(result.current.copied).toBe(false);

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy("npm install react-honey-hooks");
    });

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("npm install react-honey-hooks");
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("resets copied after resetMs, restarting the wait on each copy", async () => {
    installClipboard(() => Promise.resolve());
    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(() => result.current.copy("a"));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    await act(() => result.current.copy("b"));
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });

  it("resolves false with an error when the Clipboard API is unavailable", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy("text");
    });

    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("resolves false with the browser's error when the write is refused", async () => {
    const denied = new DOMException("Write permission denied.", "NotAllowedError");
    installClipboard(() => Promise.reject(denied));
    const { result } = renderHook(() => useCopyToClipboard());

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.copy("text");
    });

    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBe(denied);
  });

  it("clears an earlier error after a successful copy", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>();
    writeText.mockRejectedValueOnce(new Error("busy")).mockResolvedValueOnce();
    installClipboard(writeText);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy("a"));
    expect(result.current.error).not.toBeNull();

    await act(() => result.current.copy("a"));
    expect(result.current.error).toBeNull();
    expect(result.current.copied).toBe(true);
  });

  it("keeps copy's identity across renders", async () => {
    installClipboard(() => Promise.resolve());
    const { result } = renderHook(() => useCopyToClipboard());
    const { copy } = result.current;

    await act(() => copy("a"));

    expect(result.current.copy).toBe(copy);
  });

  it("leaves no timer running after it unmounts", async () => {
    installClipboard(() => Promise.resolve());
    const { result, unmount } = renderHook(() => useCopyToClipboard());
    await act(() => result.current.copy("a"));

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("renders on the server as not copied, with no error", () => {
    function Probe() {
      const { copied, error } = useCopyToClipboard();
      return `copied: ${String(copied)}, error: ${String(error)}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("copied: false, error: null");
  });

  it("keeps copied until the next copy when resetMs is Infinity, and resets at once for 0", async () => {
    installClipboard(() => Promise.resolve());
    const forever = renderHook(() => useCopyToClipboard(Number.POSITIVE_INFINITY));
    const instant = renderHook(() => useCopyToClipboard(0));

    await act(() => forever.result.current.copy("a"));
    await act(() => instant.result.current.copy("a"));
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(forever.result.current.copied).toBe(true);
    expect(instant.result.current.copied).toBe(false);
  });
});
