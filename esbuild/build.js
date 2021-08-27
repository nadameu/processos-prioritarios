const esbuild = require('esbuild');
const { settings } = require('./settings');

esbuild.build(settings).catch(e => {
	console.error(e);
});
