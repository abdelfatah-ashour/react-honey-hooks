import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useFileDrop } from "./useFileDrop";

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

function file(name: string, type: string): File {
  return new File(["contents"], name, { type });
}

/**
 * jsdom has no DragEvent or DataTransfer, so this builds the event a browser would fire: files
 * are listed under the "Files" type, and only readable on drop.
 */
function drag(type: string, target: Element, files: File[] | "text" = []): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const dataTransfer = {
    types: files === "text" ? ["text/plain"] : ["Files"],
    files: files === "text" ? [] : files,
    dropEffect: "none",
  };
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe("useFileDrop", () => {
  it("is over while files are dragged over the zone, and passes the dropped files", () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useFileDrop(refTo(zone), onDrop));
    expect(result.current.isOver).toBe(false);
    const photo = file("photo.png", "image/png");

    drag("dragenter", zone, [photo]);
    expect(drag("dragover", zone, [photo]).defaultPrevented).toBe(true);
    expect(result.current.isOver).toBe(true);

    const drop = drag("drop", zone, [photo]);

    expect(drop.defaultPrevented).toBe(true);
    expect(result.current.isOver).toBe(false);
    expect(onDrop).toHaveBeenCalledWith([photo], []);
  });

  it("stays over while moving across children, and ends when the drag leaves the zone", () => {
    const { result } = renderHook(() => useFileDrop(refTo(zone), () => undefined));
    const files = [file("a.txt", "text/plain")];

    drag("dragenter", zone, files);
    // Moving onto a child: the child's dragenter comes before the zone's dragleave.
    drag("dragenter", child, files);
    drag("dragleave", zone, files);
    expect(result.current.isOver).toBe(true);

    drag("dragleave", child, files);
    expect(result.current.isOver).toBe(false);
  });

  it("ignores drags without files, such as selected text, leaving their drop to the browser", () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useFileDrop(refTo(zone), onDrop));

    drag("dragenter", zone, "text");
    const over = drag("dragover", zone, "text");
    const drop = drag("drop", zone, "text");

    expect(result.current.isOver).toBe(false);
    expect(over.defaultPrevented).toBe(false);
    expect(drop.defaultPrevented).toBe(false);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("splits the files by accept, matching MIME types, wildcards and extensions", () => {
    const onDrop = vi.fn();
    renderHook(() => useFileDrop(refTo(zone), onDrop, { accept: "image/*, .PDF, text/csv" }));
    const photo = file("photo.jpeg", "image/jpeg");
    const report = file("SCAN.PDF", "application/pdf");
    const table = file("table.csv", "text/csv");
    const song = file("song.mp3", "audio/mpeg");

    drag("drop", zone, [photo, report, song, table]);

    expect(onDrop).toHaveBeenCalledWith([photo, report, table], [song]);
  });

  it("with multiple: false, keeps the first accepted file and rejects the rest", () => {
    const onDrop = vi.fn();
    renderHook(() => useFileDrop(refTo(zone), onDrop, { multiple: false }));
    const first = file("a.txt", "text/plain");
    const second = file("b.txt", "text/plain");

    drag("drop", zone, [first, second]);

    expect(onDrop).toHaveBeenCalledWith([first], [second]);
  });

  it("calls the onDrop from the latest render", () => {
    const calls: string[] = [];
    const { rerender } = renderHook(
      ({ label }) =>
        useFileDrop(refTo(zone), () => {
          calls.push(label);
        }),
      { initialProps: { label: "first" } },
    );

    rerender({ label: "second" });
    drag("drop", zone, [file("a.txt", "text/plain")]);

    expect(calls).toEqual(["second"]);
  });

  it("handles nothing while enabled is false, and disabling clears isOver", () => {
    const onDrop = vi.fn();
    const files = [file("a.txt", "text/plain")];
    const { result, rerender } = renderHook(
      ({ enabled }) => useFileDrop(refTo(zone), onDrop, { enabled }),
      { initialProps: { enabled: true } },
    );
    drag("dragenter", zone, files);

    rerender({ enabled: false });
    expect(result.current.isOver).toBe(false);

    const drop = drag("drop", zone, files);
    expect(drop.defaultPrevented).toBe(false);
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("stops handling drops when it unmounts", () => {
    const onDrop = vi.fn();
    const { unmount } = renderHook(() => useFileDrop(refTo(zone), onDrop));

    unmount();
    drag("drop", zone, [file("a.txt", "text/plain")]);

    expect(onDrop).not.toHaveBeenCalled();
  });

  it("renders on the server as not over", () => {
    function Probe() {
      return String(useFileDrop(refTo(null), () => undefined).isOver);
    }

    expect(renderOnServer(createElement(Probe))).toBe("false");
  });
});
