import preact, { ComponentChildren } from 'preact';
import { parsePaginaLocalizadoresOrgao } from '../parsePaginaLocalizadoresOrgao';
import { parsePaginaCadastro } from '../parsePaginaCadastro';
import { query } from '../query';
import { queryAll } from '../queryAll';
import { sequencePromisesObject } from '../sequencePromisesObject';
import { XHR } from '../XHR';
import { LocalizadorOrgao, siglaNomeToTexto } from '../Localizador';
import { todosNaoNulos } from '../todosNaoNulos';
import './meusLocalizadores.scss';
import { truthyKeys } from '../truthyKeys';

export async function meusLocalizadores() {
  const { area, barra, urlCadastro, urlLocalizadoresOrgao } = await sequencePromisesObject({
    area: query('#divInfraAreaTelaD'),
    barra: query('#divInfraBarraComandosSuperior'),
    urlCadastro: obterUrlCadastro(),
    urlLocalizadoresOrgao: obterUrlLocalizadoresOrgao(),
  });
  const render = makeRender({ area, barra, urlCadastro, urlLocalizadoresOrgao });
  render();
}

function makeRender({
  area,
  barra,
  urlCadastro,
  urlLocalizadoresOrgao,
}: {
  area: Element;
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
      area,
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
  console.table(
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

function TabelaLocalizadores({ dados }: { dados: LocalizadorOrgao[] }) {
  return (
    <table class="infraTable gmTabelaLocalizadores">
      <thead>
        <tr>
          <th class="infraTh">
            Nome
            <br />
            <small>Descrição</small>
          </th>
          <th class="infraTh">Lembrete</th>
          <th class="infraTh">Sistema</th>
          <th class="infraTh">Qtd. processos</th>
        </tr>
      </thead>
      <tbody>
        {dados.map(loc => (
          <LinhaLocalizador {...loc}></LinhaLocalizador>
        ))}
      </tbody>
    </table>
  );
}

function LinhaLocalizador({
  id,
  url,
  siglaNome,
  descricao,
  lembrete,
  sistema,
  quantidadeProcessos,
}: LocalizadorOrgao) {
  return (
    <tr class={truthyKeys({ infraTrClara: true, gmVazio: quantidadeProcessos === 0 })}>
      <td>
        <LinkLocalizador url={url}>{siglaNomeToTexto(siglaNome)}</LinkLocalizador>
        <br />
        {descricao ? <small>{descricao}</small> : null}
      </td>
      <td>
        {lembrete ? (
          <img
            src="infra_css/imagens/balao.gif"
            onMouseOver={() => (globalThis as any).infraTooltipMostrar(lembrete, 'Lembrete', 400)}
            onMouseOut={() => (globalThis as any).infraTooltipOcultar()}
          />
        ) : null}
      </td>
      <td>{sistema ? 'Sim' : 'Não'}</td>
      <td>
        <LinkLocalizador url={url}>{String(quantidadeProcessos)}</LinkLocalizador>
      </td>
    </tr>
  );
}

function LinkLocalizador({ url, children }: { children: string; url: string }) {
  return (
    <a href={url} target="_blank">
      {children}
    </a>
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
