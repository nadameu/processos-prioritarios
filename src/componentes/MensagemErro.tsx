import * as preact from 'preact';

export function MensagemErro({ children }: { children: string }) {
  return <p class="summa-dies__erro">{children}</p>;
}