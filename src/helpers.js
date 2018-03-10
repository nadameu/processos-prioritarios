import GUI from './GUI';

export function adicionarBotaoComVinculo(localizadores) {
	var gui = GUI.getInstance();
	var botao = gui.criarBotaoAcao(localizadores);
	botao.addEventListener(
		'click',
		function() {
			gui.avisoCarregando.atualizar(
				0,
				localizadores.quantidadeProcessosNaoFiltrados
			);
			localizadores.obterProcessos().then(function() {
				gui.avisoCarregando.ocultar();
				gui.atualizarBotaoAcao();
				localizadores.forEach(function(localizador) {
					gui.atualizarVisualizacao(localizador);
				});
				gui.criarGrafico(localizadores);
				gui.atualizarGrafico = gui.criarGrafico.bind(null, localizadores);
			});
		},
		false
	);
}

/**
 * @param {Date|number} dataOuMilissegundos
 * @returns {Date}
 */
export function apenasData(dataOuMilissegundos) {
	const data = new Date(dataOuMilissegundos);
	return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

export function definirPropriedades(target, ...sources) {
	sources.forEach(source => {
		Object.defineProperties(
			target,
			Object.getOwnPropertyNames(source).reduce((descriptors, key) => {
				descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
				return descriptors;
			}, {})
		);
	});
	return target;
}

export function isContained(origContained, origContainer) {
	const contained = origContained.toLowerCase();
	const container = origContainer.toLowerCase();
	const ignored = /[./]/;
	let indexFrom = -1;
	return Array.prototype.every.call(
		contained,
		char =>
			ignored.test(char) ||
			!! (indexFrom = container.indexOf(char, indexFrom) + 1)
	);
}

export function parseCookies(texto) {
	var pares = texto.split(/\s*;\s*/);
	return parsePares(pares);
}

export function parseDataHora(texto) {
	let [d, m, y, h, i, s] = texto.split(/\W/g);
	return new Date(y, m - 1, d, h, i, s);
}

export function parsePares(pares) {
	return pares.reduce((obj, par) => {
		let nome, valores, valor;
		[nome, ...valores] = par.split('=');
		nome = unescape(nome);
		valor = unescape(valores.join('='));
		obj[nome] = valor;
		return obj;
	}, {});
}
