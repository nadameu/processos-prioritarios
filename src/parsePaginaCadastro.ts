import { query } from './query';
import { todosNaoNulos } from './todosNaoNulos';
import { sequencePromisesObject } from './sequencePromisesObject';

export interface DadosPaginaCadastro {
  ocultarVazios: boolean;
  ids: string[];
}

export async function parsePaginaCadastro(doc: Document): Promise<DadosPaginaCadastro> {
  const { cbox, tabela } = await sequencePromisesObject({
    cbox: query<HTMLInputElement>('input#cbox[type="checkbox"]', doc),
    tabela: query<HTMLTableElement>('table#tblLocalizadorOrgao', doc),
  });
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]');
  const ids = await todosNaoNulos(Array.from(linhas).map(idFromLinhaCadastro));
  const ocultarVazios = cbox.checked;
  return { ocultarVazios, ids };
}

function idFromLinhaCadastro(linha: HTMLTableRowElement): string | null {
  if (linha.cells.length !== 4) return null;
  const id = linha.cells[0]
    .querySelector('div:nth-child(2)')
    ?.textContent?.match(/^.(\d{30})$/)?.[1];
  if (id === undefined) return null;
  return id;
}
