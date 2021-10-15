import * as console from './Console';
import { paginaPainelSecretariaListar } from './paginas/painel_secretaria_listar';

main();

function main() {
	const url = new URL(document.location.href);
	const params = url.searchParams;
	switch (params.get('acao')) {
		case 'painel_secretaria_listar':
			paginaPainelSecretariaListar(document);
			return;

		default:
			console.log('Página desconhecida.');
	}
}
