import { query } from '../query';

export async function parsePaginaRelatorioGeralLocalizador(doc: Document) {
  const caption = await query<HTMLTableCaptionElement>(
    'table#tabelaLocalizadores > caption.infraCaption',
    doc
  ).catch(async () => {
    const areaTabela = await query('#divInfraAreaTabela', doc);
    if (areaTabela.childNodes.length <= 3) return areaTabela.firstElementChild!;
    else throw new Error();
  });
  return await (caption.textContent?.trim() || Promise.reject('Sem texto.'));
}
