
const path = require("path");


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
 *  Webpack target: frontend appication
 */
let frontAppConf = {
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


module.exports = [ frontServiceConf, backServiceConf, rootConf ];

