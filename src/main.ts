import { Either, Left, Right } from '../adt/Either';
import adicionarBotaoComVinculo from './adicionarBotaoComVinculo';
import { Localizadores, LocalizadoresFactory } from './LocalizadoresFactory';
import { queryOne } from './Query/queryOne';

export default function main(doc: Document): Either<Error, string> {
  const url = new URL(doc.URL);
  const params = url.searchParams;
  const acao = params.get('acao');
  if (acao === 'usuario_tipo_monitoramento_localizador_listar') {
    return analisar(doc, '#divInfraAreaTabela', LocalizadoresFactory.fromTabela);
  }
  if (acao === 'localizador_processos_lista') {
    return Right('Nada a fazer.');
  }
  const acaoOrigem = params.get('acao_origem');
  if (acaoOrigem === 'principal') {
    return analisar(doc, '#fldLocalizadores', LocalizadoresFactory.fromTabelaPainel);
  }
  return Left(new Error(`Ação desconhecida: "${acao}".`));
}

function analisar(
  doc: Document,
  parentSelector: string,
  factory: (_: HTMLTableElement) => Localizadores
): Either<Error, string> {
  return queryOne<HTMLTableElement>(`${parentSelector} table`, doc)
    .maybe<Either<Error, HTMLTableElement>>(Left(new Error()), Right)
    .map(factory)
    .chain(adicionarBotaoComVinculo);
}
