export function parseDataHora(texto) {
	let [d, m, y, h, i, s] = texto.split(/\W/g);
	return new Date(y, m - 1, d, h, i, s);
}
