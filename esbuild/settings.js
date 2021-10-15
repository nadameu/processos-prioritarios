const generateMetadataHeader = require('./generateMetadataHeader');
const meta = require('../metadata');
const pkg = require('../package.json');

const banner = generateMetadataHeader({
	name: pkg.name,
	version: pkg.version,
	author: pkg.author,
	...meta,
});

const filename = (exports.filename = `${pkg.name}.user.js`);

/** @type {import('esbuild').BuildOptions} */
exports.settings = {
	banner: { js: banner },
	bundle: true,
	entryPoints: ['src/index.ts'],
	format: 'esm',
	outfile: `./dist/${filename}`,
};
