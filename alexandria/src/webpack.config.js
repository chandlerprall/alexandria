const {join} = require('path');

const babelConfig = {
	babelrc: false,
	presets: [
		'@babel/preset-typescript',
		'@babel/preset-env',
		'@babel/preset-react',
	],
};

const outDir = 'C:\\Users\\cjqp7\\Documents\\codebases\\alexandria\\consumer\\out';

module.exports = {
	mode: 'development',
	
	context: outDir,
	entry: './app.js',
	
	output: {
		path: join(outDir, 'build'),
		filename: 'app.js'
	},
	
	resolve: {
		alias: { Example:
				'C:\\Users\\cjqp7\\Documents\\codebases\\alexandria\\consumer\\build\\dynamic\\example.js' }
		,
		fallback: {
			path: false,
		}
	},
	
	module: {
		rules: [
			{
				test: /\.(js|ts|tsx)$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
				options: babelConfig,
			}
		]
	}
}