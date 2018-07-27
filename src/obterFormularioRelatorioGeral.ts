import { Maybe } from '../adt/Maybe';
import { Task } from '../adt/Task';
import { obterDocumento } from './obterDocumento';
import { queryAll } from './Query/queryAll';
import { queryOne } from './Query/queryOne';

let resultado: Task<Error, HTMLFormElement>;

export function obterFormularioRelatorioGeral(doc: Document): Task<Error, HTMLFormElement> {
	if (!resultado) {
		resultado = queryAll<HTMLAnchorElement>('#main-menu a[href]', doc)
			.filter(ehLinkEsperado)
			.map(link => link.href)
			.head()
			.maybe<Task<Error, string>>(
				Task.rejected(new Error('Link para o relatório geral não encontrado.')),
				Task.of
			)
			.chain(obterDocumento)
			.chain(obterFormulario);
	}
	return resultado;
}

function ehLinkEsperado(link: HTMLAnchorElement): boolean {
	return new URL(link.href).searchParams.get('acao') === 'relatorio_geral_listar';
}

function obterFormulario(doc: Document): Task<Error, HTMLFormElement> {
	return queryOne<HTMLButtonElement>('#btnConsultar', doc)
		.chain(consultar => Maybe.fromNullable(consultar.form))
		.maybe(
			Task.rejected(new Error('Não foi possível obter o formulário do relatório geral.')),
			Task.of
		);
}
