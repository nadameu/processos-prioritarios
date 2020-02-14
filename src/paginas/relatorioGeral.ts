import { query } from '../query';
import { XHR } from '../XHR';

export async function relatorioGeralIframe() {
  if (document.location.hash !== '#limpar') return;
  const [_paginaCarregada, limpar] = await Promise.all([
    query<HTMLSelectElement>('select.multipleSelect').then(aguardarOcultar),
    query<HTMLButtonElement>('form button#btnLimparCookie'),
  ]);
  const dadosReset = await new Promise<FormData>(res => {
    const form = limpar.form!;
    form.submit = () => res(new FormData(form)); // Será disparado através do click no botão limpar
    limpar.click();
  });
  const doc = await XHR(document.location.search, 'POST', dadosReset);
  const form = await query<HTMLFormElement>('form#frmProcessoLista', doc);
  window.top.postMessage({ data: new FormData(form), url: form.action }, document.location.origin);
}

function aguardarOcultar(elt: HTMLElement) {
  return new Promise<void>(res => {
    if (elt.style.display === 'none') res();
    else {
      const obs = new MutationObserver(() => {
        if (elt.style.display === 'none') {
          obs.disconnect();
          res();
        }
      });
      obs.observe(elt, { attributeFilter: ['style'] });
    }
  });
}
