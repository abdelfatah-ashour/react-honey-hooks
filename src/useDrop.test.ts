import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { type DropOptions, useDrop } from "./useDrop";

let zone: HTMLDivElement;
let child: HTMLSpanElement;

beforeEach(() => {
  zone = document.createElement("div");
  child = document.createElement("span");
  zone.append(child);
  document.body.append(zone);
});

afterEach(() => {
  zone.remove();
});

function refTo(element: HTMLElement | null): RefObject<HTMLElement | null> {
  return { current: element };
}

/** What a drag carries: data by type, and any files. */
interface Payload {
  data?: Record<string, string>;
  files?: File[];
}

/**
 * jsdom has no DragEvent or DataTransfer, so this builds the event a browser would fire: the
 * types are listed, and the data and files are readable.
 */
function drag(type: string, target: Element, { data = {}, files = [] }: Payload = {}): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const dataTransfer = {
    types: [...Object.keys(data), ...(files.length > 0 ? ["Files"] : [])],
    files,
    getData: (format: string) => data[format] ?? "",
    dropEffect: "none",
  };
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

const TEXT: Payload = { data: { "text/plain": "Hello" } };

describe("useDrop", () => {
  it("is over while text is dragged over the zone, and passes the dropped text", () => {
    const onText = vi.fn();
    const { result } = renderHook(() => useDrop(refTo(zone), { onText }));
    expect(result.current.isOver).toBe(false);

    drag("dragenter", zone, TEXT);
    expect(result.current.isOver).toBe(true);
    expect(drag("dragover", zone, TEXT).defaultPrevented).toBe(true);

    expect(drag("drop", zone, TEXT).defaultPrevented).toBe(true);
    expect(result.current.isOver).toBe(false);
    expect(onText).toHaveBeenCalledExactlyOnceWith("Hello", expect.any(Event));
  });

  it("passes a dropped link to onUri, skipping uri-list comments, rather than to onText", () => {
    const onUri = vi.fn();
    const onText = vi.fn();
    renderHook(() => useDrop(refTo(zone), { onUri, onText }));

    drag("drop", zone, {
      data: {
        "text/uri-list": "# a comment\r\nhttps://example.com/a\r\nhttps://example.com/b",
        "text/plain": "https://example.com/a",
      },
    });
    expect(onUri).toHaveBeenCalledExactlyOnceWith("https://example.com/a", expect.any(Event));
    expect(onText).not.toHaveBeenCalled();
  });

  it("passes dropped files to onFiles, ahead of any text the drag also carries", () => {
    const onFiles = vi.fn();
    const onText = vi.fn();
    renderHook(() => useDrop(refTo(zone), { onFiles, onText }));
    const photo = new File(["x"], "photo.png", { type: "image/png" });

    drag("drop", zone, { files: [photo], data: { "text/plain": "photo.png" } });
    expect(onFiles).toHaveBeenCalledExactlyOnceWith([photo], expect.any(Event));
    expect(onText).not.toHaveBeenCalled();
  });

  it("falls back to the next kind with a callback, such as a link's text when there's no onUri", () => {
    const onText = vi.fn();
    renderHook(() => useDrop(refTo(zone), { onText }));

    drag("drop", zone, {
      data: { "text/uri-list": "https://example.com", "text/plain": "https://example.com" },
    });
    expect(onText).toHaveBeenCalledExactlyOnceWith("https://example.com", expect.any(Event));
  });

  it("ignores drags it has no callback for, leaving them to the browser", () => {
    const onFiles = vi.fn();
    const { result } = renderHook(() => useDrop(refTo(zone), { onFiles }));

    drag("dragenter", zone, TEXT);
    expect(result.current.isOver).toBe(false);
    expect(drag("dragover", zone, TEXT).defaultPrevented).toBe(false);
    expect(drag("drop", zone, TEXT).defaultPrevented).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("stays over while moving across children, and ends when the drag leaves the zone", () => {
    const { result } = renderHook(() => useDrop(refTo(zone), { onText: vi.fn() }));

    drag("dragenter", zone, TEXT);
    drag("dragenter", child, TEXT);
    drag("dragleave", zone, TEXT);
    expect(result.current.isOver).toBe(true);

    drag("dragleave", child, TEXT);
    expect(result.current.isOver).toBe(false);
  });

  it("calls the callbacks from the latest render, and starts handling a kind once it has one", () => {
    const first = vi.fn();
    const second = vi.fn();
    const initialProps: { options: DropOptions } = { options: { onText: first } };
    const { rerender } = renderHook(({ options }) => useDrop(refTo(zone), options), {
      initialProps,
    });

    rerender({ options: { onText: second, onUri: undefined } });
    drag("drop", zone, TEXT);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();

    const onUri = vi.fn();
    rerender({ options: { onText: second, onUri } });
    drag("drop", zone, { data: { "text/uri-list": "https://example.com" } });
    expect(onUri).toHaveBeenCalledOnce();
  });

  it("stops handling drops when it unmounts", () => {
    const onText = vi.fn();
    const { unmount } = renderHook(() => useDrop(refTo(zone), { onText }));

    unmount();
    expect(drag("drop", zone, TEXT).defaultPrevented).toBe(false);
    expect(onText).not.toHaveBeenCalled();
  });

  it("renders on the server as not over", () => {
    function Probe() {
      return useDrop({ current: null }, { onText: () => undefined }).isOver ? "over" : "not over";
    }

    expect(renderOnServer(createElement(Probe))).toBe("not over");
  });
});
