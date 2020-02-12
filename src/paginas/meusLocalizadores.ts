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
  const [urlCadastro, urlLocalizadoresOrgao, urlTextosPadrao] = await Promise.all([
    obterUrlCadastro(botaoCadastro),
    obterUrlLocalizadoresOrgao(menu),
    obterUrlTextosPadrao(menu),
  ]);
  const container = document.createElement('div');
  formulario.insertAdjacentElement('beforebegin', container);
  render(
    Botao({ areaTabela, container, urlCadastro, urlLocalizadoresOrgao, urlTextosPadrao }),
    container
  );
}

async function obterUrlCadastro(btn: Element): Promise<string> {
  return (
    btn.getAttribute('onclick')?.match(/location.href='(.*)'/)?.[1] ||
    Promise.reject(new Error('URL não encontrada.'))
  );
}

async function obterUrlLocalizadoresOrgao(menu: Element): Promise<string> {
  const urls = queryAll<HTMLAnchorElement>('a[href]', menu)
    .map(link => link.href)
    .filter(url => /\?acao=localizador_orgao_listar&/.test(url));
  if (urls.length !== 1)
    throw new Error('Link para a lista de localizadores do órgão não encontrado.');
  return urls[0];
}

async function obterUrlTextosPadrao(menu: Element): Promise<string> {
  const urls = queryAll<HTMLAnchorElement>('a[href]', menu)
    .map(link => link.href)
    .filter(url => /\?acao=texto_padrao_listar&/.test(url));
  if (urls.length !== 1) throw new Error('Link para a lista de textos padrão não encontrado.');
  return urls[0];
}
