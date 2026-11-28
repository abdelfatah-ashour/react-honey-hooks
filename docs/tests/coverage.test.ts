import { readdirSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

import { hooksAwaitingDemo } from "./hooksAwaitingDemo";

const hooksDir = fileURLToPath(new URL("../docs/hooks", import.meta.url));
const demosDir = fileURLToPath(new URL("../src/demos", import.meta.url));

/** Every hook the package exports. */
const exportedHooks = Object.keys(await import("../../src/index")).filter((name) =>
  name.startsWith("use"),
);

/** The files under `dir` ending in `extension`, by name without it. */
function namesOf(dir: string, extension: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir, { recursive: true, encoding: "utf8" });
  } catch {
    return [];
  }
  return entries
    .filter((file) => file.endsWith(extension) && !file.endsWith(`.test${extension}`))
    .map((file) => basename(file, extension));
}

describe("docs coverage", () => {
  it("has a docs page for every exported hook", () => {
    const pages = new Set(namesOf(hooksDir, ".mdx"));

    expect(exportedHooks.filter((hook) => !pages.has(hook))).toEqual([]);
  });

  it("has a live demo for every exported hook, or lists it as awaiting one", () => {
    const demos = new Set(namesOf(demosDir, ".tsx"));
    const awaiting = new Set(hooksAwaitingDemo);

    expect(exportedHooks.filter((hook) => !demos.has(hook) && !awaiting.has(hook))).toEqual([]);
  });

  it("only lists exported hooks without a demo as awaiting one", () => {
    const demos = new Set(namesOf(demosDir, ".tsx"));
    const exported = new Set(exportedHooks);

    expect(hooksAwaitingDemo.filter((hook) => demos.has(hook) || !exported.has(hook))).toEqual([]);
  });
});
