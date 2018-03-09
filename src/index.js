import LocalizadoresFactory from './LocalizadoresFactory';
import { adicionarBotaoComVinculo } from './helpers';

const safeQuery = selector =>
	Promise.resolve(
		document.querySelector(selector) ||
			Promise.reject(`Elemento não encontrado: ${selector}`)
	);

const url = new URL(location);
const acao = url.searchParams.get('acao');
const acaoOrigem = url.searchParams.get('acao_origem');

if (acao === 'usuario_tipo_monitoramento_localizador_listar') {
	const selector = '#divInfraAreaTabela table';
	safeQuery(selector).then(tabela => {
		const localizadores = LocalizadoresFactory.fromTabela(tabela);
		adicionarBotaoComVinculo(localizadores);
	});
} else if (acao === 'localizador_processos_lista') {
	/* do nothing */
} else if (acaoOrigem === 'principal') {
	const selector = '#fldLocalizadores table';
	safeQuery(selector).then(tabela => {
		const localizadores = LocalizadoresFactory.fromTabelaPainel(tabela);
		adicionarBotaoComVinculo(localizadores);
	});
}
