import { pipe } from 'adt-ts';
import * as preact from 'preact';
import { Either, Left, Right } from '../Either';
import { List } from '../List';
import {
  MeuLocalizador,
  MeuLocalizadorVazio,
  siglaNomeIguais,
  siglaNomeToTexto,
} from '../Localizador';
import {
  localizadoresFromOrgao,
  localizadoresFromPaginaCadastro,
  localizadoresFromTabela,
} from '../Localizadores';
import { query } from '../query';
import { queryAll } from '../queryAll';
import { XHR } from '../XHR';

export async function meusLocalizadores() {
  const barra = await query('#divInfraBarraComandosSuperior');
  const tabela = await query<HTMLTableElement>('table[summary="Tabela de Localizadores."]');
  const render = makeRender({ barra, tabela });
  render();
}

function makeRender({ barra, tabela }: { barra: Element; tabela: HTMLTableElement }) {
  const container = document.createElement('div');
  container.style.margin = '0 0 2em';
  barra.insertAdjacentElement('afterend', container);

  return () => preact.render(Botao({ onClick }), container);

  function onClick() {
    obterDadosMeusLocalizadores(tabela).catch(e => console.error(e));
  }
}

function Botao(props: { onClick: () => void }) {
  return (
    <button type="button" {...props}>
      Obter dados dos localizadores
    </button>
  );
}

async function obterDadosMeusLocalizadores(tabela: HTMLTableElement) {
  const localizadores = await localizadoresFromTabela(tabela);
  const [meus, orgao] = await Promise.all([
    correlacionar(localizadores),
    obterLocalizadoresOrgao(),
  ]);
  const idsOrgao = new Map(orgao.map(({ id }, i) => [id, i]));
  const desativados = meus.filter(({ id }) => !idsOrgao.has(id));
  if (desativados.length > 0)
    return Left(
      `Localizadores desativados:\n${desativados
        .map(({ siglaNome }) => siglaNomeToTexto(siglaNome))
        .join('\n')}.`
    );
  const cadastro = toMap(meus);
  // console.table(cadastro);
  console.table(orgao.filter(({ id }) => cadastro.has(id)));
}

async function correlacionar(localizadores: Array<MeuLocalizador | MeuLocalizadorVazio>) {
  const cadastro = await obterLocalizadoresCadastro();
  return Promise.all(
    localizadores.map(loc => {
      const correspondencias = cadastro.filter(cad =>
        siglaNomeIguais(loc.siglaNome, cad.siglaNome)
      );
      if (correspondencias.length !== 1)
        return Left(
          `Impossível achar localizador correspondente à sigla/nome ${siglaNomeToTexto(
            loc.siglaNome
          )}`
        );
      return Right(correspondencias[0]);
    })
  );
}

async function obterLocalizadoresCadastro() {
  const btn = await query('#btnNova');
  const onclick = btn.getAttribute('onclick') || '';
  const matchUrl = onclick.match(/location.href='(.*)'/);
  if (!matchUrl) return Promise.reject(new Error('URL não encontrada.'));
  const url = matchUrl[1];
  console.log('Buscando localizadores cadastrados...');
  const doc = await XHR(url);
  return localizadoresFromPaginaCadastro(doc);
}

async function obterLocalizadoresOrgao() {
  const menu = await query('[id="main-menu"]');
  const url = await pipe(
    () => queryAll<HTMLAnchorElement>('a[href]', menu),
    List.map(link => link.href),
    List.filter(url => /\?acao=localizador_orgao_listar&/.test(url)),
    List.index(0),
    Either.note('Link para a lista de localizadores do órgão não encontrado.')
  )();
  const data = new FormData();
  data.append('hdnInfraCampoOrd', 'TotalProcessos');
  data.append('hdnInfraTipoOrd', 'DESC');
  data.append('hdnInfraPaginaAtual', '0');
  console.log('Buscando localizadores do órgão...');
  const doc = await XHR(url, 'POST', data);
  return localizadoresFromOrgao(doc);
}

function toMap<a extends { id: string }>(array: a[]) {
  return new Map(array.map(x => [x.id, x]));
}
