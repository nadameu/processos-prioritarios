import { stringify } from 'userscript-meta';

export default class GenerateMetaFilePlugin {
	constructor(options) {
		if (options.metadata == null)
			throw new TypeError('Opção metadata não informada');
		if (options.filename == null)
			throw new TypeError('Opção filename não informada');
		if (typeof options.filename !== 'string') {
			throw new TypeError('Opção filename deve ser uma string');
		}
		this.options = options;
	}

	apply(compiler) {
		const filename = this.options.filename;
		const text = stringify(this.options.metadata);
		compiler.plugin('emit', function(compilation, callback) {
			compilation.assets[filename] = {
				source: () => text,
				size: () => text.length,
			};
			callback();
		});
	}
}
