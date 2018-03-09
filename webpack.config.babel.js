import CleanWebpackPlugin from 'clean-webpack-plugin';
import path from 'path';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import UserscriptMeta from 'userscript-meta';
import webpack from 'webpack';

import pkg from './package.json';
import GenerateMetaFilePlugin from './lib/GenerateMetaFilePlugin';

const getMetadata = () => {
	const { name, description, version, author, userscript } = pkg;
	return { name, description, version, author, ...userscript };
};

const defaultConfig = {
	entry: path.resolve(__dirname, pkg.main),
	module: {
		rules: [
			{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
			{
				test: /\.scss$/,
				exclude: /node_modules/,
				loader: ['style-loader', 'css-loader', 'sass-loader'],
			},
		],
	},
	optimization: {
		minimizer: [],
	},
	output: {
		filename: `${pkg.name}.user.js`,
		path: path.resolve(__dirname, 'dist'),
		publicPath: '/',
	},
	plugins: [
		new webpack.BannerPlugin({
			banner: UserscriptMeta.stringify(getMetadata()),
			raw: true,
			entryOnly: true,
		}),
	],
};

const devConfig = {
	...defaultConfig,
	devServer: {
		contentBase: './dist',
	},
};

const prodConfig = {
	...defaultConfig,
	plugins: [
		new CleanWebpackPlugin(['dist']),
		new UglifyJsPlugin({}),
		...(defaultConfig.plugins || []),
		new GenerateMetaFilePlugin({
			filename: `${pkg.name}.meta.js`,
			metadata: getMetadata(),
		}),
	],
};

const config = (env = {}) => (env.production ? prodConfig : devConfig);

export default config;
