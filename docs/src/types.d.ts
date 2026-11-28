/** Files imported as text with `!!raw-loader!`, such as a demo's source code. */
declare module "!!raw-loader!*" {
  const source: string;
  export default source;
}
