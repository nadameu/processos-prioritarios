import LocalizadoresProcesso from './LocalizadoresProcesso';
import LocalizadorProcessoFactory from './LocalizadorProcessoFactory';

export default class LocalizadoresProcessoFactory {
	static fromCelula(celula) {
		var localizadores = new LocalizadoresProcesso();
		var inputs = [...celula.getElementsByTagName('input')];
		inputs.forEach(input => {
			var localizador = LocalizadorProcessoFactory.fromInput(input);
			if (localizador.principal) {
				localizadores.principal = localizador;
			}
			localizadores.push(localizador);
		});
		return localizadores;
	}
}
