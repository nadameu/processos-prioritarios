import {
  localizadorFromLinha,
  localizadorFromLinhaCadastro,
  localizadorFromLinhaOrgao,
  LocalizadorOrgao,
  MeuLocalizador,
  MeuLocalizadorVazio,
} from './Localizador';
import { query } from './query';

declare const isLocalizadores: unique symbol;
export interface Localizadores {
  [isLocalizadores]: never;
}

export async function localizadoresFromTabela(
  tabela: HTMLTableElement
): Promise<Array<MeuLocalizadorVazio | MeuLocalizador>> {
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]');
  return todosNaoNulos(Array.from(linhas).map(localizadorFromLinha));
}

export async function localizadoresFromPaginaCadastro(doc: Document): Promise<MeuLocalizador[]> {
  const tabela = await query<HTMLTableElement>('table#tblLocalizadorOrgao', doc);
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]');
  return todosNaoNulos(Array.from(linhas).map(localizadorFromLinhaCadastro));
}

export async function localizadoresFromOrgao(doc: Document): Promise<LocalizadorOrgao[]> {
  const tabela = await query<HTMLTableElement>(
    'table[summary="Tabela de Localizadores do Órgão."]',
    doc
  );
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>(
    ':scope > tbody > tr[class^="infraTr"]'
  );
  return todosNaoNulos(Array.from(linhas).map(localizadorFromLinhaOrgao));
}

function particionarNulos<a>(valores: (a | null)[]): { validos: a[]; indicesNulos: number[] } {
  const validos: a[] = [];
  const indicesNulos: number[] = [];
  valores.forEach((x, i) => {
    if (x === null) indicesNulos.push(i);
    else validos.push(x);
  });
  return { validos, indicesNulos };
}

async function todosNaoNulos<a>(valores: (a | null)[]): Promise<a[]> {
  const { indicesNulos, validos } = particionarNulos(valores);
  if (indicesNulos.length > 0)
    throw new Error(`Erro(s) no(s) índice(s) ${indicesNulos.join(', ')}.`);
  return validos;
}
