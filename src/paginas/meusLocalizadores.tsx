import * as preact from 'preact';
import { parsePaginaLocalizadoresOrgao } from '../parsePaginaLocalizadoresOrgao';
import { parsePaginaCadastro } from '../parsePaginaCadastro';
import { query } from '../query';
import { queryAll } from '../queryAll';
import { sequencePromisesObject } from '../sequencePromisesObject';
import { XHR } from '../XHR';
import { LocalizadorOrgao } from '../Localizador';
import { todosNaoNulos } from '../todosNaoNulos';

export async function meusLocalizadores() {
  const { barra, urlCadastro, urlLocalizadoresOrgao } = await sequencePromisesObject({
    barra: query('#divInfraBarraComandosSuperior'),
    urlCadastro: obterUrlCadastro(),
    urlLocalizadoresOrgao: obterUrlLocalizadoresOrgao(),
  });
  const render = makeRender({ barra, urlCadastro, urlLocalizadoresOrgao });
  render();
}

function makeRender({
  barra,
  urlCadastro,
  urlLocalizadoresOrgao,
}: {
  barra: Element;
  urlCadastro: string;
  urlLocalizadoresOrgao: string;
}) {
  const container = document.createElement('div');
  container.style.margin = '0 0 2em';
  barra.insertAdjacentElement('afterend', container);

  return () => preact.render(Botao({ onClick }), container);

  function onClick() {
    obterDadosMeusLocalizadores({
      urlCadastro,
      urlLocalizadoresOrgao,
    }).catch(e => {
      console.error(e);
    });
  }
}

function Botao(props: { onClick: () => void }) {
  return (
    <button type="button" {...props}>
      Obter dados dos localizadores
    </button>
  );
}

async function obterDadosMeusLocalizadores({
  urlCadastro,
  urlLocalizadoresOrgao,
}: {
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
  console.table(
    localizadores
      .filter(x => (ocultarVazios && x.quantidadeProcessos === 0 ? false : true))
      .map(({ siglaNome: { nome }, sistema, descricao, quantidadeProcessos }) => ({
        nome,
        sistema,
        descricao,
        quantidadeProcessos,
      }))
  );
}

function obterIdsLocalizadoresCadastro(url: string) {
  console.log('Buscando localizadores cadastrados...');
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
  console.log('Buscando localizadores do órgão...');
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
