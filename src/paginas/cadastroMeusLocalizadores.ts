import { MeuLocalizador } from '../Localizador';
import { query } from '../query';
import { safePipe } from '../safePipe';

interface DadosCadastro {
  ocultarVazios: boolean;
  localizadores: MeuLocalizador[];
}

export async function parsePaginaCadastroMeusLocalizadores(doc: Document): Promise<DadosCadastro> {
  const cbox = await query<HTMLInputElement>('input#cbox[type="checkbox"]', doc);
  const tabela = await query<HTMLTableElement>('table#tblLocalizadorOrgao', doc);
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]');
  const ocultarVazios = cbox.checked;
  const localizadores = await Promise.all(Array.from(linhas, parseLinha));
  return {
    ocultarVazios,
    localizadores,
  };
}

async function parseLinha(linha: HTMLTableRowElement): Promise<MeuLocalizador> {
  if (linha.cells.length !== 4) throw new Error('Esperadas 4 células.');

  const id =
    safePipe(
      linha.cells[0].querySelector('div:nth-child(2)'),
      x => x.textContent,
      x => x.match(/^.(\d{30})$/),
      x => x[1]
    ) || null;
  if (id === null) throw new Error('Id desconhecido.');

  const siglaNome = safePipe(linha.cells[0].textContent, x => x.trim()) || null;
  if (siglaNome === null) throw new Error('Sigla/nome desconhecido(s).');

  const quantidadeProcessos = Number(linha.cells[1].textContent);
  if (!Number.isInteger(quantidadeProcessos))
    throw new Error('Quantidade de processos desconhecida.');

  return { id, siglaNome, quantidadeProcessos };
}
