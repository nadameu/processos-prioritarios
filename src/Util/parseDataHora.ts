export function parseDataHora(texto: string): Date {
  const [d, m, y, h, i, s] = texto.split(/\W/g).map(Number);
  return new Date(y, m - 1, d, h, i, s);
}
