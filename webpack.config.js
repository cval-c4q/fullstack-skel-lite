
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");


// Factored-out rule for Typescript+JSX preset
// Local config @tsconfig.json
const tsJsxRule = {
	test: /\.tsx?$/,
	exclude: /node_modules/,
	use: 'ts-loader',
};


/**
 *  Webpack target: frontend service
 */
let frontServiceConf = {
	target: 'node',
	entry: './src/front/index.ts',
	output: {
		path: path.resolve(__dirname, "build/front"),
		filename: 'index.js',
	},
	module: {
		rules: [ tsJsxRule ],
	},
};

/**
 *  Webpack target: frontend application
 */
let frontAppConf = {
	target: "web",
	entry: "./src/app/index.tsx",
	output: {
		path: path.resolve(__dirname, "build/front/static"),
		filename: 'app.js',
	},
	resolve: {
		extensions: [ ".ts", ".tsx", ".js", ".jsx" ],
	},
	module: {
		rules: [ tsJsxRule ],
	},
	plugins: [
		new HtmlWebpackPlugin(),
		new CopyWebpackPlugin([
			{
				from: "**/*",
				to: "./",
				toType: "dir",
				context: "src/app/static",
			},
		]),
	],
/* TODO: enable for alternate build with support of browser modules
	externals: {
		"react": "React",
		"react-dom": "ReactDOM",
	}, */
};

/**
 *  Webpack target: backend service
 */
let backServiceConf = {
	target: 'node',
	entry: './src/back/index.ts',
	output: {
		path: path.resolve(__dirname, "build/back"),
		filename: 'index.js',
	},
	module: {
		rules: [ tsJsxRule ],
	},
};

/*
 *  Webpack target: toplevel index.js
 */
let rootConf = {
	target: 'node',
	entry: './src/index.ts',
	output: {
		path: path.resolve(__dirname, "build"),
		filename: 'index.js',
	},
	module: {
		rules: [ tsJsxRule ],
	},
};


module.exports = [ frontServiceConf, frontAppConf, backServiceConf, rootConf ];

