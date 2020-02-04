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
import { TabelaLocalizadores } from './TabelaLocalizadores';
import { logger } from '../logger';

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

  return () => preact.render(Botao({ onClick }), container);

  function onClick() {
    obterDadosMeusLocalizadores({
      area,
      urlCadastro,
      urlLocalizadoresOrgao,
    }).catch(e => {
      logger.error(e);
    });
  }
}

function Botao(props: { onClick: () => void }) {
  return (
    <button type="button" class="summa-dies__botao" {...props}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="summa-dies__logo">
        <path
          class="summa-dies__logo__desenho"
          d="M64 80V16c0-8.844 7.156-16 16-16s16 7.156 16 16v64c0 8.844-7.156 16-16 16s-16-7.156-16-16zm272 16c8.844 0 16-7.156 16-16V16c0-8.844-7.156-16-16-16s-16 7.156-16 16v64c0 8.844 7.156 16 16 16zm176 288c0 70.688-57.313 128-128 128s-128-57.313-128-128 57.313-128 128-128 128 57.313 128 128zm-32 0c0-52.938-43.063-96-96-96s-96 43.063-96 96 43.063 96 96 96 96-43.062 96-96zM128 192H64v64h64v-64zM64 352h64v-64H64v64zm96-96h64v-64h-64v64zm0 96h64v-64h-64v64zM32 380.813V160h352v64h32V99.188C416 79.75 400.5 64 381.344 64H368v16c0 17.625-14.344 32-32 32s-32-14.375-32-32V64H112v16c0 17.625-14.344 32-32 32S48 97.625 48 80V64H34.672C15.516 64 0 79.75 0 99.188v281.625C0 400.188 15.516 416 34.672 416H224v-32H34.672c-1.453 0-2.672-1.5-2.672-3.187zM320 256v-64h-64v64h64zm131.875 96.813c-6.25-6.25-16.375-6.25-22.625 0l-56.563 56.563-33.938-33.938c-6.25-6.25-16.375-6.25-22.625 0s-6.25 16.375 0 22.625l45.25 45.25c3.125 3.125 7.219 4.688 11.313 4.688s8.188-1.563 11.313-4.688l67.875-67.875c6.25-6.25 6.25-16.375 0-22.625z"
        ></path>
      </svg>
      Summa Dies
    </button>
  );
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
  preact.render(<TabelaLocalizadores dados={localizadoresFiltrados}></TabelaLocalizadores>, area);
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
