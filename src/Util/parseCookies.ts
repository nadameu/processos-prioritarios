import { parsePares } from './parsePares';

export function parseCookies(texto: string) {
  const pares = texto.split(/\s*;\s*/);
  return parsePares(pares);
}
