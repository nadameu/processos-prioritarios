import { A, applicativeEither, pipeValue } from 'adt-ts';
import * as preact from 'preact';
import { E, Left, Right, sequenceObject } from '../Either';
import * as F from '../Future';
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

export function meusLocalizadores() {
  return pipeValue({
    barra: query('#divInfraBarraComandosSuperior'),
    tabela: query<HTMLTableElement>('table[summary="Tabela de Localizadores."]'),
  }).pipe(
    sequenceObject,
    E.map(makeRender),
    E.map(render => render())
  );
}

function makeRender({ barra, tabela }: { barra: Element; tabela: HTMLTableElement }) {
  const container = document.createElement('div');
  container.style.margin = '0 0 2em';
  barra.insertAdjacentElement('afterend', container);

  return () => preact.render(Botao({ onClick }), container);

  function onClick() {
    obterDadosMeusLocalizadores(tabela).then(
      E.catchError(e => {
        console.error(e);
        return Right(undefined as void);
      })
    );
  }
}

function Botao(props: { onClick: () => void }) {
  return (
    <button type="button" {...props}>
      Obter dados dos localizadores
    </button>
  );
}

function obterDadosMeusLocalizadores(tabela: HTMLTableElement) {
  return pipeValue(tabela)
    .pipe(
      localizadoresFromTabela,
      E.traverse(F.applicativeFuture)(localizadores =>
        F.lift2(correlacionar(localizadores), obterLocalizadoresOrgao(), (meus, orgao) =>
          sequenceObject({ meus, orgao })
        )
      )
    )
    .map(E.join)
    .map(
      E.bind(({ meus, orgao }) => {
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
        return Right(undefined as void);
      })
    );
}

function correlacionar(localizadores: Array<MeuLocalizador | MeuLocalizadorVazio>) {
  return obterLocalizadoresCadastro().map(
    E.bind(cadastro =>
      pipeValue(localizadores).pipe(
        A.traverse(applicativeEither)(loc => {
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
      )
    )
  );
}

function obterLocalizadoresCadastro() {
  return pipeValue(query('#btnNova'))
    .pipe(
      E.bind(btn => {
        const onclick = btn.getAttribute('onclick') || '';
        const matchUrl = onclick.match(/location.href='(.*)'/);
        if (!matchUrl) return Left('URL não encontrada.');
        const url = matchUrl[1];
        console.log('Buscando localizadores cadastrados...');
        return Right(url);
      }),
      E.traverse(F.applicativeFuture)(XHR)
    )
    .map(E.join)
    .map(E.bind(localizadoresFromPaginaCadastro));
}

function obterLocalizadoresOrgao() {
  return pipeValue(query('[id="main-menu"]'))
    .pipe(
      E.bind(menu => {
        const urls = queryAll<HTMLAnchorElement>('a[href]', menu)
          .map(link => link.href)
          .filter(url => /\?acao=localizador_orgao_listar&/.test(url));
        if (urls.length !== 1)
          return Left('Link para a lista de localizadores do órgão não encontrado.');
        const url = urls[0];
        const data = new FormData();
        data.append('hdnInfraCampoOrd', 'TotalProcessos');
        data.append('hdnInfraTipoOrd', 'DESC');
        data.append('hdnInfraPaginaAtual', '0');
        console.log('Buscando localizadores do órgão...');
        return Right({ url, data });
      }),
      E.traverse(F.applicativeFuture)(({ url, data }) => XHR(url, 'POST', data))
    )
    .map(E.join)
    .map(E.bind(localizadoresFromOrgao));
}

function toMap<a extends { id: string }>(array: a[]) {
  return new Map(array.map(x => [x.id, x]));
}
