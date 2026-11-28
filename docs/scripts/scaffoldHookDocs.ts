/**
 * A file the scaffold would write, relative to the docs site's `docs/hooks/` folder: a hook's
 * MDX page, or a `_category_.json` that names a sidebar group.
 */
export interface ScaffoldFile {
  path: string;
  content: string;
}

const hookHeading = /^### `(use\w+)`$/;

/** Turns a heading such as "State hooks" into a folder name such as "state-hooks". */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Rewrites `(#usefoo)` anchor links to other hooks' sections as links to their docs pages. */
function linkHookAnchors(text: string, hooks: ReadonlyMap<string, string>): string {
  return text.replace(/\]\(#([\w-]+)\)/g, (link, anchor: string) => {
    const hook = hooks.get(anchor);
    return hook ? `](/docs/hooks/${hook})` : link;
  });
}

/**
 * Splits the README into a starting MDX page for each hook, from its `### \`useX\`` section,
 * filed in a folder named after the `##` heading above it, with a `_category_.json` that labels
 * that folder's sidebar group with the heading. Hooks named in `existing` already
 * have a page and are skipped, so hand edits are never overwritten.
 */
export function scaffoldHookDocs(readme: string, existing: ReadonlySet<string>): ScaffoldFile[] {
  const lines = readme.split("\n");
  // Hook names by their README anchor, such as "useisclient" -> "useIsClient".
  const hooks = new Map<string, string>();
  for (const line of lines) {
    const hook = hookHeading.exec(line)?.[1];
    if (hook) hooks.set(hook.toLowerCase(), hook);
  }

  const files: ScaffoldFile[] = [];
  let category = "";
  let current: { hook: string; folder: string; body: string[] } | undefined;

  const finish = () => {
    if (!current || existing.has(current.hook)) {
      current = undefined;
      return;
    }
    const section = current.body
      .join("\n")
      .replace(/\n---\s*$/, "")
      .trim();
    const body = linkHookAnchors(section, hooks);
    files.push({
      path: `${current.folder}/${current.hook}.mdx`,
      content: [
        "---",
        `title: ${current.hook}`,
        `slug: /hooks/${current.hook}`,
        "---",
        "",
        body,
        "",
      ].join("\n"),
    });
    current = undefined;
  };

  const folders = new Set<string>();
  for (const line of lines) {
    const hook = hookHeading.exec(line)?.[1];
    if (hook) {
      finish();
      const folder = slugify(category);
      if (!folders.has(folder)) {
        folders.add(folder);
        const meta = { label: category, position: folders.size };
        files.push({
          path: `${folder}/_category_.json`,
          content: `${JSON.stringify(meta, null, 2)}\n`,
        });
      }
      current = { hook, folder, body: [] };
    } else if (line.startsWith("## ")) {
      finish();
      category = line.slice(3);
    } else {
      current?.body.push(line);
    }
  }
  finish();
  return files;
}
