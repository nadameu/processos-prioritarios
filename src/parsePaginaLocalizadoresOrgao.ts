import { LocalizadorOrgao } from './Localizador';
import { query } from './query';
import { todosNaoNulos } from './todosNaoNulos';
import { safePipe } from './safePipe';

export async function parsePaginaLocalizadoresOrgao(doc: Document): Promise<LocalizadorOrgao[]> {
  const tabela = await query<HTMLTableElement>(
    'table[summary="Tabela de Localizadores do Órgão."]',
    doc
  );
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>(
    ':scope > tbody > tr[class^="infraTr"]'
  );
  return todosNaoNulos(Array.from(linhas).map(localizadorFromLinhaOrgao));
}

function localizadorFromLinhaOrgao(linha: HTMLTableRowElement): LocalizadorOrgao | null {
  if (linha.cells.length !== 8) return null;

  // Id
  const id = safePipe(
    linha.cells[0].querySelector<HTMLInputElement>('input[type="checkbox"]'),
    x => x.value.split('-')[0]
  );
  if (!id || !/\d{30}/.test(id)) return null;

  // Sigla, nome, descricao, sistema
  const sigla = textoCelulaObrigatorio(linha, 1);
  if (!sigla) return null;
  const nome = textoCelulaObrigatorio(linha, 2);
  if (!nome) return null;
  const descricao = textoCelulaObrigatorio(linha, 3) || undefined;
  const textoSistema = textoCelulaObrigatorio(linha, 4);
  const sistema = textoSistema === 'Sim' ? true : textoSistema === 'Não' ? false : null;
  if (sistema === null) return null;

  // Quantidade de processos
  const quantidadeProcessos = Number(linha.cells[6].textContent);
  if (!Number.isInteger(quantidadeProcessos)) return null;

  const url = safePipe(linha.cells[6].querySelector<HTMLAnchorElement>('a[href]'), x => x.href);
  if (!url) return null;

  // Lembrete
  const lembrete =
    safePipe(
      linha.cells[7].querySelector(`.memoLocalizadorOrgao${id}`),
      x => x.getAttribute('onmouseover'),
      x => x.match(/^return infraTooltipMostrar\('Obs: (.+) \/ .+?','',400\);$/),
      x => x[1]
    ) || undefined;

  return {
    id,
    url,
    siglaNome: { sigla, nome },
    descricao,
    sistema,
    lembrete,
    quantidadeProcessos,
  };
}

function textoCelulaObrigatorio(linha: HTMLTableRowElement, indice: number) {
  return safePipe(linha.cells[indice].textContent, x => x.trim()) || null;
}
