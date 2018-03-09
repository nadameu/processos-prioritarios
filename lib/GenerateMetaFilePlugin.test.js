import GenerateMetaFilePlugin from './GenerateMetaFilePlugin';

describe('GenerateMetaFilePlugin', () => {
	it('Possui um construtor', () => {
		expect(typeof GenerateMetaFilePlugin).toBe('function');
		expect(GenerateMetaFilePlugin.prototype.constructor).toBe(
			GenerateMetaFilePlugin
		);
	});

	it('Possui um método apply', () => {
		expect(typeof GenerateMetaFilePlugin.prototype.apply).toBe('function');
	});

	it('Falha se não receber a opção "metadata"', () => {
		expect(() => new GenerateMetaFilePlugin()).toThrow();
		expect(() => new GenerateMetaFilePlugin({})).toThrow();
		expect(
			() => new GenerateMetaFilePlugin({ filename: 'test.user.js' })
		).toThrow();
	});

	it('Falha se não receber a opção "filename"', () => {
		expect(() => new GenerateMetaFilePlugin()).toThrow();
		expect(() => new GenerateMetaFilePlugin({})).toThrow();
		expect(
			() => new GenerateMetaFilePlugin({ metadata: { name: 'test' } })
		).toThrow();
	});

	it('Falha se a opção "filename" não for uma string', () => {
		expect(
			() =>
				new GenerateMetaFilePlugin({
					metadata: { name: 'test' },
					filename: ['invalid array'],
				})
		).toThrow();
	});

	it('Adiciona um plugin à fase de emissão do webpack', () => {
		const options = {
			filename: 'test.meta.js',
			metadata: {
				name: 'test',
			},
		};
		const expected = '// ==UserScript==\n// @name test\n// ==/UserScript==\n';
		const plugin = new GenerateMetaFilePlugin(options);
		const compilation = { assets: {} };
		const callback = () => {
			const addedAsset = compilation.assets[options.filename];
			expect(addedAsset).not.toBeUndefined();
			const { source, size } = addedAsset;
			expect(source()).toBe(expected);
			expect(size()).toBe(expected.length);
		};
		const compiler = {
			plugin(hook, fn) {
				expect(hook).toBe('emit');
				expect(typeof fn).toBe('function');
				fn(compilation, callback);
			},
		};
		plugin.apply(compiler);
	});
});
