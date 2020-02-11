import { html } from 'lit-html';

export const LinkLocalizador = (url: string, text: string) =>
  html`
    <a href=${url} target="_blank">
      ${text}
    </a>
  `;
