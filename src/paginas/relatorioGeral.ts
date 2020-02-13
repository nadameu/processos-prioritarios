import { fromEvento } from '../fromEvento';
import { query } from '../query';
import { sleep } from '../sleep';

export async function relatorioGeral() {
  const top = window.top;
  if (top === window) return;
  await fromEvento(window as any, 'load');
  if (document.location.hash === '#limpar') {
    const select = await query<HTMLSelectElement>('select.multipleSelect');
    let count = 100;
    while (select.style.display !== 'none') {
      if (--count <= 0) throw new Error();
      await sleep(50);
    }
    const limpar = await query<HTMLButtonElement>('button#btnLimparCookie');
    const form = await (limpar.form || Promise.reject(new Error('Formulário não encontrado.')));
    const submit = form.submit;
    form.submit = () => {
      form.action = `${document.location.search}#enviar`;
      submit.call(form);
    };
    limpar.click();
  } else if (document.location.hash === '#enviar') {
    const form = await query<HTMLFormElement>('form#frmProcessoLista');
    const data = new FormData(form);
    top.postMessage(data, document.location.origin);
    return data;
  } else {
    console.log(document.location.hash);
    throw new Error('Hash desconhecido.');
  }
}
