import { html, render } from 'lit-html';
import { Cancelable } from '../Cancelable';
import { Logo } from '../componentes/Logo';
import { MensagemErro } from '../componentes/MensagemErro';
import { Cmd, core, Dispatch } from '../core';
import { logger } from '../logger';
import { query } from '../query';
import { queryAll } from '../queryAll';
import { XHR } from '../XHR';
import { parsePaginaCadastroMeusLocalizadores } from './cadastroMeusLocalizadores';
import { parsePaginaLocalizadoresOrgao } from './localizadoresOrgao';
import './meusLocalizadores.scss';
import { parsePaginaRelatorioGeralLocalizador } from './relatorioGeralLocalizador';
import { parsePaginaTextosPadrao } from './textosPadrao';

interface ModelContainer {
  container: Element;
}
interface ModelElementos extends ModelContainer {
  areaTabela: Element;
  urlCadastro: string;
  urlLocalizadoresOrgao: string;
  urlTextosPadrao: string;
  urlRelatorioGeral: string;
}
type ModelPagina = ModelPendenteDados | ModelObtido;
type ModelPaginaComFormulario = ModelPendenteVazio | ModelFormularioPendenteDados | ModelObtido;
interface ModelPendenteVazio {
  estado: 'pendenteDadosVazios';
}
type ModelFormularioPendenteDados = { estado: 'pendenteDados' } & UrlData;
type ModelPendenteDados = { estado: 'pendenteDados' };
interface ModelObtido {
  estado: 'obtido';
  doc: Document;
}
interface UrlData {
  url: string;
  data: FormData;
}
interface ModelFormularios {
  cadastro: ModelPagina;
  localizadoresOrgao: ModelPagina;
  textosPadrao: ModelPaginaComFormulario;
  relatorioGeral: ModelPaginaComFormulario;
}
type Model =
  | { estado: 'inicial' }
  | { estado: 'erro'; motivo: string }
  | ({ estado: 'erroContainer'; motivo: string } & ModelContainer)
  | ({ estado: 'criado' } & ModelContainer)
  | ({
      estado: 'elementos';
    } & ModelElementos)
  | ({ estado: 'buscandoFormularios'; formularios: ModelFormularios } & ModelElementos)
  | ({
      estado: 'formularios';
      formularios: ModelFormularios &
        { [key in keyof ModelFormularios]: { estado: 'obtido' } & UrlData };
    } & ModelElementos);

const Msg = {
  CARREGADO_FORMULARIO_VAZIO: (formulario: keyof ModelFormularios, { url, data }: UrlData) => ({
    type: 'CARREGADO_FORMULARIO_VAZIO' as const,
    formulario,
    url,
    data,
  }),
  DADOS_CARREGADOS: <a>(formulario: keyof ModelFormularios, dados: a) => ({
    type: 'DADOS_CARREGADOS' as const,
    formulario,
    dados,
  }),
  CRIADO: (container: Element) => ({ type: 'CRIADO' as const, container }),
  CLICADO: () => ({ type: 'CLICADO' as const }),
  ERRO: (motivo: string) => ({ type: 'ERRO' as const, motivo }),
  ELEMENTOS: (elementos: {
    areaTabela: Element;
    urlCadastro: string;
    urlLocalizadoresOrgao: string;
    urlTextosPadrao: string;
    urlRelatorioGeral: string;
  }) => ({ type: 'ELEMENTOS' as const, elementos }),
};
type Msg = ReturnType<typeof Msg[keyof typeof Msg]>;

function init(): [Model, Cmd<Msg>?] {
  return [{ estado: 'inicial' }, criarContainer];
}

