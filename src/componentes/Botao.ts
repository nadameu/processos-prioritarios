import { html, render, svg } from 'lit-html';
import { Array$partitionMap } from '../Array$partitionMap';
import { Cancelable } from '../Cancelable';
import { Left, Right } from '../Either';
import { logger } from '../logger';
import { parsePaginaCadastroMeusLocalizadores } from '../paginas/cadastroMeusLocalizadores';
import { parsePaginaLocalizadoresOrgao } from '../paginas/localizadoresOrgao';
import { XHR } from '../XHR';
import { Aguarde } from './Aguarde';
import { MensagemErro } from './MensagemErro';
import { TabelaLocalizadores } from './TabelaLocalizadores';

const logo = svg`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="summa-dies__logo">
      <path class="summa-dies__logo__desenho" d="M64 80V16c0-8.844 7.156-16 16-16s16 7.156 16 16v64c0 8.844-7.156 16-16 16s-16-7.156-16-16zm272 16c8.844 0 16-7.156 16-16V16c0-8.844-7.156-16-16-16s-16 7.156-16 16v64c0 8.844 7.156 16 16 16zm176 288c0 70.688-57.313 128-128 128s-128-57.313-128-128 57.313-128 128-128 128 57.313 128 128zm-32 0c0-52.938-43.063-96-96-96s-96 43.063-96 96 43.063 96 96 96 96-43.062 96-96zM128 192H64v64h64v-64zM64 352h64v-64H64v64zm96-96h64v-64h-64v64zm0 96h64v-64h-64v64zM32 380.813V160h352v64h32V99.188C416 79.75 400.5 64 381.344 64H368v16c0 17.625-14.344 32-32 32s-32-14.375-32-32V64H112v16c0 17.625-14.344 32-32 32S48 97.625 48 80V64H34.672C15.516 64 0 79.75 0 99.188v281.625C0 400.188 15.516 416 34.672 416H224v-32H34.672c-1.453 0-2.672-1.5-2.672-3.187zM320 256v-64h-64v64h64zm131.875 96.813c-6.25-6.25-16.375-6.25-22.625 0l-56.563 56.563-33.938-33.938c-6.25-6.25-16.375-6.25-22.625 0s-6.25 16.375 0 22.625l45.25 45.25c3.125 3.125 7.219 4.688 11.313 4.688s8.188-1.563 11.313-4.688l67.875-67.875c6.25-6.25 6.25-16.375 0-22.625z" />
    </svg>
    `;

export const Botao = ({
  areaTabela,
  container,
  urlCadastro,
  urlLocalizadoresOrgao,
}: {
  areaTabela: Element;
  container: Element;
  tabela: Element;
  urlCadastro: string;
  urlLocalizadoresOrgao: string;
}) => {
  return html`
    <button type="button" class="summa-dies__botao" @click=${() => onClick()}>
      ${logo}Summa Dies
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
      const { left: desativados, right: localizadores } = Array$partitionMap(
        meus,
        ({ id, siglaNome }) => (idsOrgao.has(id) ? Right(idsOrgao.get(id)!) : Left(siglaNome))
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
