import * as preact from 'preact';
import { Aguarde } from '../componentes/Aguarde';
import { Botao } from '../componentes/Botao';
import { MensagemErro } from '../componentes/MensagemErro';
import { TabelaLocalizadores } from '../componentes/TabelaLocalizadores';
import {
  Either,
  Left,
  partition,
  Right,
  sequenceValidations,
  sequenceValidationsObject,
} from '../Either';
import { LocalizadorOrgao } from '../Localizador';
import { logger } from '../logger';
import { query } from '../query';
import { queryAll } from '../queryAll';
import { safePipe } from '../safePipe';
import { sequenceXHR, XHR } from '../XHR';
import { parsePaginaCadastroMeusLocalizadores } from './cadastroMeusLocalizadores';
import { parsePaginaLocalizadoresOrgao } from './localizadoresOrgao';
import './meusLocalizadores.scss';

export async function meusLocalizadores() {
  const { area, formulario, urlCadastro, urlLocalizadoresOrgao } = await sequenceValidationsObject({
    area: query('#divInfraAreaTelaD'),
    formulario: query('#frmLocalizadorLista'),
    urlCadastro: query('#btnNova').chain(obterUrlCadastro),
    urlLocalizadoresOrgao: query('[id="main-menu"]').chain(obterUrlLocalizadoresOrgao),
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
    Promise.resolve()
      .then(async () => {
        preact.render(<Aguarde />, container);
        const [paginaCadastroMeusLocalizadores, paginaLocalizadoresOrgao] = await sequenceXHR([
          new XHR(urlCadastro),
          obterPaginaLocalizadoresOrgao(urlLocalizadoresOrgao),
        ]);
        const [{ ocultarVazios, localizadores: meus }, orgao] = await sequenceValidations([
          parsePaginaCadastroMeusLocalizadores(paginaCadastroMeusLocalizadores),
          parsePaginaLocalizadoresOrgao(paginaLocalizadoresOrgao),
        ]);
        const idsOrgao = new Map(orgao.map(loc => [loc.id, loc]));
        const { left: desativados, right: localizadores } = partition(
          meus.map(({ id, siglaNome }) =>
            idsOrgao.has(id) ? Right(idsOrgao.get(id) as LocalizadorOrgao) : Left(siglaNome)
          )
        );
        if (desativados.length > 0) {
          return Left(
            new Error(`Os seguintes localizadores foram desativados: ${desativados.join(', ')}`)
          );
        }
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

function obterUrlCadastro(btn: Element): Either<Error, string> {
  const url = safePipe(
    btn.getAttribute('onclick'),
    x => x.match(/location.href='(.*)'/),
    x => x[1]
  );
  if (!url) return Left(new Error('URL não encontrada.'));
  return Right(url);
}

function obterPaginaLocalizadoresOrgao(url: string) {
  const data = new FormData();
  data.append('hdnInfraCampoOrd', 'TotalProcessos');
  data.append('hdnInfraTipoOrd', 'DESC');
  data.append('hdnInfraPaginaAtual', '0');
  data.append('chkOcultarSemProcesso', '0');
  return new XHR(url, 'POST', data);
}

function obterUrlLocalizadoresOrgao(menu: Element): Either<Error, string> {
  const urls = queryAll<HTMLAnchorElement>('a[href]', menu)
    .map(link => link.href)
    .filter(url => /\?acao=localizador_orgao_listar&/.test(url));
  if (urls.length !== 1)
    return Left(new Error('Link para a lista de localizadores do órgão não encontrado.'));
  return Right(urls[0]);
}
