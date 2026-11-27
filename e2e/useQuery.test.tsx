import { useQuery } from "react-honey-hooks";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

let originalUrl: string;

beforeEach(() => {
  originalUrl = window.location.href;
});

afterEach(() => {
  window.history.replaceState(null, "", originalUrl);
});

function Filters() {
  const { params, getAll } = useQuery<"page" | "tag" | "q">();
  return (
    <dl>
      <dt>page</dt>
      <dd data-testid="page">{params.page ?? "none"}</dd>
      <dt>tags</dt>
      <dd data-testid="tags">{getAll("tag").join(",") || "none"}</dd>
      <dt>q</dt>
      <dd data-testid="q">{params.q ?? "none"}</dd>
    </dl>
  );
}

function waitForPopState(): Promise<void> {
  return new Promise((resolve) => {
    window.addEventListener(
      "popstate",
      () => {
        resolve();
      },
      { once: true },
    );
  });
}

describe("useQuery in a real browser", () => {
  it("reads decoded values and repeated keys from the real URL", async () => {
    window.history.replaceState(null, "", "?q=honey%20%26%20bees&tag=a&tag=b");

    const screen = await render(<Filters />);

    await expect.element(screen.getByTestId("q")).toHaveTextContent("honey & bees");
    await expect.element(screen.getByTestId("tags")).toHaveTextContent("a,b");
    await expect.element(screen.getByTestId("page")).toHaveTextContent("none");
  });

  it("follows real back and forward navigation", async () => {
    window.history.replaceState(null, "", "?page=1");
    window.history.pushState(null, "", "?page=2");
    const screen = await render(<Filters />);
    await expect.element(screen.getByTestId("page")).toHaveTextContent("2");

    const back = waitForPopState();
    window.history.back();
    await back;
    await expect.element(screen.getByTestId("page")).toHaveTextContent("1");

    const forward = waitForPopState();
    window.history.forward();
    await forward;
    await expect.element(screen.getByTestId("page")).toHaveTextContent("2");
  });
});
