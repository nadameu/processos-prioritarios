import { query } from '../query';
import { waitUntil } from '../waitUntil';
import { XHR } from '../XHR';

export async function relatorioGeralIframe() {
  if (document.location.hash !== '#limpar') return;
  const sel = await query<HTMLSelectElement>('select.multipleSelect');
  await new Promise<void>(res => {
    const obs = new MutationObserver(() => {
      obs.disconnect();
      res();
    });
    obs.observe(sel, { attributeFilter: ['style'] });
  });
  await waitUntil(() => sel.style.display === 'none');
  const limpar = await query<HTMLButtonElement>('button#btnLimparCookie');
  const form = await (limpar.form || Promise.reject(new Error('Formulário não encontrado.')));
  form.submit = () => {
    XHR(document.location.search, 'POST', new FormData(form)).then(async doc => {
      const form = await query<HTMLFormElement>('form#frmProcessoLista', doc);
      const data = new FormData(form);
      const url = form.action;
      top.postMessage({ data, url }, document.location.origin);
    });
  };
  limpar.click();
}
