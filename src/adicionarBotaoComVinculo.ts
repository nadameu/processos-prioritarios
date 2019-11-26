import { Either, Right } from '../adt/Either';
import { GUI } from './GUI';
import { Localizadores } from './LocalizadoresFactory';

export function adicionarBotaoComVinculo(localizadores: Localizadores): Either<Error, string> {
  const gui = GUI.getInstance();
  const botao = gui.criarBotaoAcao(localizadores);
  botao.addEventListener(
    'click',
    () => {
      gui.avisoCarregando.atualizar(0, localizadores.quantidadeProcessosNaoFiltrados);
      localizadores.obterProcessos().then(() => {
        gui.avisoCarregando.ocultar();
        gui.atualizarBotaoAcao();
        localizadores.forEach(localizador => {
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
