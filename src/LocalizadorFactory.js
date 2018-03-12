import Localizador from './Localizador';
import { isContained } from './helpers';

export default class LocalizadorFactory {
	static fromLinha(linha) {
		var localizador = new Localizador();
		localizador.linha = linha;
		const separador = ' - ';
		var siglaNome = linha.cells[0].textContent.split(separador);
		siglaNome.forEach((_, i) => {
			const qtdPartesSigla = i + 1;
			const sigla = siglaNome.slice(0, qtdPartesSigla).join(separador);
			const nome = siglaNome.slice(qtdPartesSigla).join(separador);
			if (isContained(sigla, nome)) {
				localizador.sigla = sigla;
				localizador.nome = nome;
			}
		});
		localizador.siglaNome = siglaNome.join(separador);
		var link = (localizador.link = linha.querySelector('a'));
		localizador.quantidadeProcessosNaoFiltrados = parseInt(link.textContent);
		if (link.href) {
			var camposGet = new URL(link.href).searchParams;
			localizador.id = camposGet.get('selLocalizador');
		}
		return localizador;
	}

	static fromLinhaPainel(linha) {
		var localizador = new Localizador();
		localizador.linha = linha;
		localizador.nome = linha.cells[0].textContent.match(
			/^Processos com Localizador\s+"(.*)"$/
		)[1];
		var link = (localizador.link = linha.querySelector('a,u'));
		localizador.quantidadeProcessosNaoFiltrados = parseInt(link.textContent);
		if (link && link.href) {
			var camposGet = new URL(link.href).searchParams;
			localizador.id = camposGet.get('selLocalizador');
		}
		return localizador;
	}
}
