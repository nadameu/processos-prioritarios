import { Either } from './Either/Either';
import { Left } from './Either/Left';
import { Right } from './Either/Right';
import { chain } from './Either/chain';
import { map } from './Either/map';
import LocalizadoresFactory from './LocalizadoresFactory';
import { queryOne } from './Query/queryOne';
import { pipeline } from './Util/pipeline';
import adicionarBotaoComVinculo from './adicionarBotaoComVinculo';

export default function main(doc: Document): Either<Error, string | void> {
	const url = new URL(doc.URL);
	if (
		url.searchParams.get('acao') ===
		'usuario_tipo_monitoramento_localizador_listar'
	) {
		return pipeline(
			queryOne<HTMLTableElement>('#divInfraAreaTabela table', doc),
			map(LocalizadoresFactory.fromTabela),
			chain(adicionarBotaoComVinculo)
		);
	}
	if (url.searchParams.get('acao') === 'localizador_processos_lista') {
		return Right('Nada a fazer.');
	}
	if (url.searchParams.get('acao_origem') === 'principal') {
		return pipeline(
			queryOne<HTMLTableElement>('#fldLocalizadores table', doc),
			map(LocalizadoresFactory.fromTabelaPainel),
			chain(adicionarBotaoComVinculo)
		);
	}
	return Left(
		new Error(`Ação desconhecida: "${url.searchParams.get('acao')}".`)
	);
}
