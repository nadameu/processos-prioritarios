import * as preact from 'preact';
import { Aguarde } from '../componentes/Aguarde';
import { Botao } from '../componentes/Botao';
import { MensagemErro } from '../componentes/MensagemErro';
import { TabelaLocalizadores } from '../componentes/TabelaLocalizadores';
import { logger } from '../logger';
import { parsePaginaCadastro } from '../parsePaginaCadastro';
import { parsePaginaLocalizadoresOrgao } from '../parsePaginaLocalizadoresOrgao';
import { query } from '../query';
import { queryAll } from '../queryAll';
import { sequencePromisesObject } from '../sequencePromisesObject';
import { XHR } from '../XHR';
import './meusLocalizadores.scss';

export async function meusLocalizadores() {
  const { area, formulario, urlCadastro, urlLocalizadoresOrgao } = await sequencePromisesObject({
    area: query('#divInfraAreaTelaD'),
    formulario: query('#frmLocalizadorLista'),
    urlCadastro: obterUrlCadastro(),
    urlLocalizadoresOrgao: obterUrlLocalizadoresOrgao(),
  });
  render({ area, formulario, urlCadastro, urlLocalizadoresOrgao });
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

  function onClick() {
    preact.render(<Aguarde />, container);
    Promise.resolve()
      .then(async () => {
        const [{ ocultarVazios, ids: meus }, orgao] = await Promise.all([
          XHR(urlCadastro).then(parsePaginaCadastro),
          obterPaginaLocalizadoresOrgao(urlLocalizadoresOrgao).then(parsePaginaLocalizadoresOrgao),
        ]);
        const idsOrgao = new Set(orgao.map(({ id }) => id));
        const meusLocalizadoresDesativados = meus.filter(id => !idsOrgao.has(id));
        if (meusLocalizadoresDesativados.length > 0) {
          throw new Error(
            `Os seguintes localizadores foram desativados: ${meusLocalizadoresDesativados.join(
              ', '
            )}`
          );
        }
        const idsMeusLocalizadores = new Set(meus);
        const localizadores = orgao.filter(({ id }) => idsMeusLocalizadores.has(id));
        const dados = ocultarVazios
          ? localizadores.filter(({ quantidadeProcessos }) => quantidadeProcessos > 0)
          : localizadores;
        area.textContent = '';
        preact.render(<TabelaLocalizadores dados={dados} />, area);
      })
      .catch((e: unknown) => {
        logger.error(e);
        preact.render(
          <MensagemErro>{e instanceof Error ? e.message : String(e)}</MensagemErro>,
          container
        );
      });
  }
}

async function obterUrlCadastro() {
  const btn = await query('#btnNova');
  const onclick = btn.getAttribute('onclick') || '';
  const matchUrl = onclick.match(/location.href='(.*)'/);
  if (!matchUrl) throw new Error('URL não encontrada.');
  const url = matchUrl[1];
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
