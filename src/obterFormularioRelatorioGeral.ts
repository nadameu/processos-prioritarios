import { obterDocumento } from './obterDocumento';
import { queryAll } from './Query/queryAll';
import { queryOne } from './Query/queryOne';
import { pipeline } from './Util/pipeline';
import { Task } from '../adt/Task';
import { Either, Right, Left } from '../adt/Either';
import { eitherToTask, maybeToTask } from '../adt/nt';
import { Maybe } from '../adt/Maybe';
import { Functor, Chain } from '../adt/ADT';

let resultado: Task<Error, HTMLFormElement>;

export function obterFormularioRelatorioGeral(doc: Document): Task<Error, HTMLFormElement> {
	if (!resultado) {
		resultado = queryAll<HTMLAnchorElement>('#main-menu a[href]', doc)
			.filter(ehLinkEsperado)
			.map(link => link.href)
			.head()
			.map(obterDocumento)
			.map(t => t.map(obterFormulario));
	}
	return resultado;
}

function ehLinkEsperado(link: HTMLAnchorElement): boolean {
	return new URL(link.href).searchParams.get('acao') === 'relatorio_geral_listar';
}

function obterFormulario(doc: Document) {
	return queryOne<HTMLButtonElement>('#btnConsultar', doc).chain(consultar =>
		Maybe.fromNullable(consultar.form)
	);
}
