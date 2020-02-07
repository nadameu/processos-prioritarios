import * as preact from 'preact';

export const MensagemErro: preact.FunctionComponent<{ mensagem: string }> = ({ mensagem }) => (
  <p class="summa-dies__erro">{mensagem}</p>
);
