/**
 * Writes a starting docs page for each hook in README.md that has no page yet:
 * `npm run docs:scaffold`. It never overwrites a file, so pages can be edited by hand.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldHookDocs } from "./scaffoldHookDocs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const hooksDir = join(root, "docs/docs/hooks");

const existing = new Set(
  existsSync(hooksDir)
    ? readdirSync(hooksDir, { recursive: true, encoding: "utf8" })
        .filter((file) => file.endsWith(".mdx"))
        .map((file) => basename(file, ".mdx"))
    : [],
);

const readme = readFileSync(join(root, "README.md"), "utf8");
for (const file of scaffoldHookDocs(readme, existing)) {
  const path = join(hooksDir, file.path);
  if (existsSync(path)) continue;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, file.content);
  console.log(`wrote docs/docs/hooks/${file.path}`);
}
