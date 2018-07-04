import { GUI } from './GUI';
export default function adicionarBotaoComVinculo(localizadores) {
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
