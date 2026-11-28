import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useWindowScroll";

afterEach(() => {
  window.scrollTo(0, 0);
});

describe("useWindowScroll demo", () => {
  it("shows a back-to-top button once the page is scrolled down, which scrolls back up", async () => {
    const screen = await render(
      <>
        <Demo />
        <div style={{ height: "300vh" }} />
      </>,
    );
    const position = screen.getByRole("status");
    const backToTop = screen.getByRole("button", { name: "Back to top" });
    await expect.element(position).toHaveTextContent("Scrolled 0px");
    await expect.element(backToTop).not.toBeInTheDocument();

    window.scrollTo(0, 600);
    await expect.element(position).toHaveTextContent("Scrolled 600px");
    await expect.element(backToTop).toBeVisible();

    await userEvent.click(backToTop);
    await expect.element(position, { timeout: 3000 }).toHaveTextContent("Scrolled 0px");
    await expect.element(backToTop).not.toBeInTheDocument();
  });
});
