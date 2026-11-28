# react-honey-hooks

Small, typed React hooks published to npm. TypeScript only, no JavaScript source files.

## Rule: every change is test-driven and covers edge cases

Every change that adds or edits a hook or any other behaviour must follow TDD:

1. **Agree the seams first.** Before writing a test, state which public hook or behaviour is
   under test and confirm it with the user.
2. **Red before green.** Write one failing test, run it and see it fail for the expected reason,
   then write only enough code to pass it. Repeat one slice at a time (vertical slices); never
   write all the tests up front.
3. **Cover edge cases, not just the happy path.** Every new or changed behaviour needs tests for
   the relevant edge cases, for example:
   - empty, missing, `null`/`undefined` or invalid input (such as an invalid `Date`)
   - boundaries: zero, negative values, the exact moment a limit is reached
   - inputs or props changing between renders (`rerender`)
   - cleanup on unmount: no leaked listeners or timers
   - the latest callback being used after a re-render
   - server rendering (`renderToString`) for anything that touches `window` or `document`
4. **Test through the public interface only.** Use `renderHook` and real DOM events. Don't test
   internals, mock React or assert values recomputed the way the code computes them.
5. **Refactor only when green**, as a separate step, and keep the tests passing.

A bug fix starts with a failing test that reproduces the bug.

## Conventions

- One hook per file in `src/`, with its unit tests next to it in `src/<hookName>.test.ts`.
- Real-browser e2e tests live in `e2e/<hookName>.test.tsx`. They import from
  `"react-honey-hooks"`, which resolves to the built `dist/` bundle, and run in Chromium,
  Firefox and WebKit. Cover each hook's main flows there with real user events.
- Server-rendering unit tests use `renderOnServer` from `src/testing/renderOnServer.ts`, which
  removes `window` and `document` while it renders, as on a real server.
- `bundle/treeShaking.test.ts` bundles each hook alone from `dist/` with esbuild and fails if
  the bundle has code from any `src/` file the hook doesn't import. Keep module-level code
  side-effect free (plain literals, or `/* @__PURE__ */` on calls) so bundlers can drop it.
- No runtime dependencies: only `react` as a peer dependency.
- Export each hook and its public types from `src/index.ts` as named exports.
- Hooks must be SSR-safe and must not need memoised callbacks from callers.
- Add a JSDoc comment to each exported hook and document it in `README.md` (TypeScript
  examples only).

## Docs site

The docs site in `docs/` is a Docusaurus site with its own `package.json` (`npm install --prefix
docs`), published to GitHub Pages at https://abdelfatah-ashour.github.io/react-honey-hooks/ by
`.github/workflows/docs.yml` on every push to `master`. It imports the hooks from `src/`.

- Each hook has a hand-edited page in `docs/docs/hooks/<category>/<hookName>.mdx`. For a new
  hook, run `npm run docs:scaffold` to write a starting page from its README section; it never
  overwrites a page. `docs/tests/coverage.test.ts` fails if an exported hook has no page.
- Live demos live in `docs/src/demos/<hookName>.tsx`, embedded in the page with `<LiveDemo>`,
  and are tested with real user events in `docs/src/demos/<hookName>.test.tsx` (run by the e2e
  project against `dist/`). A hook without a demo must be listed in
  `docs/tests/hooksAwaitingDemo.ts`; take it off when you add the demo.
- `docs/site/site.test.ts` (`npm run test:docs`) builds the site and opens every page under the
  `/react-honey-hooks/` base path in Chromium, failing on any failed request or error.

## Commands

```bash
npm test             # unit tests: Vitest (jsdom)
npm run test:watch
npm run test:e2e     # build, then run e2e/ in real browsers (npx playwright install first)
npm run test:bundle  # build, then check that each hook bundles alone (tree-shaking)
npm run test:docs    # build the docs site, then open every page in Chromium
npm run docs:start   # docs site dev server
npm run docs:scaffold # write a starting docs page for each hook that has none
npm run check        # typecheck + lint + format check + unit + e2e + bundle + docs; must pass before committing
npm run build        # tsup -> dist/
```
