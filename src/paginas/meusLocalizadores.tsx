import * as preact from 'preact';
import { Array$traverseObject } from '../Array$traverseObject';
import { Cancelable } from '../Cancelable';
import { Aguarde } from '../componentes/Aguarde';
import { Botao } from '../componentes/Botao';
import { MensagemErro } from '../componentes/MensagemErro';
import { TabelaLocalizadores } from '../componentes/TabelaLocalizadores';
import { LocalizadorOrgao } from '../Localizador';
import { logger } from '../logger';
import { query } from '../query';
import { queryAll } from '../queryAll';
import { safePipe } from '../safePipe';
import { XHR } from '../XHR';
import { parsePaginaCadastroMeusLocalizadores } from './cadastroMeusLocalizadores';
import { parsePaginaLocalizadoresOrgao } from './localizadoresOrgao';
import './meusLocalizadores.scss';

export async function meusLocalizadores() {
  render({
    area: await query('#divInfraAreaTelaD'),
    formulario: await query('#frmLocalizadorLista'),
    urlCadastro: await query('#btnNova').then(obterUrlCadastro),
    urlLocalizadoresOrgao: await query('[id="main-menu"]').then(obterUrlLocalizadoresOrgao),
  });
}

function render({
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

  preact.render(<Botao onClick={onClick} />, container);

  async function onClick() {
    try {
      preact.render(<Aguarde />, container);
      const [{ ocultarVazios, localizadores: meus }, orgao] = await Cancelable.all([
        XHR(urlCadastro).then(parsePaginaCadastroMeusLocalizadores),
        obterPaginaLocalizadoresOrgao(urlLocalizadoresOrgao).then(parsePaginaLocalizadoresOrgao),
      ]);
      const idsOrgao = new Map(orgao.map(loc => [loc.id, loc]));
      const { desativados, localizadores } = Array$traverseObject(meus, ({ id, siglaNome }) =>
        idsOrgao.has(id)
          ? { localizadores: idsOrgao.get(id) as LocalizadorOrgao }
          : { desativados: siglaNome }
      );
      if (desativados) {
        throw new Error(`Os seguintes localizadores foram desativados: ${desativados.join(', ')}`);
      }
      const dados = ocultarVazios
        ? localizadores!.filter(({ quantidadeProcessos }) => quantidadeProcessos > 0)
        : localizadores!;
      area.textContent = '';
      preact.render(<TabelaLocalizadores dados={dados} />, area);
    } catch (e) {
      logger.error(e);
      preact.render(
        <MensagemErro>{e instanceof Error ? e.message : String(e)}</MensagemErro>,
        container
      );
    }
  }
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

function obterPaginaLocalizadoresOrgao(url: string) {
  const data = new FormData();
  data.append('hdnInfraCampoOrd', 'TotalProcessos');
  data.append('hdnInfraTipoOrd', 'DESC');
  data.append('hdnInfraPaginaAtual', '0');
  data.append('chkOcultarSemProcesso', '0');
  return XHR(url, 'POST', data);
}

async function obterUrlLocalizadoresOrgao(menu: Element): Promise<string> {
  const urls = queryAll<HTMLAnchorElement>('a[href]', menu)
    .map(link => link.href)
    .filter(url => /\?acao=localizador_orgao_listar&/.test(url));
  if (urls.length !== 1)
    throw new Error('Link para a lista de localizadores do órgão não encontrado.');
  return urls[0];
}
