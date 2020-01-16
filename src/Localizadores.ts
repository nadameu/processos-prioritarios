import { Either, Left, Right, E } from './Either';
import {
  localizadorFromLinha,
  localizadorFromLinhaCadastro,
  localizadorFromLinhaOrgao,
  LocalizadorOrgao,
  MeuLocalizador,
  MeuLocalizadorVazio,
} from './Localizador';
import { query } from './query';
import { pipeValue } from 'adt-ts';

declare const isLocalizadores: unique symbol;
export interface Localizadores {
  [isLocalizadores]: never;
}

export function localizadoresFromTabela(
  tabela: HTMLTableElement
): Either<string, Array<MeuLocalizadorVazio | MeuLocalizador>> {
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]');
  const localizadores = Array.from(linhas).map(localizadorFromLinha);
  const indicesErros = localizadores.reduceRight(
    (acc: number[], x, i) => (x === null ? [i, ...acc] : acc),
    []
  );
  if (indicesErros.length > 0) return Left(`Erro(s) no(s) índice(s) ${indicesErros.join(', ')}.`);
  return Right(localizadores as (MeuLocalizadorVazio | MeuLocalizador)[]);
}

export function localizadoresFromPaginaCadastro(doc: Document): Either<string, MeuLocalizador[]> {
  return pipeValue(query<HTMLTableElement>('table#tblLocalizadorOrgao', doc)).pipe(
    E.bind(table => {
      const linhas = table.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]');
      const localizadores = Array.from(linhas).map(localizadorFromLinhaCadastro);
      const indicesErros = localizadores.reduceRight(
        (acc: number[], x, i) => (x === null ? [i, ...acc] : acc),
        []
      );
      if (indicesErros.length > 0)
        return Left(`Erro(s) no(s) índice(s) ${indicesErros.join(', ')}.`);
      return Right(localizadores as MeuLocalizador[]);
    })
  );
}

export function localizadoresFromOrgao(doc: Document): Either<string, LocalizadorOrgao[]> {
  return pipeValue(
    query<HTMLTableElement>('table[summary="Tabela de Localizadores do Órgão."]', doc)
  ).pipe(
    E.bind(table => {
      const linhas = table.querySelectorAll<HTMLTableRowElement>(
        ':scope > tbody > tr[class^="infraTr"]'
      );
      const localizadores = Array.from(linhas).map(localizadorFromLinhaOrgao);
      const indicesErros = localizadores.reduceRight(
        (acc: number[], x, i) => (x === null ? [i, ...acc] : acc),
        []
      );
      if (indicesErros.length > 0)
        return Left(`Erro(s) no(s) índice(s) ${indicesErros.join(', ')}.`);
      return Right(localizadores as LocalizadorOrgao[]);
    })
  );
}
