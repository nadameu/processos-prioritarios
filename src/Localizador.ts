export interface SiglaNomeSeparados {
  sigla: string;
  nome: string;
}

export type SiglaNome = string | SiglaNomeSeparados;

export interface MeuLocalizadorVazio {
  siglaNome: SiglaNome;
}

export interface MeuLocalizador extends MeuLocalizadorVazio {
  id: string;
  quantidadeProcessos: number;
}

export interface LocalizadorOrgao extends MeuLocalizador {
  descricao: string | null;
  sistema: boolean;
  lembrete: string | null;
}

export type Localizador = MeuLocalizadorVazio | MeuLocalizador | LocalizadorOrgao;

export function localizadorFromLinha(
  linha: HTMLTableRowElement
): MeuLocalizadorVazio | MeuLocalizador | null {
  if (linha.cells.length !== 2) return null;
  const siglaNome = linha.cells[0].textContent || '';
  const [sigla, nome] = siglaNomeFromTexto(siglaNome) || [];
  const link = linha.cells[1].querySelector('a');
  if (!link) return null;
  const quantidadeProcessos = Number(link.textContent);
  if (!Number.isInteger(quantidadeProcessos)) return null;
  const href = link.href;
  const id = href === '' ? undefined : new URL(href).searchParams.get('selLocalizador');
  if (id === null) return null;
  if (sigla && nome) return { id, siglaNome: { sigla, nome }, quantidadeProcessos };
  return { id, siglaNome, quantidadeProcessos };
}

export function localizadorFromLinhaCadastro(linha: HTMLTableRowElement): MeuLocalizador | null {
  if (linha.cells.length !== 4) return null;
  const matchId = linha.cells[0]
    .querySelector('div:nth-child(2)')
    ?.textContent?.match(/^.(\d{30})$/);
  if (!matchId) return null;
  const id = matchId[1];
  const siglaNome = linha.cells[0].querySelector('.desc')?.textContent?.trim();
  if (!siglaNome) return null;
  const [sigla, nome] = siglaNomeFromTexto(siglaNome) || [];
  const quantidadeProcessos = Number(linha.cells[1].textContent);
  if (!Number.isInteger(quantidadeProcessos)) return null;
  if (sigla && nome) return { id, siglaNome: { sigla, nome }, quantidadeProcessos };
  return { id, siglaNome, quantidadeProcessos };
}

export function localizadorFromLinhaOrgao(linha: HTMLTableRowElement): LocalizadorOrgao | null {
  if (linha.cells.length !== 8) return null;

  // Id
  const checkbox = linha.cells[0].querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (checkbox === null) return null;
  const id = checkbox.value.split('-')[0];
  if (!/\d{30}/.test(id)) return null;

  // Sigla, nome, descricao, sistema
  const sigla = linha.cells[1].textContent;
  const nome = linha.cells[2].textContent;
  const descricao = linha.cells[3].textContent?.trim() || null;
  const textoSistema = linha.cells[4].textContent || '';
  if (!/Sim|Não/.test(textoSistema)) return null;
  const sistema = textoSistema === 'Sim';

  // Quantidade de processos
  const quantidadeProcessos = Number(linha.cells[6].textContent);
  if (!Number.isInteger(quantidadeProcessos)) return null;

  // Lembrete
  const lembrete =
    linha.cells[7]
      .querySelector(`.memoLocalizadorOrgao${id}`)
      ?.getAttribute('onmouseover')
      ?.match(/^return infraTooltipMostrar\('Obs: (.+) \/ .+?','',400\);$/)?.[1] ?? null;

  if (sigla && nome)
    return {
      id,
      siglaNome: { sigla, nome },
      descricao,
      sistema,
      lembrete,
      quantidadeProcessos,
    };
  return null;
}

function siglaNomeFromTexto(texto: string) {
  const partes = texto.split(/ - /g);
  if (partes.length === 2) return partes as [string, string];
  return null;
}

export function siglaNomeIguais(x: SiglaNome, y: SiglaNome) {
  return siglaNomeToTexto(x) === siglaNomeToTexto(y);
}

export function siglaNomeToTexto(siglaNome: SiglaNome) {
  return typeof siglaNome === 'string' ? siglaNome : `${siglaNome.sigla} - ${siglaNome.nome}`;
}
