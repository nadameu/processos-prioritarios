import { Task } from '../adt/Task';
import { Left, Right } from '../adt/Either';

export const obterDocumento = (
	url: string,
	method: string = 'GET',
	data: any = null
): Task<Error, Document> =>
	Task(handler => {
		var xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.responseType = 'document';
		xhr.onerror = ev => handler(Left(new Error(`Erro ao obter o documento em "${url}"`)));
		xhr.onload = () => handler(Right(xhr.response));
		xhr.send(data);
		return () => xhr.abort();
	});
