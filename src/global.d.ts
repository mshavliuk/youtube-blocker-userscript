declare const STORE_PREFIX: string;

declare module "*.pug" {
  const content: string;
  export default content;
}
declare module "*.html" {
  const content: string;
  export default content;
}

declare const unsafeWindow: Window;
