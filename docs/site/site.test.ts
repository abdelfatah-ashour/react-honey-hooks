import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";

/** The path GitHub Pages serves the project site under. */
const base = "/react-honey-hooks/";
const buildDir = fileURLToPath(new URL("../build", import.meta.url));

const exportedHooks = Object.keys(await import("../../src/index")).filter((name) =>
  name.startsWith("use"),
);

/** The hooks with a live demo in `docs/src/demos/<hook>.tsx`. */
const hooksWithDemos = readdirSync(fileURLToPath(new URL("../src/demos", import.meta.url)))
  .filter((file) => /^use\w+\.tsx$/.test(file))
  .map((file) => file.slice(0, -".tsx".length));

const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

/**
 * Serves the built site the way GitHub Pages does: only under `base`, `/x` and `/x/` both
 * answered by `x/index.html` or `x.html`, and 404 for anything else.
 */
function serveBuild(): Server {
  return createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (!url.pathname.startsWith(base)) {
      response.writeHead(404).end();
      return;
    }
    const path = normalize(join(buildDir, decodeURIComponent(url.pathname.slice(base.length))));
    const candidates = [path, join(path, "index.html"), `${path}.html`];
    const file = candidates.find(
      (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
    );
    if (!file || !file.startsWith(buildDir)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
}

let server: Server | undefined;
let origin: string;
let browser: Browser;

beforeAll(async () => {
  if (!existsSync(buildDir)) throw new Error("docs/build is missing: run `npm run docs:build`");
  const started = serveBuild();
  server = started;
  await new Promise<void>((resolve) => started.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${String((started.address() as AddressInfo).port)}`;
  browser = await chromium.launch();
});

afterAll(async () => {
  // `browser` and `server` are unset when `beforeAll` failed part way.
  await (browser as Browser | undefined)?.close();
  const started = server;
  if (started) {
    await new Promise((resolve) => {
      started.close(resolve);
    });
  }
});

/**
 * Opens `path` under the base and returns the page once its scripts have run, with every
 * failed request and page or console error it saw.
 */
async function open(path: string): Promise<{ page: Page; problems: string[] }> {
  const page = await browser.newPage();
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console error: ${message.text()}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) problems.push(`${String(response.status())} ${response.url()}`);
  });
  await page.goto(`${origin}${base}${path}`, { waitUntil: "networkidle" });
  return { page, problems };
}

// Pages open in parallel tabs, so each test uses its own `expect`.
describe.concurrent("the built docs site", () => {
  it("serves the home page under the GitHub Pages base path", async ({ expect }) => {
    const { page, problems } = await open("");

    expect(await page.title()).toContain("React Honey Hooks");
    expect(problems).toEqual([]);
    await page.close();
  });

  it.for(exportedHooks)("serves a working page for %s", async (hook, { expect }) => {
    const { page, problems } = await open(`docs/hooks/${hook}`);

    expect(await page.locator("article h1").textContent()).toBe(hook);
    expect(problems).toEqual([]);
    await page.close();
  });

  it.for(hooksWithDemos)("shows the live demo on the %s page", async (hook, { expect }) => {
    const { page, problems } = await open(`docs/hooks/${hook}`);

    expect(await page.locator("article .demo :is(button, input)").count()).toBeGreaterThan(0);
    expect(problems).toEqual([]);
    await page.close();
  });
});
