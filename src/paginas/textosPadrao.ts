import { camposObrigatorios } from '../camposObrigatorios';
import { note } from '../Either';
import { partitionMap } from '../partitionMap';
import { query } from '../query';
import { textoCelulaObrigatorio } from '../textoCelulaObrigatorio';
import { TextoPadrao } from '../TextoPadrao';

export async function parsePaginaTextosPadrao(doc: Document): Promise<TextoPadrao[]> {
  const tabela = await query<HTMLTableElement>('table[summary="Tabela de Textos Padrão"]', doc);
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>(
    ':scope > tbody > tr[class^="infraTr"]'
  );
  const { left, right } = partitionMap(Array.from(linhas), (x, i) =>
    note(i, textoPadraoFromLinha(x))
  );
  if (left.length > 0) throw new Error(`Erro nos índices ${left.join(', ')}.`);
  else return right;
}

function textoPadraoFromLinha(linha: HTMLTableRowElement): TextoPadrao | null {
  if (linha.cells.length !== 11) return null;
  return camposObrigatorios(
    {
      codigo: textoCelulaObrigatorio(linha, 2),
      url: linha.cells[2].querySelector<HTMLAnchorElement>('a[href]')?.href || null,
      descricao: textoCelulaObrigatorio(linha, 3),
      sigla: textoCelulaObrigatorio(linha, 4) || undefined,
    },
    ['codigo', 'url', 'descricao']
  );
}
