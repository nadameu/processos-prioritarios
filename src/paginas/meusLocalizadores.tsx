import * as preact from 'preact';
import { LocalizadorOrgao } from '../Localizador';
import { parsePaginaCadastro } from '../parsePaginaCadastro';
import { parsePaginaLocalizadoresOrgao } from '../parsePaginaLocalizadoresOrgao';
import { query } from '../query';
import { queryAll } from '../queryAll';
import { sequencePromisesObject } from '../sequencePromisesObject';
import { todosNaoNulos } from '../todosNaoNulos';
import { XHR } from '../XHR';
import './meusLocalizadores.scss';
import { TabelaLocalizadores } from '../componentes/TabelaLocalizadores';
import { logger } from '../logger';
import { Botao } from '../componentes/Botao';
import { Aguarde } from '../componentes/Aguarde';
import { MensagemErro } from '../componentes/MensagemErro';

export async function meusLocalizadores() {
  const { area, formulario, urlCadastro, urlLocalizadoresOrgao } = await sequencePromisesObject({
    area: query('#divInfraAreaTelaD'),
    formulario: query('#frmLocalizadorLista'),
    urlCadastro: obterUrlCadastro(),
    urlLocalizadoresOrgao: obterUrlLocalizadoresOrgao(),
  });
  const render = makeRender({ area, formulario, urlCadastro, urlLocalizadoresOrgao });
  render();
}

function makeRender({
  area,
  formulario,
  urlCadastro,
  urlLocalizadoresOrgao,
}: {
  area: Element;
  formulario: Element;
  urlCadastro: string;
  urlLocalizadoresOrgao: string;
}) {
  const container = document.createElement('div');
  formulario.insertAdjacentElement('beforebegin', container);

  return () => preact.render(<Botao onClick={onClick} />, container);

  function onClick() {
    renderAguarde()
      .then(() =>
        obterDadosMeusLocalizadores({
          area,
          urlCadastro,
          urlLocalizadoresOrgao,
        })
      )
      .catch((e: any) => {
        logger.error(e);
        if (e instanceof Error) renderErro({ msg: e.message });
        else renderErro({ msg: String(e) });
      });
  }

  async function renderAguarde() {
    preact.render(<Aguarde />, container);
  }

  async function renderErro({ msg }: { msg: string }) {
    preact.render(<MensagemErro>{msg}</MensagemErro>, container);
  }
}

async function obterDadosMeusLocalizadores({
  area,
  urlCadastro,
  urlLocalizadoresOrgao,
}: {
  area: Element;
  urlCadastro: string;
  urlLocalizadoresOrgao: string;
}) {
  const {
    meus: { ocultarVazios, ids: meus },
    orgao,
  } = await sequencePromisesObject({
    meus: obterIdsLocalizadoresCadastro(urlCadastro),
    orgao: obterLocalizadoresOrgao(urlLocalizadoresOrgao),
  });
  const mapa = toMap(orgao);
  const localizadores = await todosNaoNulos(
    meus.map(id => (mapa.has(id) ? (mapa.get(id) as LocalizadorOrgao) : null))
  );
  const localizadoresFiltrados = ocultarVazios
    ? localizadores.filter(({ quantidadeProcessos }) => quantidadeProcessos > 0)
    : localizadores;
  logger.table(
    localizadoresFiltrados.map(
      ({ siglaNome: { nome }, sistema, descricao, quantidadeProcessos }) => ({
        nome,
        sistema,
        descricao,
        quantidadeProcessos,
      })
    )
  );
  while (area.firstChild) {
    area.removeChild(area.firstChild);
  }
  preact.render(<TabelaLocalizadores dados={localizadoresFiltrados} />, area);
}

function obterIdsLocalizadoresCadastro(url: string) {
  logger.log('Buscando localizadores cadastrados...');
  return XHR(url).then(parsePaginaCadastro);
}

async function obterUrlCadastro() {
  const btn = await query('#btnNova');
  const onclick = btn.getAttribute('onclick') || '';
  const matchUrl = onclick.match(/location.href='(.*)'/);
  if (!matchUrl) throw new Error('URL não encontrada.');
  const url = matchUrl[1];
  return url;
}

function obterLocalizadoresOrgao(url: string) {
  const data = new FormData();
  data.append('hdnInfraCampoOrd', 'TotalProcessos');
  data.append('hdnInfraTipoOrd', 'DESC');
  data.append('hdnInfraPaginaAtual', '0');
  data.append('chkOcultarSemProcesso', '0');
  logger.log('Buscando localizadores do órgão...');
  return XHR(url, 'POST', data).then(parsePaginaLocalizadoresOrgao);
}

async function obterUrlLocalizadoresOrgao() {
  const menu = await query('[id="main-menu"]');
  const urls = queryAll<HTMLAnchorElement>('a[href]', menu)
    .map(link => link.href)
    .filter(url => /\?acao=localizador_orgao_listar&/.test(url));
  if (urls.length !== 1)
    throw new Error('Link para a lista de localizadores do órgão não encontrado.');
  const url = urls[0];
  return url;
}

function toMap<a extends { id: string }>(array: a[]) {
  return new Map(array.map(x => [x.id, x]));
}
