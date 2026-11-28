import { scaffoldHookDocs } from "./scaffoldHookDocs";

const none = new Set<string>();

/** Only the hook pages, leaving out the sidebar category files. */
function pages(readme: string, existing: ReadonlySet<string> = none) {
  return scaffoldHookDocs(readme, existing).filter((file) => file.path.endsWith(".mdx"));
}

describe("scaffoldHookDocs", () => {
  it("turns a hook's README section into an MDX page with a flat URL", () => {
    const readme = [
      "# Title",
      "",
      "## State hooks",
      "",
      "### `useToggle`",
      "",
      "A boolean state with named setters.",
      "",
      "```tsx",
      'import { useToggle } from "react-honey-hooks";',
      "```",
      "",
      "---",
      "",
    ].join("\n");

    expect(pages(readme)).toEqual([
      {
        path: "state-hooks/useToggle.mdx",
        content: [
          "---",
          "title: useToggle",
          "slug: /hooks/useToggle",
          "---",
          "",
          "A boolean state with named setters.",
          "",
          "```tsx",
          'import { useToggle } from "react-honey-hooks";',
          "```",
          "",
        ].join("\n"),
      },
    ]);
  });

  it("returns nothing for a README with no hook sections", () => {
    expect(scaffoldHookDocs("", none)).toEqual([]);
    expect(scaffoldHookDocs("# Title\n\n## Installation\n\nnpm install", none)).toEqual([]);
  });

  it("labels each category's sidebar group with its README heading, in README order", () => {
    const readme = [
      "## State hooks",
      "### `useToggle`",
      "Toggle text.",
      "### `useCounter`",
      "Counter text.",
      "## Storage hooks: localStorage, sessionStorage and cookies",
      "### `useLocalStorage`",
      "Storage text.",
      "## Migrating from v2",
      "Not a hook.",
    ].join("\n");

    const categories = scaffoldHookDocs(readme, none).filter((file) =>
      file.path.endsWith("_category_.json"),
    );

    expect(categories).toEqual([
      {
        path: "state-hooks/_category_.json",
        content: '{\n  "label": "State hooks",\n  "position": 1\n}\n',
      },
      {
        path: "storage-hooks-localstorage-sessionstorage-and-cookies/_category_.json",
        content:
          '{\n  "label": "Storage hooks: localStorage, sessionStorage and cookies",\n  "position": 2\n}\n',
      },
    ]);
  });

  it("skips hooks that already have a page, so it never overwrites hand edits", () => {
    const readme = [
      "## State hooks",
      "### `useToggle`",
      "Toggle text.",
      "### `useCounter`",
      "Counter text.",
    ].join("\n");

    const files = pages(readme, new Set(["useToggle"]));

    expect(files.map((file) => file.path)).toEqual(["state-hooks/useCounter.mdx"]);
  });

  it("points README anchor links to other hooks at their docs pages", () => {
    const readme = [
      "## Server rendering hooks",
      "### `useTheme`",
      "Use [`useIsClient`](#useisclient) to wait for hydration.",
      "### `useIsClient`",
      "Is client.",
    ].join("\n");

    const [theme] = pages(readme);

    expect(theme?.content).toContain(
      "Use [`useIsClient`](/docs/hooks/useIsClient) to wait for hydration.",
    );
  });
});
