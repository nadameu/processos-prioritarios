// import './meusLocalizadores.scss';
import * as React from 'jsx-dom';
import { Left } from '../Either';
import {
  localizadoresFromOrgao,
  localizadoresFromPaginaCadastro,
  localizadoresFromTabela
} from '../Localizadores';
import { query } from '../query';
import { XHR } from '../XHR';
import {
  MeuLocalizador,
  MeuLocalizadorVazio,
  siglaNomeIguais,
  siglaNomeToTexto
} from '../Localizador';

export async function meusLocalizadores() {
  const barra = await query('#divInfraBarraComandosSuperior');
  barra.insertAdjacentElement(
    'afterend',
    <div style={{ margin: '0 0 2em' }}>
      <button
        type="button"
        onClick={() => obterDadosMeusLocalizadores().catch(e => console.error(e))}
      >
        Obter dados dos localizadores
      </button>
    </div>
  );
}

async function obterDadosMeusLocalizadores() {
  const tabela = await query<HTMLTableElement>('table[summary="Tabela de Localizadores."]');
  const localizadores = await localizadoresFromTabela(tabela);
  const [meus, orgao] = await Promise.all([
    correlacionar(localizadores),
    obterLocalizadoresOrgao()
  ]);
  const idsOrgao = new Map(orgao.map(({ id }, i) => [id, i]));
  const desativados = meus.filter(({ id }) => !idsOrgao.has(id));
  if (desativados.length > 0)
    throw new Error(
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
  return localizadores.map(loc => {
    const correspondencias = cadastro.filter(cad => siglaNomeIguais(loc.siglaNome, cad.siglaNome));
    if (correspondencias.length !== 1)
      throw new Error(
        `Impossível achar localizador correspondente à sigla/nome ${siglaNomeToTexto(
          loc.siglaNome
        )}`
      );
    return correspondencias[0];
  });
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
  const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>('a[href]')).filter(x =>
    /\?acao=localizador_orgao_listar&/.test(x.href)
  );
  if (links.length !== 1)
    return Left('Link para a lista de localizadores do órgão não encontrado.');
  "infraAcaoOrdenar('TotalProcessos','DESC','Infra');";
  const url2 = links[0].href;
  const data = new FormData();
  data.append('hdnInfraCampoOrd', 'TotalProcessos');
  data.append('hdnInfraTipoOrd', 'DESC');
  data.append('hdnInfraPaginaAtual', '0');
  console.log('Buscando localizadores do órgão...');
  const doc2 = await XHR(url2, 'POST', data);
  return localizadoresFromOrgao(doc2);
}

function toMap<a extends { id: string }>(array: a[]) {
  return new Map(array.map(x => [x.id, x]));
}
