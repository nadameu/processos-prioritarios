import { Either, Left, Right, sequenceEithers, sequenceValidationsObject } from '../Either';
import { MeuLocalizador } from '../Localizador';
import { query } from '../query';
import { safePipe } from '../safePipe';

interface DadosCadastro {
  ocultarVazios: boolean;
  localizadores: MeuLocalizador[];
}

export function parsePaginaCadastroMeusLocalizadores(doc: Document): Either<any, DadosCadastro> {
  return sequenceValidationsObject({
    cbox: query<HTMLInputElement>('input#cbox[type="checkbox"]', doc),
    tabela: query<HTMLTableElement>('table#tblLocalizadorOrgao', doc),
  }).chain(
    ({ cbox, tabela }): Either<any, DadosCadastro> => {
      const linhas = tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]');
      const ocultarVazios = cbox.checked;
      return sequenceEithers(Array.from(linhas, parseLinha)).map(localizadores => ({
        ocultarVazios,
        localizadores,
      }));
    }
  );
}

function parseLinha(linha: HTMLTableRowElement): Either<Error, MeuLocalizador> {
  if (linha.cells.length !== 4) return Left(new Error('Esperadas 4 células.'));

  const id =
    safePipe(
      linha.cells[0].querySelector('div:nth-child(2)'),
      x => x.textContent,
      x => x.match(/^.(\d{30})$/),
      x => x[1]
    ) || null;
  if (id === null) return Left(new Error('Id desconhecido.'));

  const siglaNome = safePipe(linha.cells[0].textContent, x => x.trim()) || null;
  if (siglaNome === null) return Left(new Error('Sigla/nome desconhecido(s).'));

  const quantidadeProcessos = Number(linha.cells[1].textContent);
  if (!Number.isInteger(quantidadeProcessos))
    return Left(new Error('Quantidade de processos desconhecida.'));

  return Right({ id, siglaNome, quantidadeProcessos });
}
