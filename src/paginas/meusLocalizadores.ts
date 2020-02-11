import { render } from 'lit-html';
import { Botao } from '../componentes/Botao';
import { query } from '../query';
import { queryAll } from '../queryAll';
import { safePipe } from '../safePipe';
import './meusLocalizadores.scss';

export async function meusLocalizadores() {
  const formulario = await query('#frmLocalizadorLista');
  const areaTabela = await query('#divInfraAreaTabela');
  const tabela = await query('table[summary="Tabela de Localizadores."]');
  const urlCadastro = await query('#btnNova').then(obterUrlCadastro);
  const urlLocalizadoresOrgao = await query('[id="main-menu"]').then(obterUrlLocalizadoresOrgao);

  const container = document.createElement('div');
  formulario.insertAdjacentElement('beforebegin', container);

  render(Botao({ areaTabela, container, tabela, urlCadastro, urlLocalizadoresOrgao }), container);
}

async function obterUrlCadastro(btn: Element): Promise<string> {
  const url = safePipe(
    btn.getAttribute('onclick'),
    x => x.match(/location.href='(.*)'/),
    x => x[1]
  );
  if (!url) throw new Error('URL não encontrada.');
  return url;
}

async function obterUrlLocalizadoresOrgao(menu: Element): Promise<string> {
  const urls = queryAll<HTMLAnchorElement>('a[href]', menu)
    .map(link => link.href)
    .filter(url => /\?acao=localizador_orgao_listar&/.test(url));
  if (urls.length !== 1)
    throw new Error('Link para a lista de localizadores do órgão não encontrado.');
  return urls[0];
}
