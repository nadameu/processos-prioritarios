import { html, nothing } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map';
import { LocalizadorOrgao, siglaNomeToTexto } from '../Localizador';
import { LinkLocalizador } from './LinkLocalizador';

export const LinhaLocalizador = ({
  url,
  siglaNome,
  descricao,
  lembrete,
  sistema,
  quantidadeProcessos,
}: LocalizadorOrgao) =>
  html`
    <tr class=${classMap({ infraTrClara: true, 'summa-dies__vazio': quantidadeProcessos === 0 })}>
      <td>
        ${LinkLocalizador(url, siglaNomeToTexto(siglaNome))}
        <br />
        ${descricao
          ? html`
              <small>${descricao}</small>
            `
          : nothing}
      </td>
      <td>
        ${lembrete
          ? html`
              <img
                src="infra_css/imagens/balao.gif"
                @mouseover=${() =>
                  (globalThis as any).infraTooltipMostrar(lembrete, 'Lembrete', 400)}
                @mouseout=${() => (globalThis as any).infraTooltipOcultar()}
              />
            `
          : nothing}
      </td>
      <td>${sistema ? 'Sim' : 'Não'}</td>
      <td>
        ${LinkLocalizador(url, String(quantidadeProcessos))}
      </td>
    </tr>
  `;
