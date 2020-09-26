/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const webpack = require("webpack");
const AddText2BundlePlugin = require("add-text-to-bundle-plugin");
const fs = require("fs");

const glob = require("glob");

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
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.html$/i,
				loader: "html-loader",
				options: {
					esModule: true,
				},
			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					// Creates `style` nodes from JS strings
					"style-loader",
					// Translates CSS into CommonJS
					"css-loader",
					// Compiles Sass to CSS
					"sass-loader",
				],
			},
		],
	},
	// plugins: [new UglifyJsPlugin()],
	plugins: [
		new AddText2BundlePlugin({
			text: fs.readFileSync("./src/script-header.js", "utf8"),
		}),
		new webpack.DefinePlugin({
			STORE_PREFIX: JSON.stringify("[Youtube Blocker]"),
		}),
	],
};
