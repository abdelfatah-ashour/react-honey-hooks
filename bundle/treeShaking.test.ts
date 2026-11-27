import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = resolve(root, "dist/index.js");
const outfile = resolve(root, "one-hook.js");

const hooks = Object.keys((await import(dist)) as Record<string, unknown>);

interface Bundle {
  code: string;
  /** The `src/` files, relative to the project root, that have code in the bundle. */
  sources: string[];
}

/**
 * Bundles only `hook` from the built package, the way an app that imports just that hook
 * would: esbuild with bundling, minification and `react` left external. esbuild chains the
 * package's own source map, so the bundle's map says which `src/` files its code came from.
 */
async function bundleOnly(hook: string): Promise<Bundle> {
  const result = await build({
    stdin: { contents: `export { ${hook} } from ${JSON.stringify(dist)};`, resolveDir: root },
    bundle: true,
    minify: true,
    format: "esm",
    external: ["react"],
    sourcemap: "external",
    outfile,
    write: false,
  });
  const file = (extension: string) =>
    result.outputFiles.find(({ path }) => path.endsWith(extension))?.text ?? "";
  const map = JSON.parse(file(".js.map")) as { sources: string[]; mappings: string };
  const sources = usedSourceIndexes(map.mappings).map((index) =>
    relative(root, resolve(dirname(outfile), map.sources[index] ?? "")),
  );
  return { code: file(".js"), sources: sources.sort() };
}

/** The files `src/<hook>.ts` imports, itself included: the most its bundle may contain. */
async function importedBy(hook: string): Promise<string[]> {
  const result = await build({
    entryPoints: [`src/${hook}.ts`],
    absWorkingDir: root,
    bundle: true,
    external: ["react"],
    format: "esm",
    metafile: true,
    write: false,
  });
  return Object.keys(result.metafile.inputs).sort();
}

const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decodes a source map's VLQ `mappings` and returns the source indexes that are mapped. */
function usedSourceIndexes(mappings: string): number[] {
  const used = new Set<number>();
  let source = 0;
  for (const segment of mappings.split(/[;,]/)) {
    if (segment === "") continue;
    const fields: number[] = [];
    let value = 0;
    let shift = 0;
    for (const char of segment) {
      const digit = base64.indexOf(char);
      value += (digit & 31) << shift;
      if (digit & 32) {
        shift += 5;
      } else {
        fields.push(value & 1 ? -(value >>> 1) : value >>> 1);
        value = 0;
        shift = 0;
      }
    }
    // Segments with one field map generated code to no source.
    if (fields.length >= 4) {
      source += fields[1] ?? 0;
      used.add(source);
    }
  }
  return [...used];
}

describe("bundling a single hook from dist", () => {
  it("finds the hooks dist exports", () => {
    expect(hooks).toContain("useMediaQuery");
    for (const hook of hooks) expect(hook).toMatch(/^use[A-Z]/);
  });

  it("leaves out the storage hooks when bundling useMediaQuery", async () => {
    expect((await bundleOnly("useMediaQuery")).code).not.toContain("localStorage");
  });

  it.each(hooks)("keeps only %s and the files it imports", async (hook) => {
    const { sources } = await bundleOnly(hook);

    expect(sources).toContain(`src/${hook}.ts`);
    const allowed = await importedBy(hook);
    expect(sources.filter((source) => !allowed.includes(source))).toEqual([]);
  });
});
