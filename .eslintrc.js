module.exports = {
	extends: [
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended",
	],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint/eslint-plugin"],
	rules: {
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/explicit-module-boundary-types": "off",
	},
	env: {
		es6: true,
		browser: true,
		node: true,
	},
	globals: {},
	parserOptions: {
		ecmaVersion: 6,
		sourceType: "module",
	},
	settings: {
		"import/resolver": ["webpack"],
	},
};
