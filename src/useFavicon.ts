import { useEffect } from "react";

const TYPES: Record<string, string> = {
  gif: "image/gif",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

/** The MIME type for `href`'s file extension, ignoring any query or hash. */
function typeOf(href: string): string | undefined {
  if (href.startsWith("data:")) return undefined;
  const path = href.split(/[?#]/, 1)[0] ?? "";
  const extension = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase();
  return extension === undefined ? undefined : TYPES[extension];
}

/** Sets an attribute, or removes it for `null`. */
function setAttribute(element: Element, name: string, value: string | null | undefined): void {
  if (value == null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/**
 * Sets the page's favicon to `href`, such as to show unread messages; `null` leaves the page's
 * own icon. Every `<link rel="icon">` in the head is pointed at `href`, with a `type` from its
 * file extension (none for an unknown one), or one is added when there are none. When `href`
 * becomes `null` or the component unmounts, the links go back to what they were, and an added
 * link is removed. Nothing happens on the server.
 */
export function useFavicon(href: string | null): void {
  useEffect(() => {
    if (href === null) return;
    const existing = [...document.head.querySelectorAll('link[rel~="icon"]')];
    const saved = existing.map((link) => ({
      link,
      href: link.getAttribute("href"),
      type: link.getAttribute("type"),
    }));
    let added: HTMLLinkElement | undefined;
    if (existing.length === 0) {
      added = document.createElement("link");
      added.rel = "icon";
      document.head.append(added);
      existing.push(added);
    }
    for (const link of existing) {
      link.setAttribute("href", href);
      setAttribute(link, "type", typeOf(href));
    }
    return () => {
      added?.remove();
      for (const { link, href, type } of saved) {
        setAttribute(link, "href", href);
        setAttribute(link, "type", type);
      }
    };
  }, [href]);
}
