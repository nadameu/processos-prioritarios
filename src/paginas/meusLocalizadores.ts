import { render } from 'lit-html';
import { Botao } from '../componentes/Botao';
import { query } from '../query';
import { queryAll } from '../queryAll';
import './meusLocalizadores.scss';

export async function meusLocalizadores() {
  const [formulario, areaTabela, botaoCadastro, menu] = await Promise.all(
    ['#frmLocalizadorLista', '#divInfraAreaTabela', '#btnNova', '[id="main-menu"]'].map(sel =>
      query(sel)
    )
  );
  const [
    urlCadastro,
    urlLocalizadoresOrgao,
    urlTextosPadrao,
    urlRelatorioGeral,
  ] = await Promise.all([
    obterUrlCadastro(botaoCadastro),
    obterUrlLocalizadoresOrgao(menu),
    obterUrlTextosPadrao(menu),
    obterUrlRelatorioGeral(menu),
  ]);
  const container = document.createElement('div');
  formulario.insertAdjacentElement('beforebegin', container);
  render(
    Botao({
      areaTabela,
      container,
      urlCadastro,
      urlLocalizadoresOrgao,
      urlTextosPadrao,
      urlRelatorioGeral,
    }),
    container
  );
}

async function obterUrlCadastro(btn: Element): Promise<string> {
  return (
    btn.getAttribute('onclick')?.match(/location.href='(.*)'/)?.[1] ||
    Promise.reject(new Error('URL não encontrada.'))
  );
}

async function obterUrlLocalizadoresOrgao(menu: Element) {
  return obterUrlMenu(menu, 'localizador_orgao_listar');
}

function obterUrlTextosPadrao(menu: Element) {
  return obterUrlMenu(menu, 'texto_padrao_listar');
}

function obterUrlRelatorioGeral(menu: Element) {
  return obterUrlMenu(menu, 'relatorio_geral_listar');
}

async function obterUrlMenu(menu: Element, acao: string): Promise<string> {
  const urls = queryAll<HTMLAnchorElement>('a[href]', menu)
    .map(link => link.href)
    .filter(url => new RegExp(`\\?acao=${acao}&`).test(url));
  if (urls.length !== 1) throw new Error(`Link para a ação \`${acao}\` não encontrado.`);
  return urls[0];
}
