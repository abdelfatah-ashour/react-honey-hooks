import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import Demo from "./useInView";

afterEach(() => {
  window.scrollTo(0, 0);
});

describe("useInView demo", () => {
  it("fades the picture in when it is scrolled into view and out when scrolled away", async () => {
    const screen = await render(<Demo />);
    const status = screen.getByRole("status");
    const picture = screen.getByRole("img", { name: "A sunset over the hills" });
    await expect.element(status).toHaveTextContent("Picture out of view");
    await expect.element(picture).toHaveStyle({ opacity: "0" });

    picture.element().scrollIntoView();
    await expect.element(status).toHaveTextContent("Picture in view");
    await expect.element(picture).toHaveStyle({ opacity: "1" });

    screen.getByText("Scroll down to see the picture.").element().scrollIntoView();
    await expect.element(status).toHaveTextContent("Picture out of view");
  });
});
