/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const webpack = require("webpack");
const AddText2BundlePlugin = require("add-text-to-bundle-plugin");
const fs = require("fs");
const autoprefixer = require("autoprefixer");

const glob = require("glob");

const PROJECT_PREFIX = "youtube-blocker";

module.exports = {
	entry: {
		"bundle.js": glob
			.sync("./src/index.ts")
			.map((f) => path.resolve(__dirname, f)),
	},
	output: {
		filename: "main.js",
		path: path.resolve(__dirname, "dist"),
	},
	resolve: {
		extensions: [".js", ".ts"],
	},
	module: {
		rules: [
			{
				test: /\.ts?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.html$/i,
				loader: "html-loader",
				options: {
					esModule: true,
				},
			},
			{
				test: /\.pug$/,
				use: [
					{
						loader: path.resolve("cjs-to-es6-loader.js"),
						options: {
							presets: ["@babel/preset-env"],
						},
					},
					{
						loader: "pug-loader",
					},
				],
			},
			{
				test: /\.s?css$/i,
				use: [
					"style-loader",
					"css-loader",
					{
						loader: "postcss-loader",
						options: {
							postcssOptions: { plugins: [autoprefixer()] },
						},
					},
					{
						loader: "sass-loader",
						options: {
							additionalData: `$_globalPrefix: ${PROJECT_PREFIX};`,
						},
					},
				],
			},
		],
	},
	plugins: [
		new AddText2BundlePlugin({
			text: fs.readFileSync("./src/script-header.js", "utf8"),
		}),
		new webpack.DefinePlugin({
			STORE_PREFIX: JSON.stringify("[Youtube Blocker]"),
			HTML_PREFIX: JSON.stringify(PROJECT_PREFIX),
		}),
	],
};
