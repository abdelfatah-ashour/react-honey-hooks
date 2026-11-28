import { createRequire } from "node:module";
import { dirname } from "node:path";
import type * as Preset from "@docusaurus/preset-classic";
import type { Config, Plugin } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const resolveFrom = createRequire(import.meta.url);
const repo = "https://github.com/abdelfatah-ashour/react-honey-hooks";

/**
 * Lets demos import "react-honey-hooks" straight from the library's `src/`, so the docs always
 * show the current code. `react` and `react-dom` are pinned to the site's own copies: `src/`
 * would otherwise find the library's dev copy of React in the root `node_modules`, and two
 * Reacts on one page break hooks.
 */
function libraryFromSource(): Plugin {
  return {
    name: "library-from-source",
    configureWebpack() {
      return {
        resolve: {
          alias: {
            "react-honey-hooks$": resolveFrom.resolve("../src/index.ts"),
            react: dirname(resolveFrom.resolve("react/package.json")),
            "react-dom": dirname(resolveFrom.resolve("react-dom/package.json")),
          },
        },
      };
    },
  };
}

const config: Config = {
  title: "React Honey Hooks",
  tagline: "70+ small, typed, SSR-safe React hooks for React and Next.js",
  favicon: "img/favicon.svg",

  // GitHub Pages serves the project site at https://abdelfatah-ashour.github.io/react-honey-hooks/.
  url: "https://abdelfatah-ashour.github.io",
  baseUrl: "/react-honey-hooks/",
  organizationName: "abdelfatah-ashour",
  projectName: "react-honey-hooks",
  // GitHub Pages serves `page.html` at `/page`, so pages are built without trailing slashes.
  trailingSlash: false,

  onBrokenLinks: "throw",
  markdown: { hooks: { onBrokenMarkdownLinks: "throw" } },

  i18n: { defaultLocale: "en", locales: ["en"] },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: `${repo}/edit/master/docs/`,
        },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [libraryFromSource],

  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: "🍯 React Honey Hooks",
      items: [
        { type: "docSidebar", sidebarId: "docs", position: "left", label: "Docs" },
        {
          href: "https://www.npmjs.com/package/react-honey-hooks",
          label: "npm",
          position: "right",
        },
        { href: repo, label: "GitHub", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Getting started", to: "/docs/intro" },
            { label: "useToggle", to: "/docs/hooks/useToggle" },
          ],
        },
        {
          title: "More",
          items: [
            { label: "GitHub", href: repo },
            { label: "npm", href: "https://www.npmjs.com/package/react-honey-hooks" },
          ],
        },
      ],
      copyright: `MIT licensed. Copyright © ${String(new Date().getFullYear())} Abdelfatah Ashour.`,
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
  } satisfies Preset.ThemeConfig,
};

export default config;
