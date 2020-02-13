import { html, render } from 'lit-html';
import { Cancelable } from '../Cancelable';
import { note } from '../Either';
import { logger } from '../logger';
import { parsePaginaCadastroMeusLocalizadores } from '../paginas/cadastroMeusLocalizadores';
import { parsePaginaLocalizadoresOrgao } from '../paginas/localizadoresOrgao';
import { parsePaginaTextosPadrao } from '../paginas/textosPadrao';
import { partitionMap } from '../partitionMap';
import { query } from '../query';
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
  urlTextosPadrao,
  urlRelatorioGeral,
}: {
  areaTabela: Element;
  container: Element;
  urlCadastro: string;
  urlLocalizadoresOrgao: string;
  urlTextosPadrao: string;
  urlRelatorioGeral: string;
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
        obterPaginaTextosPadrao(urlTextosPadrao)
          .then(parsePaginaTextosPadrao)
          .then(resultado => {
            render(Aguarde({ textosPadrao: true }), container);
            logger.log(resultado);
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
      await obterPaginaRelatorioGeral(urlRelatorioGeral)
        .then(resultado => {
          render(Aguarde({ relatorioGeral: true }), container);
          return resultado;
        })
        .chain(({ data, url }) =>
          Cancelable.all(
            localizadores.map(({ id }) => obterPaginaRelatorioGeralLocalizador(id)({ data, url }))
          )
        )
        .then(docs => Promise.all(docs.map(parsePaginaRelatorioGeralLocalizador)));
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

function obterPaginaTextosPadrao(url: string) {
  return new Cancelable(mensagemIframe(`${url}#limpar`)).chain(data => {
    logger.log({ data });
    data.set('txtDescricaoTexto', 'teste');
    data.set('selTipoPaginacao', '2');
    return XHR(url, 'POST', data);
  });
}

function obterPaginaRelatorioGeral(url: string): Cancelable<{ data: FormData; url: string }> {
  return new Cancelable(mensagemIframe(`${url}#limpar`));
}

function obterPaginaRelatorioGeralLocalizador(id: string) {
  return function({ data: cleanData, url }: { data: FormData; url: string }) {
    const data = cloneFormData(cleanData);
    data.set('selLocalizadorPrincipalSelecionados', id);
    return XHR(url, 'POST', data);
  };
}

async function parsePaginaRelatorioGeralLocalizador(doc: Document) {
  const caption = await query<HTMLTableCaptionElement>(
    'table#tabelaLocalizadores > caption.infraCaption',
    doc
  ).catch(async () => {
    const areaTabela = await query('#divInfraAreaTabela', doc);
    if (areaTabela.childNodes.length <= 3) return areaTabela.firstElementChild!;
    else throw new Error();
  });
  logger.log(caption.textContent);
}

function cloneFormData(data: FormData) {
  const newData = new FormData();
  for (const [key, value] of data) newData.append(key, value);
  return newData;
}

function mensagemIframe<T = any>(url: string): Promise<T> {
  return new Promise<T>(res => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'style',
      'position: absolute; left: 25vw; top: 25vh; background: white; width: 50vw; height: 50vh;'
    );
    iframe.style.display = 'none';
    iframe.src = url;
    window.addEventListener('message', function handler({ data, origin, source }) {
      if (origin === document.location.origin && source && source === iframe.contentWindow) {
        window.removeEventListener('message', handler);
        res(data);
        document.body.removeChild(iframe);
      }
    });
    document.body.appendChild(iframe);
  });
}
