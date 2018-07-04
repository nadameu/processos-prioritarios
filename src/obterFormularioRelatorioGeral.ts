import { Either } from './Either/Either';
import { Left } from './Either/Left';
import { Right } from './Either/Right';
import { toTask } from './Either/toTask';
import { queryAll } from './Query/queryAll';
import { queryOne } from './Query/queryOne';
import { Task } from './Task/Task';
import { chain } from './Task/chain';
import { map } from './Task/map';
import { pipeline } from './Util/pipeline';
import { obterDocumento } from './obterDocumento';

let resultado: Task<Error, HTMLFormElement>;

export function obterFormularioRelatorioGeral(
	doc: Document
): Task<Error, HTMLFormElement> {
	if (!resultado) {
		var links = queryAll<HTMLAnchorElement>('#main-menu a[href]', doc);
		var urls = links.filter(ehLinkEsperado).map(link => link.href);
		var url: Either<Error, string> = urls.reduce(
			(result, url, index) => (index === 0 ? Right(url) : result),
			Left(new Error('Link para relatório geral não encontrado.'))
		);
		resultado = pipeline(
			url,
			toTask,
			chain(url => obterDocumento(url)),
			chain(doc => toTask(queryOne<HTMLButtonElement>('#btnConsultar', doc))),
			map(consultar => consultar.form)
		);
	}
	return resultado;
}

function ehLinkEsperado(link: HTMLAnchorElement): boolean {
	return (
		new URL(link.href).searchParams.get('acao') === 'relatorio_geral_listar'
	);
}
