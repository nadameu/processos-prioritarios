import { html } from 'lit-html';

let status: { localizadoresCadastro: boolean; localizadoresOrgao: boolean; textosPadrao: boolean };
const descricoes: Record<keyof typeof status, string> = {
  localizadoresCadastro: 'Localizadores cadastrados',
  localizadoresOrgao: 'Localizadores do órgão',
  textosPadrao: 'Textos padrão',
};

export const Aguarde = (changeStatus?: Partial<typeof status>) => {
  if (changeStatus) Object.assign(status, changeStatus);
  else {
    status = { localizadoresCadastro: false, localizadoresOrgao: false, textosPadrao: false };
  }
  return html`
    <p class="summa-dies__aguarde">
      Aguarde, carregando:<br />
      ${Object.entries(descricoes).map(([nome, descricao]) =>
        item(nome as keyof typeof status, descricao)
      )}
    </p>
  `;
};

function item(nome: keyof typeof status, descricao: string) {
  return html`
    &bull; ${descricao}...${status[nome] ? ' ok.' : ''}<br />
  `;
}
