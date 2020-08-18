import { parsePares } from './parsePares';

export function parseCookies(texto: string) {
	var pares = texto.split(/\s*;\s*/);
	return parsePares(pares);
}