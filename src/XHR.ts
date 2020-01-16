export function XHR(
  url: string,
  method = 'GET',
  data: Parameters<XMLHttpRequest['send']>[0] = null
) {
  return new Promise<Document>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'document';
    xhr.onreadystatechange = function() {
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
    xhr.send(data);
  });
}
