import { Promise$allErrors } from './Promise$allErrors';

type Status =
  | { type: 'NOT STARTED' }
  | { type: 'PENDING'; xhr: XMLHttpRequest }
  | { type: 'RESOLVED'; value: Document }
  | { type: 'REJECTED'; reason: string }
  | { type: 'CANCELLED' };

export class XHR implements Thenable<Document> {
  private _status: Status = { type: 'NOT STARTED' };
  private _resHandlers: Array<(_: Document) => void> = [];
  private _rejHandlers: Array<(_: any) => void> = [];

  constructor(
    private _url: string,
    private _method = 'GET',
    private _data: Parameters<XMLHttpRequest['send']>[0] = null
  ) {}

  cancel() {
    if (this._status.type !== 'PENDING') return;
    const { xhr } = this._status;
    this._status = { type: 'CANCELLED' };
    xhr.abort();
  }

  then(resolve: (_: Document) => void, reject: (_: any) => void): void {
    switch (this._status.type) {
      case 'CANCELLED':
        return;

      case 'RESOLVED':
        resolve(this._status.value);
        break;

      case 'REJECTED':
        reject(this._status.reason);
        break;

      case 'PENDING':
      case 'NOT STARTED':
        this._resHandlers.push(resolve);
        this._rejHandlers.push(reject);

      case 'NOT STARTED': {
        const resolveAll = (doc: Document) => {
          if (this._status.type !== 'PENDING') return;
          this._status = { type: 'RESOLVED', value: doc };
          for (const handler of this._resHandlers) handler(doc);
        };
        const rejectAll = (reason: any) => {
          if (this._status.type !== 'PENDING') return;
          this._status = { type: 'REJECTED', reason };
          for (const handler of this._rejHandlers) handler(reason);
        };

        const xhr = new XMLHttpRequest();
        xhr.open(this._method, this._url);
        xhr.responseType = 'document';
        xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              if (typeof xhr.response === 'object' && xhr.response instanceof Document) {
                resolveAll(xhr.response);
              } else {
                rejectAll(new Error('Error: response is not an HTML document.'));
              }
            } else rejectAll(new Error(`Error: ${xhr.status}`));
          }
        };
        this._status = { type: 'PENDING', xhr };
        xhr.send(this._data);
        break;
      }
    }
  }
}

export async function sequenceXHR(xhrs: XHR[]): Promise<Document[]> {
  const values: Document[] = Array(xhrs.length);
  let pending = Array.from(xhrs.keys());
  await Promise.all(
    xhrs.map((xhr, i) =>
      Promise.resolve(xhr).then(
        value => {
          pending = pending.filter(x => x !== i);
          values[i] = value;
        },
        reason => {
          pending = pending.filter(x => x !== i);
          for (const index of pending) {
            xhrs[index].cancel();
          }
          return Promise.reject(reason);
        }
      )
    )
  );
  return values;
}
