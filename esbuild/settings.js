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

exports.settings = {
	entryPoints: ['src/index.ts'],
	banner: { js: banner },
	outfile: `./dist/${filename}`,
};