function update(model: Model, msg: Msg): [Model, Cmd<Msg>?] {
  if (msg.type === 'ERRO') {
    if ('container' in model) {
      return [{ estado: 'erroContainer', container: model.container, motivo: msg.motivo }];
    } else {
      return [{ estado: 'erro', motivo: msg.motivo }];
    }
  } else if (model.estado === 'inicial' && msg.type === 'CRIADO') {
    return [{ estado: 'criado', container: msg.container }, buscarElementos];
  } else if (model.estado === 'criado' && msg.type === 'ELEMENTOS') {
    return [{ ...model, estado: 'elementos', ...msg.elementos }];
  } else if (model.estado === 'elementos' && msg.type === 'CLICADO') {
    return [
      {
        ...model,
        estado: 'buscandoFormularios',
        formularios: {
          cadastro: { estado: 'pendenteDados' },
          localizadoresOrgao: { estado: 'pendenteDados' },
          relatorioGeral: { estado: 'pendenteDadosVazios' },
          textosPadrao: { estado: 'pendenteDadosVazios' },
        },
      },
      buscarFormulariosVazios(model),
    ];
  } else if (model.estado === 'buscandoFormularios' && msg.type === 'CARREGADO_FORMULARIO_VAZIO') {
    return [
      {
        ...model,
        estado: 'buscandoFormularios',
        formularios: {
          ...model.formularios,
          [msg.formulario]: { estado: 'pendenteDados', url: msg.url, data: msg.data },
        },
      },
    ];
  } else if (model.estado === 'buscandoFormularios' && msg.type === 'DADOS_CARREGADOS') {
    return [
      {
        ...model,
        estado: 'buscandoFormularios',
        formularios: {
          ...model.formularios,
          [msg.formulario]: { estado: 'obtido', dados: msg.dados },
        },
      },
    ];
  } else return [model];
}

function view(dispatch: Dispatch<Msg>) {
  return (model: Model): void => {
    switch (model.estado) {
      case 'inicial':
        break;

      case 'criado':
        break;

      case 'elementos':
        render(Botao(dispatch), model.container);
        break;

      case 'buscandoFormularios':
        render(
          html`
            <p>Aguarde, carregando:</p>
            <dl>
              ${Carregando('Localizadores cadastrados', model.formularios.cadastro)}
              ${Carregando('Localizadores do órgão', model.formularios.localizadoresOrgao)}
              ${Carregando('Relatório geral', model.formularios.relatorioGeral)}
              ${Carregando('Textos padrão', model.formularios.textosPadrao)}
            </dl>
          `,
          model.container
        );
        break;

      case 'formularios':
        break;

      case 'erroContainer':
        render(MensagemErro(model.motivo), model.container);
        break;

      case 'erro':
      default:
        throw new Error('Ocorreu um erro durante o processamento do script.');
    }
  };
}

function Carregando(descricao: string, model: ModelPagina | ModelPaginaComFormulario) {
  return html`
    <dt>${descricao}</dt>
    <dd>
      ${model.estado === 'pendenteDadosVazios'
        ? 'Carregando formulário...'
        : model.estado === 'pendenteDados'
        ? 'Carregando dados...'
        : 'Ok.'}
    </dd>
  `;
}

function Botao(dispatch: Dispatch<Msg>) {
  return html`
    <button type="button" class="summa-dies__botao" @click=${() => dispatch(Msg.CLICADO())}>
      ${Logo()}Summa Dies
    </button>
  `;
}

async function criarContainer(dispatch: Dispatch<Msg>) {
  try {
    const formulario = await query('#frmLocalizadorLista');
    const container = document.createElement('div');
    formulario.insertAdjacentElement('beforebegin', container);
    dispatch(Msg.CRIADO(container));
  } catch (e) {
    logger.error(e);
    dispatch(Msg.ERRO('Não foi possível carregar os elementos necessários.'));
  }
}

async function buscarElementos(dispatch: Dispatch<Msg>) {
  try {
    const [areaTabela, botaoCadastro, menu] = await Promise.all(
      ['divInfraAreaTabela', 'btnNova', 'main-menu'].map(id => query(`#${id}`))
    );
    const [
      urlCadastro,
      urlLocalizadoresOrgao,
      urlTextosPadrao,
      urlRelatorioGeral,
    ] = await Promise.all([
      obterUrlCadastro(botaoCadastro),
      ...['localizador_orgao_listar', 'texto_padrao_listar', 'relatorio_geral_listar'].map(
        obterUrlMenu(menu)
      ),
    ]);
    dispatch(
      Msg.ELEMENTOS({
        areaTabela,
        urlCadastro,
        urlLocalizadoresOrgao,
        urlTextosPadrao,
        urlRelatorioGeral,
      })
    );
  } catch (e) {
    logger.error(e);
    dispatch(Msg.ERRO('Não foi possível carregar os elementos necessários.'));
  }
}

