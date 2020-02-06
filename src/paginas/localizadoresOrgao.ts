import { LocalizadorOrgao } from '../Localizador';
import { query } from '../query';
import { safePipe } from '../safePipe';

export async function parsePaginaLocalizadoresOrgao(doc: Document): Promise<LocalizadorOrgao[]> {
  const tabela = await query<HTMLTableElement>(
    'table[summary="Tabela de Localizadores do Órgão."]',
    doc
  );
  const linhas = tabela.querySelectorAll<HTMLTableRowElement>(
    ':scope > tbody > tr[class^="infraTr"]'
  );
  return Promise.all(Array.from(linhas, parseLinha));
}

async function parseLinha(linha: HTMLTableRowElement): Promise<LocalizadorOrgao> {
  if (linha.cells.length !== 8) throw new Error('Esperadas 8 células.');

  // Id
  const id = safePipe(
    linha.cells[0].querySelector<HTMLInputElement>('input[type="checkbox"]'),
    x => x.value.split('-')[0]
  );
  if (!id || !/\d{30}/.test(id)) throw new Error('Id desconhecido.');

  // Sigla, nome, descricao, sistema
  const sigla = textoCelulaObrigatorio(linha, 1);
  if (!sigla) throw new Error('Sigla desconhecida.');
  const nome = textoCelulaObrigatorio(linha, 2);
  if (!nome) throw new Error('Nome desconhecido.');
  const descricao = textoCelulaObrigatorio(linha, 3) || undefined;
  const textoSistema = textoCelulaObrigatorio(linha, 4);
  const sistema = textoSistema === 'Sim' ? true : textoSistema === 'Não' ? false : null;
  if (sistema === null) throw new Error('Sistema desconhecido.');

  // Quantidade de processos
  const quantidadeProcessos = Number(linha.cells[6].textContent);
  if (!Number.isInteger(quantidadeProcessos))
    throw new Error('Quantidade de processos desconhecida.');

  const url = safePipe(linha.cells[6].querySelector<HTMLAnchorElement>('a[href]'), x => x.href);
  if (!url) throw new Error('Url desconhecida.');

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
