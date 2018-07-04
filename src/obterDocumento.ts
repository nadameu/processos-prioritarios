import { Task } from './Task/Task';

export const obterDocumento = (
	url: string,
	method: string = 'GET',
	data: any = null
): Task<Error, Document> =>
	Task((reject, resolve) => {
		var xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.responseType = 'document';
		xhr.onerror = () =>
			reject(new Error(`Não foi possível obter os dados de "${url}".`));
		xhr.onload = () => resolve(xhr.response);
		xhr.send(data);
	});
