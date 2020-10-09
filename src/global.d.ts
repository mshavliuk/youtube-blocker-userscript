declare const STORE_PREFIX: string;
declare const HTML_PREFIX: string;

declare module "*.pug" {
	const template: (params: {
		prefix: string;
		/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
		[k: string]: any | undefined;
	}) => string;
	export default template;
}
declare module "*.html" {
	const content: string;
	export default content;
}

declare const unsafeWindow: Window;
