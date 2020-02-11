export function textoCelulaObrigatorio(linha: HTMLTableRowElement, indice: number) {
  return linha.cells[indice].textContent?.trim() || null;
}