function buscarFormulariosVazios(model: ModelElementos) {
  return async function(dispatch: Dispatch<Msg>) {
    try {
      await Cancelable.all([
        new Cancelable(
          Promise.resolve<UrlData>({ url: model.urlCadastro, data: new FormData() })
        )
          .chain(
            info => (dispatch(Msg.CARREGADO_FORMULARIO_VAZIO('cadastro', info)), XHR(info.url))
          )
          .then(parsePaginaCadastroMeusLocalizadores)
          .then(dados => (dispatch(Msg.DADOS_CARREGADOS('cadastro', dados)), dados)),
        new Cancelable(
          Promise.resolve<UrlData>({
            url: model.urlLocalizadoresOrgao,
            data: obterFormularioVazioLocalizadoresOrgao(),
          })
        )
          .chain(
            info => (
              dispatch(Msg.CARREGADO_FORMULARIO_VAZIO('localizadoresOrgao', info)),
              XHR(info.url, 'POST', info.data)
            )
          )
          .then(parsePaginaLocalizadoresOrgao)
          .then(dados => (dispatch(Msg.DADOS_CARREGADOS('localizadoresOrgao', dados)), dados)),
        obterFormularioVazioTextosPadrao(model.urlTextosPadrao)
          .then(
            info => (
              dispatch(Msg.CARREGADO_FORMULARIO_VAZIO('textosPadrao', info)),
              XHR(info.url, 'POST', info.data)
            )
          )
          .then(parsePaginaTextosPadrao)
          .then(dados => (dispatch(Msg.DADOS_CARREGADOS('textosPadrao', dados)), dados)),
        obterFormularioVazioRelatorioGeral(model.urlRelatorioGeral)
          .then(
            info => (
              dispatch(Msg.CARREGADO_FORMULARIO_VAZIO('relatorioGeral', info)),
              XHR(info.url, 'POST', info.data)
            )
          )
          .then(parsePaginaRelatorioGeralLocalizador)
          .then(dados => (dispatch(Msg.DADOS_CARREGADOS('relatorioGeral', dados)), dados)),
      ]);
      //   const { urlCadastro, urlLocalizadoresOrgao, urlTextosPadrao, urlRelatorioGeral } = model;
      // const [
      //   { ocultarVazios, localizadores: meus },
      //   orgao,
      //   textosPadrao,
      //   infoRelatorioGeral,
      // ] = await Cancelable.all([
      //   XHR(urlCadastro)
      //     .then(parsePaginaCadastroMeusLocalizadores)
      //     .then(resultado => {
      //       render(Aguarde({ localizadoresCadastro: true }), model.container);
      //       return resultado;
      //     }),
      //   obterFormularioVazioLocalizadoresOrgao(urlLocalizadoresOrgao)
      //     .then(parsePaginaLocalizadoresOrgao)
      //     .then(resultado => {
      //       render(Aguarde({ localizadoresOrgao: true }), model.container);
      //       return resultado;
      //     }),
      //   obterFormularioVazioTextosPadrao(urlTextosPadrao)
      //     .then(parsePaginaTextosPadrao)
      //     .then(resultado => {
      //       render(Aguarde({ textosPadrao: true }), model.container);
      //       return resultado;
      //     }),
      //   obterFormularioVazioRelatorioGeral(urlRelatorioGeral).then(resultado => {
      //     render(Aguarde({ relatorioGeral: true }), model.container);
      //     return resultado;
      //   }),
      // ]);
      // logger.log('Textos padrão', textosPadrao);
      // const idsOrgao = new Map(orgao.map(loc => [loc.id, loc]));
      // const { left: desativados, right: localizadores } = partitionMap(meus, ({ id, siglaNome }) =>
      //   note(siglaNome, idsOrgao.get(id))
      // );
      // if (desativados.length > 0) {
      //   throw new Error(`Os seguintes localizadores foram desativados: ${desativados.join(', ')}`);
      // }
      // const dados = ocultarVazios
      //   ? localizadores.filter(({ quantidadeProcessos }) => quantidadeProcessos > 0)
      //   : localizadores;
      // model.container.textContent = '';
      // render(TabelaLocalizadores(dados, infoRelatorioGeral), model.areaTabela);
    } catch (e) {
      logger.error(e);
      dispatch(Msg.ERRO('Não foi possível obter os formulários necessários.'));
    }
  };
}

