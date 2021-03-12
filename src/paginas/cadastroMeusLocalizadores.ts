import { camposObrigatorios } from '../camposObrigatorios';
import { MeuLocalizador } from '../Localizador';
import { query } from '../query';
import { textoCelulaObrigatorio } from '../textoCelulaObrigatorio';
import { todosNaoNulos } from '../todosNaoNulos';

interface DadosCadastro {
  ocultarVazios: boolean;
  localizadores: MeuLocalizador[];
}

export async function parsePaginaCadastroMeusLocalizadores(doc: Document): Promise<DadosCadastro> {
  const [cbox, tabela] = await Promise.all([
    query<HTMLInputElement>('input#cbox[type="checkbox"]', doc),
    query<HTMLTableElement>('table#tblLocalizadorOrgao', doc),
  ]);
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]');
  const ocultarVazios = cbox.checked;
  const localizadores = await todosNaoNulos(Array.from(linhas, meuLocalizadorFromLinha));
  return {
    ocultarVazios,
    localizadores,
  };
}

function meuLocalizadorFromLinha(linha: HTMLTableRowElement): MeuLocalizador | null {
  if (linha.cells.length !== 4) return null;

  return camposObrigatorios({
    id: linha.cells[0]?.querySelector('div:nth-child(2)')?.textContent?.match(/^.(\d{30})$/)?.[1],
    siglaNome: linha.cells[0]?.querySelector('div:nth-child(1)')?.textContent || null,
    quantidadeProcessos: (x => (Number.isInteger(x) ? x : null))(
      Number(textoCelulaObrigatorio(linha, 1))
    ),
  });
}
