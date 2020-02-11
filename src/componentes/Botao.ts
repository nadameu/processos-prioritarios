import { html, render } from 'lit-html';
import { Cancelable } from '../Cancelable';
import { note } from '../Either';
import { logger } from '../logger';
import { parsePaginaCadastroMeusLocalizadores } from '../paginas/cadastroMeusLocalizadores';
import { parsePaginaLocalizadoresOrgao } from '../paginas/localizadoresOrgao';
import { partitionMap } from '../partitionMap';
import { XHR } from '../XHR';
import { Aguarde } from './Aguarde';
import { Logo } from './Logo';
import { MensagemErro } from './MensagemErro';
import { TabelaLocalizadores } from './TabelaLocalizadores';

export const Botao = ({
  areaTabela,
  container,
  urlCadastro,
  urlLocalizadoresOrgao,
}: {
  areaTabela: Element;
  container: Element;
  urlCadastro: string;
  urlLocalizadoresOrgao: string;
}) => {
  return html`
    <button type="button" class="summa-dies__botao" @click=${() => onClick()}>
      ${Logo()}Summa Dies
    </button>
  `;

  async function onClick() {
    try {
      render(Aguarde(), container);
      const [{ ocultarVazios, localizadores: meus }, orgao] = await Cancelable.all([
        XHR(urlCadastro)
          .then(parsePaginaCadastroMeusLocalizadores)
          .then(resultado => {
            render(Aguarde({ localizadoresCadastro: true }), container);
            return resultado;
          }),
        obterPaginaLocalizadoresOrgao(urlLocalizadoresOrgao)
          .then(parsePaginaLocalizadoresOrgao)
          .then(resultado => {
            render(Aguarde({ localizadoresOrgao: true }), container);
            return resultado;
          }),
      ]);
      const idsOrgao = new Map(orgao.map(loc => [loc.id, loc]));
      const { left: desativados, right: localizadores } = partitionMap(meus, ({ id, siglaNome }) =>
        note(siglaNome, idsOrgao.get(id))
      );
      if (desativados.length > 0) {
        throw new Error(`Os seguintes localizadores foram desativados: ${desativados.join(', ')}`);
      }
      const dados = ocultarVazios
        ? localizadores.filter(({ quantidadeProcessos }) => quantidadeProcessos > 0)
        : localizadores;
      container.textContent = '';
      render(TabelaLocalizadores(dados), areaTabela);
    } catch (e) {
      logger.error(e);
      render(MensagemErro(e instanceof Error ? e.message : String(e)), container);
    }
  }
};

function obterPaginaLocalizadoresOrgao(url: string) {
  const data = new FormData();
  data.append('hdnInfraCampoOrd', 'TotalProcessos');
  data.append('hdnInfraTipoOrd', 'DESC');
  data.append('hdnInfraPaginaAtual', '0');
  data.append('chkOcultarSemProcesso', '0');
  return XHR(url, 'POST', data);
}
