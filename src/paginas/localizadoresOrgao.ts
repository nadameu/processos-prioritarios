import { camposObrigatorios } from '../camposObrigatorios';
import { LocalizadorOrgao } from '../Localizador';
import { query } from '../query';
import { textoCelulaObrigatorio } from '../textoCelulaObrigatorio';
import { todosNaoNulos } from '../todosNaoNulos';

export async function parsePaginaLocalizadoresOrgao(doc: Document): Promise<LocalizadorOrgao[]> {
  const tabela = await query<HTMLTableElement>(
    'table[summary="Tabela de Localizadores do Órgão."]',
    doc
  );
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>(
    ':scope > tbody > tr[class^="infraTr"]'
  );
  return todosNaoNulos(Array.from(linhas, localizadorOrgaoFromLinha));
}

function localizadorOrgaoFromLinha(linha: HTMLTableRowElement): LocalizadorOrgao | null {
  if (linha.cells.length !== 8) return null;

  const id = idFromTexto(
    linha.cells[0]!.querySelector<HTMLInputElement>('input[type="checkbox"]')?.value.split('-')[0]
  );
  if (!id) return null;

  return camposObrigatorios(
    {
      id,
      url: linha.cells[6]!.querySelector<HTMLAnchorElement>('a[href]')?.href,
      siglaNome: camposObrigatorios(
        { sigla: textoCelulaObrigatorio(linha, 1), nome: textoCelulaObrigatorio(linha, 2) },
        ['sigla', 'nome']
      ),
      descricao: textoCelulaObrigatorio(linha, 3) || undefined,
      sistema: sistemaFromTexto(textoCelulaObrigatorio(linha, 4)),
      lembrete:
        linha.cells[7]!.querySelector(`.memoLocalizadorOrgao${id}`)
          ?.getAttribute('onmouseover')
          ?.match(/^return infraTooltipMostrar\('Obs: (.+) \/ .+?','',400\);$/)?.[1] || undefined,
      quantidadeProcessos: numeroInteiro(Number(linha.cells[6]!.textContent)),
    },
    ['id', 'url', 'siglaNome', 'sistema', 'quantidadeProcessos']
  );
}

function idFromTexto(texto: string | null | undefined): string | null {
  return texto && /\d{30}/.test(texto) ? texto : null;
}

function sistemaFromTexto(texto: string | null | undefined): boolean | null {
  return texto === 'Sim' ? true : texto === 'Não' ? false : null;
}

function numeroInteiro(num: number): number | null {
  return Number.isInteger(num) ? num : null;
}
