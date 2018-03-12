import LocalizadorProcesso from './LocalizadorProcesso';

export default class LocalizadorProcessoFactory {
	static fromInput(input) {
		var localizador = new LocalizadorProcesso();
		localizador.id = input.value;
		var elementoNome = input.nextSibling;
		localizador.principal = elementoNome.nodeName.toLowerCase() === 'u';
		localizador.sigla = elementoNome.textContent.trim();
		var linkLembrete = elementoNome.nextElementSibling;
		if (linkLembrete.attributes.hasOwnProperty('onmouseover')) {
			var onmouseover = linkLembrete.attributes.onmouseover.value;
			localizador.lembrete = onmouseover.match(
				/^return infraTooltipMostrar\('Obs: (.*) \/ ([^(]+)\(([^)]+)\)','',400\);$/
			)[1];
		}
		return localizador;
	}
}
