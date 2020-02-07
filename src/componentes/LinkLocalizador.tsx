import * as preact from 'preact';

export const LinkLocalizador: preact.FunctionComponent<{ url: string }> = ({ url, children }) => (
  <a href={url} target="_blank">
    {children}
  </a>
);
