import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useDocumentTitle } from "./useDocumentTitle";

beforeEach(() => {
  document.title = "Original";
});

describe("useDocumentTitle", () => {
  it("sets the document's title, and follows changes between renders", () => {
    const { rerender } = renderHook(
      ({ title }) => {
        useDocumentTitle(title);
      },
      { initialProps: { title: "Inbox (3)" } },
    );
    expect(document.title).toBe("Inbox (3)");

    rerender({ title: "Inbox (4)" });

    expect(document.title).toBe("Inbox (4)");
  });

  it("leaves its title in place after it unmounts, by default", () => {
    const { unmount } = renderHook(() => {
      useDocumentTitle("Settings");
    });

    unmount();

    expect(document.title).toBe("Settings");
  });

  it("with restoreOnUnmount, puts back the title from before it mounted", () => {
    const { rerender, unmount } = renderHook(
      ({ title }) => {
        useDocumentTitle(title, { restoreOnUnmount: true });
      },
      { initialProps: { title: "Editing draft" } },
    );
    rerender({ title: "Editing draft (unsaved)" });

    unmount();

    expect(document.title).toBe("Original");
  });

  it("uses restoreOnUnmount as it is when it unmounts", () => {
    const { rerender, unmount } = renderHook(
      ({ restoreOnUnmount }) => {
        useDocumentTitle("Report", { restoreOnUnmount });
      },
      { initialProps: { restoreOnUnmount: false } },
    );

    rerender({ restoreOnUnmount: true });
    unmount();

    expect(document.title).toBe("Original");
  });

  it("sets an empty title as given", () => {
    renderHook(() => {
      useDocumentTitle("");
    });

    expect(document.title).toBe("");
  });

  it("renders on the server, where document doesn't exist", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
    Reflect.deleteProperty(globalThis, "document");
    function Probe() {
      useDocumentTitle("Server", { restoreOnUnmount: true });
      return "ok";
    }

    try {
      expect(renderToString(createElement(Probe))).toBe("ok");
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "document", descriptor);
    }
  });
});
