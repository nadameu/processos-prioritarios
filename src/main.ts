import { Either, Left, Right } from '../adt/Either';
import adicionarBotaoComVinculo from './adicionarBotaoComVinculo';
import { Localizadores, LocalizadoresFactory } from './LocalizadoresFactory';
import { queryOne } from './Query/queryOne';

export default function main(doc: Document): Either<Error, string> {
	const analisar = (
		parentSelector: string,
		factory: (_: HTMLTableElement) => Localizadores
	): Either<Error, string> =>
		queryOne<HTMLTableElement>(`${parentSelector} table`, doc)
			.map(tbl => Right(tbl) as Either<Error, HTMLTableElement>)
			.getOrElse(Left(new Error('Tabela não localizada.')))
			.map(factory)
			.chain(adicionarBotaoComVinculo);

	const url = new URL(doc.URL);
	const params = url.searchParams;
	const acao = params.get('acao');
	if (acao === 'usuario_tipo_monitoramento_localizador_listar') {
		return analisar('#divInfraAreaTabela', LocalizadoresFactory.fromTabela);
	}
	if (acao === 'localizador_processos_lista') {
		return Right('Nada a fazer.');
	}
	const acaoOrigem = params.get('acao_origem');
	if (acaoOrigem === 'principal') {
		return analisar('#fldLocalizadores', LocalizadoresFactory.fromTabelaPainel);
	}
	return Left(new Error(`Ação desconhecida: "${acao}".`));
}
