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

- One hook per file in `src/`, with its tests next to it in `src/<hookName>.test.ts`.
- Export each hook and its public types from `src/index.ts` as named exports.
- Hooks must be SSR-safe and must not need memoised callbacks from callers.
- Add a JSDoc comment to each exported hook and document it in `README.md` (TypeScript
  examples only).

## Commands

```bash
npm test             # Vitest (jsdom)
npm run test:watch
npm run check        # typecheck + lint + format check + tests; must pass before committing
npm run build        # tsup -> dist/
```
