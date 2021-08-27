const esbuild = require('esbuild');
const { filename, settings } = require('./settings');

async function main() {
	// esbuild
	// 	.build({
	// 		entryPoints: ['./src/index.ts'],
	// 		banner: { js: banner },
	// 		outfile: `./dist/${filename}`,
	// 	})
	// 	.catch(e => {
	// 		console.error(e);
	// 	});
	const server = await esbuild.serve({ host: 'localhost' }, settings);
	const url = `http://${server.host}:${server.port}/${filename}`;
	console.log(`Script available at ${url}`);
}

main().catch(e => {
	console.error(e);
});
