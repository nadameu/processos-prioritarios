import preact from 'preact';

export function LinkLocalizador({ url, children }: { children: string; url: string }) {
  return (
    <a href={url} target="_blank">
      {children}
    </a>
  );
}
