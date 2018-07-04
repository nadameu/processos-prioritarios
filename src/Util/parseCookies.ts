import { parsePares } from './parsePares';

export function parseCookies(texto) {
	var pares = texto.split(/\s*;\s*/);
	return parsePares(pares);
}
