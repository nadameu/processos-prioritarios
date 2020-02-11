import { camposObrigatorios } from '../camposObrigatorios';
import { Left, Right } from '../Either';
import { MeuLocalizador } from '../Localizador';
import { partitionMap } from '../partitionMap';
import { query } from '../query';
import { textoCelulaObrigatorio } from '../textoCelulaObrigatorio';

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
  const { left, right: localizadores } = partitionMap(
    Array.from(linhas, meuLocalizadorFromLinha),
    (x, i) => {
      if (x == null) return Left(i);
      return Right(x);
    }
  );
  if (left.length > 0) throw new Error(`Erro nos índices ${left.join(', ')}.`);
  return {
    ocultarVazios,
    localizadores,
  };
}

function meuLocalizadorFromLinha(linha: HTMLTableRowElement): MeuLocalizador | null {
  if (linha.cells.length !== 4) return null;

  return camposObrigatorios({
    id: linha.cells[0].querySelector('div:nth-child(2)')?.textContent?.match(/^.(\d{30})$/)?.[1],
    siglaNome: textoCelulaObrigatorio(linha, 0),
    quantidadeProcessos: (x => (Number.isInteger(x) ? x : null))(
      Number(textoCelulaObrigatorio(linha, 1))
    ),
  });
}
