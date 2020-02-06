import { Either, Left, Right, sequenceEithers } from '../Either';
import { LocalizadorOrgao } from '../Localizador';
import { query } from '../query';
import { safePipe } from '../safePipe';

export function parsePaginaLocalizadoresOrgao(doc: Document): Either<any, LocalizadorOrgao[]> {
  return query<HTMLTableElement>(
    'table[summary="Tabela de Localizadores do Órgão."]',
    doc
  ).chain(tabela =>
    sequenceEithers(
      Array.from(
        tabela.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr[class^="infraTr"]'),
        parseLinha
      )
    )
  );
}

function parseLinha(linha: HTMLTableRowElement): Either<Error, LocalizadorOrgao> {
  if (linha.cells.length !== 8) return Left(new Error('Esperadas 8 células.'));

  // Id
  const id = safePipe(
    linha.cells[0].querySelector<HTMLInputElement>('input[type="checkbox"]'),
    x => x.value.split('-')[0]
  );
  if (!id || !/\d{30}/.test(id)) return Left(new Error('Id desconhecido.'));

  // Sigla, nome, descricao, sistema
  const sigla = textoCelulaObrigatorio(linha, 1);
  if (!sigla) return Left(new Error('Sigla desconhecida.'));
  const nome = textoCelulaObrigatorio(linha, 2);
  if (!nome) return Left(new Error('Nome desconhecido.'));
  const descricao = textoCelulaObrigatorio(linha, 3) || undefined;
  const textoSistema = textoCelulaObrigatorio(linha, 4);
  const sistema = textoSistema === 'Sim' ? true : textoSistema === 'Não' ? false : null;
  if (sistema === null) return Left(new Error('Sistema desconhecido.'));

  // Quantidade de processos
  const quantidadeProcessos = Number(linha.cells[6].textContent);
  if (!Number.isInteger(quantidadeProcessos))
    return Left(new Error('Quantidade de processos desconhecida.'));

  const url = safePipe(linha.cells[6].querySelector<HTMLAnchorElement>('a[href]'), x => x.href);
  if (!url) return Left(new Error('Url desconhecida.'));

  // Lembrete
  const lembrete =
    safePipe(
      linha.cells[7].querySelector(`.memoLocalizadorOrgao${id}`),
      x => x.getAttribute('onmouseover'),
      x => x.match(/^return infraTooltipMostrar\('Obs: (.+) \/ .+?','',400\);$/),
      x => x[1]
    ) || undefined;

  return Right({
    id,
    url,
    siglaNome: { sigla, nome },
    descricao,
    sistema,
    lembrete,
    quantidadeProcessos,
  });
}

function textoCelulaObrigatorio(linha: HTMLTableRowElement, indice: number) {
  return safePipe(linha.cells[indice].textContent, x => x.trim()) || null;
}
