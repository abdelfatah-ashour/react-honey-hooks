import { commands, userEvent } from "vitest/browser";
import { useCookieState } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

function ThemeSwitch() {
  const [theme, setTheme] = useCookieState("theme", { defaultValue: "light", maxAge: 3600 });
  return (
    <>
      <p>Theme: {theme}</p>
      <button
        type="button"
        onClick={() => {
          setTheme((current) => (current === "light" ? "dark" : "light"));
        }}
      >
        Switch theme
      </button>
      <button
        type="button"
        onClick={() => {
          setTheme(undefined);
        }}
      >
        Forget
      </button>
    </>
  );
}

afterEach(() => {
  document.cookie = "theme=; max-age=0; path=/";
});

describe("useCookieState in a real browser", () => {
  it("stores the choice in a cookie for the whole site that outlives a remount, then deletes it", async () => {
    const screen = await render(<ThemeSwitch />);
    await expect.element(screen.getByText("Theme: light")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Switch theme" }));
    await expect.element(screen.getByText("Theme: dark")).toBeVisible();

    const theme = (await commands.getCookies()).find(({ name }) => name === "theme");
    expect(theme).toMatchObject({ value: "dark", path: "/" });
    const hourFromNow = Date.now() / 1000 + 3600;
    expect(theme?.expires).toBeGreaterThan(hourFromNow - 60);
    expect(theme?.expires).toBeLessThan(hourFromNow + 60);

    await screen.unmount();
    const again = await render(<ThemeSwitch />);
    await expect.element(again.getByText("Theme: dark")).toBeVisible();

    await userEvent.click(again.getByRole("button", { name: "Forget" }));
    await expect.element(again.getByText("Theme: light")).toBeVisible();
    expect((await commands.getCookies()).map(({ name }) => name)).not.toContain("theme");
  });
});
