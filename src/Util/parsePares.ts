export function parsePares(pares) {
	return pares.reduce((obj, par) => {
		let nome, valores, valor;
		[nome, ...valores] = par.split('=');
		nome = unescape(nome);
		valor = unescape(valores.join('='));
		obj[nome] = valor;
		return obj;
	}, {});
}