function obterFormularioVazioLocalizadoresOrgao() {
  const data = new FormData();
  data.append('hdnInfraCampoOrd', 'TotalProcessos');
  data.append('hdnInfraTipoOrd', 'DESC');
  data.append('hdnInfraPaginaAtual', '0');
  data.append('chkOcultarSemProcesso', '0');
  return data;
}

function obterFormularioVazio(key: string, url: string, fetch: () => Cancelable<UrlData>) {
  const hash = new URL(url).searchParams.get('hash');
  try {
    if (!hash) throw new Error();
    const [parsed] = [JSON.parse(sessionStorage.getItem(key) || '') as unknown]
      .filter(
        (x): x is { hash: unknown; url: unknown; data: unknown } =>
          typeof x === 'object' && x !== null && 'hash' in x && 'url' in x && 'data' in x
      )
      .filter(
        (x): x is { hash: string; url: string; data: [string, string][] } =>
          typeof x.hash === 'string' &&
          typeof x.url === 'string' &&
          Array.isArray(x.data) &&
          x.data.every(
            y =>
              Array.isArray(y) &&
              y.length === 2 &&
              typeof y[0] === 'string' &&
              typeof y[1] === 'string'
          )
      );
    if (parsed === undefined) throw new Error();
    if (parsed.hash !== hash) {
      sessionStorage.removeItem(key);
      throw new Error();
    }
    const data = new FormData();
    for (const [key, value] of parsed.data) {
      data.append(key, value);
    }
    logger.log('Dados recuperados', { url, data });
    return new Cancelable(
      Promise.resolve<UrlData>({ url: parsed.url, data })
    );
  } catch (_) {
    return fetch().then(fetched => {
      const save = { hash: hash!, url: fetched.url, data: [] as [string, string][] };
      for (const [key, value] of fetched.data) {
        if (typeof value === 'string') save.data.push([key, value]);
      }
      sessionStorage.setItem(key, JSON.stringify(save));
      logger.log('Dados salvos', save);
      return fetched;
    });
  }
}

function obterFormularioVazioTextosPadrao(url: string) {
  return obterFormularioVazio('summa-dies__textosPadrao', url, () =>
    new Cancelable<FormData>(mensagemIframe(`${url}#limpar`)).then<UrlData>(data => {
      data.set('txtDescricaoTexto', 'teste');
      data.set('selTipoPaginacao', '2');
      return { url, data };
    })
  );
}

function obterFormularioVazioRelatorioGeral(url: string) {
  return obterFormularioVazio(
    'summa-dies__relatorioGeral',
    url,
    () => new Cancelable(mensagemIframe(`${url}#limpar`))
  );
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

export async function meusLocalizadores() {
  await core<Model, Msg>(init, update, view);
}

async function obterUrlCadastro(btn: Element): Promise<string> {
  return (
    btn.getAttribute('onclick')?.match(/location.href='(.*)'/)?.[1] ||
    Promise.reject(new Error('URL não encontrada.'))
  );
}

function obterUrlMenu(menu: Element): (acao: string) => Promise<string> {
  const urls = queryAll<HTMLAnchorElement>('a[href]', menu)
    .map(link => link.href)
    .map(url => ({ url, acao: new URL(url).searchParams.get('acao') }));
  return async acao => {
    const filtradas = urls.filter(url => url.acao === acao);
    if (filtradas.length !== 1) throw new Error(`Link para a ação \`${acao}\` não encontrado.`);
    return filtradas[0].url;
  };
}
