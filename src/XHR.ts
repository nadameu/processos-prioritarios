import { Cancelable } from './Cancelable';

export function XHR(url: string, method = 'GET', data: Document | BodyInit | null = null) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const token = { cancel() {} };
  const promise = new Promise<Document>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'document';
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (typeof xhr.response === 'object' && xhr.response instanceof Document) {
            resolve(xhr.response);
          } else {
            reject(new Error('Error: response is not an HTML document.'));
          }
        } else reject(new Error(`Error: ${xhr.status}`));
      }
    };
    token.cancel = function cancel() {
      xhr.abort();
    };
    xhr.send(data);
  });
  return new Cancelable(promise, token);
}
