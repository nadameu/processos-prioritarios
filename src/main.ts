import { Either, Left, Right } from '../adt/Either';
import { LocalizadoresFactory } from './LocalizadoresFactory';
import { queryOne } from './Query/queryOne';
import adicionarBotaoComVinculo from './adicionarBotaoComVinculo';

export default function main(doc: Document): Either<Error, string | void> {
	const url = new URL(doc.URL);
	if (
		url.searchParams.get('acao') ===
		'usuario_tipo_monitoramento_localizador_listar'
	) {
		return queryOne<HTMLTableElement>('#divInfraAreaTabela table', doc)
			.map(LocalizadoresFactory.fromTabela)
			.chain(adicionarBotaoComVinculo);
	}
	if (url.searchParams.get('acao') === 'localizador_processos_lista') {
		return Right('Nada a fazer.');
	}
	if (url.searchParams.get('acao_origem') === 'principal') {
		return queryOne<HTMLTableElement>('#fldLocalizadores table', doc)
			.map(LocalizadoresFactory.fromTabelaPainel)
			.chain(adicionarBotaoComVinculo);
	}
	return Left(
		new Error(`Ação desconhecida: "${url.searchParams.get('acao')}".`)
	);
}
