import { parseCookies } from './helpers';

function paraCadaLocalizador(fn) {
	var cookiesAntigos = parseCookies(document.cookie);
	var promises = this.map(fn);
	return Promise.all(promises).then(() => {
		var cookiesNovos = parseCookies(document.cookie);
		var expira = [new Date()]
			.map(d => {
				d.setFullYear(d.getFullYear() + 1);
				return d;
			})
			.map(d => d.toUTCString())
			.reduce((_, x) => x);
		for (let key in cookiesNovos) {
			const valorAntigo = cookiesAntigos[key];
			const valorNovo = cookiesNovos[key];
			if (typeof valorAntigo !== 'undefined' && valorNovo !== valorAntigo) {
				document.cookie = `${escape(key)}=${escape(
					valorAntigo
				)}; expires=${expira}`;
			}
		}
	});
}

export default class Localizadores {
	constructor() {
		this.tabela = null;
	}

	obterProcessos() {
		return paraCadaLocalizador.call(this, localizador =>
			localizador.obterProcessos()
		);
	}

	get quantidadeProcessos() {
		return this.reduce(
			(soma, localizador) => soma + localizador.quantidadeProcessos,
			0
		);
	}

	get quantidadeProcessosNaoFiltrados() {
		return this.reduce(
			(soma, localizador) => soma + localizador.quantidadeProcessosNaoFiltrados,
			0
		);
	}
}

// Substitui Localizadores extends Array
Localizadores.prototype = Object.defineProperties(
	Object.create(Array.prototype),
	Object.getOwnPropertyDescriptors(Localizadores.prototype)
);
