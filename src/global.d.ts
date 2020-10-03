declare const STORE_PREFIX: string;
declare const HTML_PREFIX: string;

declare module "*.pug" {
  /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
  const template: (params: { prefix: string; [k: string]: any | undefined; }) => string;
  export default template;
}
declare module "*.html" {
  const content: string;
  export default content;
}

declare const unsafeWindow: Window;
