import { html } from 'lit-html';

let status: { localizadoresCadastro: boolean; localizadoresOrgao: boolean };

export const Aguarde = (
  changeStatus: { localizadoresCadastro?: boolean; localizadoresOrgao?: boolean } | null = null
) => {
  if (changeStatus === null) {
    status = { localizadoresCadastro: false, localizadoresOrgao: false };
  } else {
    if (changeStatus.localizadoresCadastro !== undefined)
      status.localizadoresCadastro = changeStatus.localizadoresCadastro;
    if (changeStatus.localizadoresOrgao !== undefined)
      status.localizadoresOrgao = changeStatus.localizadoresOrgao;
  }
  return html`
    <p class="summa-dies__aguarde">
      Aguarde, carregando:<br />
      &bull; Localizadores cadastrados...${status.localizadoresCadastro ? ' ok.' : ''}<br />
      &bull; Localizadores do órgão...${status.localizadoresOrgao ? ' ok.' : ''}<br />
    </p>
  `;
};
