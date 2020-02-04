import { query } from './query';
import { safePipe } from './safePipe';
import { sequencePromisesObject } from './sequencePromisesObject';
import { todosNaoNulos } from './todosNaoNulos';

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
  return (
    safePipe(
      linha.cells[0].querySelector('div:nth-child(2)'),
      x => x.textContent,
      x => x.match(/^.(\d{30})$/),
      x => x[1]
    ) || null
  );
}
