import { Either, Left, Right } from './Either';
import { Future } from './Future';

export function XHR(
  url: string,
  method = 'GET',
  data: Parameters<XMLHttpRequest['send']>[0] = null
) {
  return new Future<Either<string, Document>>(callback => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'document';
    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (typeof xhr.response === 'object' && xhr.response instanceof Document) {
            callback(Right(xhr.response));
          } else {
            callback(Left('Error: response is not an HTML document.'));
          }
        } else callback(Left(`Error: ${xhr.status}`));
      }
    };
    xhr.send(data);
  });
}
