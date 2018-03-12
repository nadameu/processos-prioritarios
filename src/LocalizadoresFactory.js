import Localizadores from './Localizadores';
import LocalizadorFactory from './LocalizadorFactory';

export default class LocalizadoresFactory {
	static fromTabela(tabela) {
		var localizadores = new Localizadores();
		localizadores.tabela = tabela;
		var linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
		linhas.forEach(linha => {
			localizadores.push(LocalizadorFactory.fromLinha(linha));
		});
		return localizadores;
	}
	static fromTabelaPainel(tabela) {
		var localizadores = new Localizadores();
		localizadores.tabela = tabela;
		var linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
		linhas.forEach(linha => {
			localizadores.push(LocalizadorFactory.fromLinhaPainel(linha));
		});
		return localizadores;
	}
}
