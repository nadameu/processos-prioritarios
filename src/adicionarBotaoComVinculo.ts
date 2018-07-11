import { Either, Right } from '../adt/Either';
import { GUI } from './GUI';
import { Localizadores } from './LocalizadoresFactory';

export default function adicionarBotaoComVinculo(
	localizadores: Localizadores
): Either<Error, string> {
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
	return Right('Ok.');
}
