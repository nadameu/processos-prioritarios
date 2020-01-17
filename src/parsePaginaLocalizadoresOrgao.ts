import { LocalizadorOrgao } from './Localizador';
import { query } from './query';
import { todosNaoNulos } from './todosNaoNulos';

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
  const checkbox = linha.cells[0].querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (checkbox === null) return null;
  const id = checkbox.value.split('-')[0];
  if (!/\d{30}/.test(id)) return null;

  // Sigla, nome, descricao, sistema
  const sigla = linha.cells[1].textContent?.trim();
  if (!sigla) return null;
  const nome = linha.cells[2].textContent?.trim();
  if (!nome) return null;
  const descricao = (linha.cells[3].textContent || '').trim() || undefined;
  const textoSistema = linha.cells[4].textContent?.trim();
  const sistema = textoSistema === 'Sim' ? true : textoSistema === 'Não' ? false : null;
  if (sistema === null) return null;

  // Quantidade de processos
  const quantidadeProcessos = Number(linha.cells[6].textContent);
  if (!Number.isInteger(quantidadeProcessos)) return null;

  const url = linha.cells[6].querySelector<HTMLAnchorElement>('a[href]')?.href;
  if (!url) return null;

  // Lembrete
  const lembrete =
    linha.cells[7]
      .querySelector(`.memoLocalizadorOrgao${id}`)
      ?.getAttribute('onmouseover')
      ?.match(/^return infraTooltipMostrar\('Obs: (.+) \/ .+?','',400\);$/)?.[1] ?? undefined;

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
