import { Task } from '../adt/Task';

export const obterDocumento = (
	url: string,
	method: string = 'GET',
	data: any = null
): Task<ErrorEvent, Document> =>
	Task((reject, resolve) => {
		var xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.responseType = 'document';
		xhr.onerror = reject;
		xhr.onload = () => resolve(xhr.response);
		xhr.send(data);
		return () => xhr.abort();
	});
