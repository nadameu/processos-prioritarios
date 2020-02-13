import { html, nothing } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map';
import { until } from 'lit-html/directives/until';
import { LocalizadorOrgao, siglaNomeToTexto } from '../Localizador';
import { parsePaginaRelatorioGeralLocalizador } from '../paginas/relatorioGeralLocalizador';
import { XHR } from '../XHR';
import { LinkLocalizador } from './LinkLocalizador';

export const LinhaLocalizador = (
  { id, url, siglaNome, descricao, lembrete, sistema, quantidadeProcessos }: LocalizadorOrgao,
  infoRelatorioGeral: { data: FormData; url: string }
) =>
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
        ${until(
          obterPaginaRelatorioGeralLocalizador(id, infoRelatorioGeral)
            .then(parsePaginaRelatorioGeralLocalizador)
            .then(texto => LinkLocalizador(url, texto)),
          'Carregando...'
        )}
      </td>
    </tr>
  `;

function obterPaginaRelatorioGeralLocalizador(
  id: string,
  { data: cleanData, url }: { data: FormData; url: string }
) {
  const data = cloneFormData(cleanData);
  data.set('selLocalizadorPrincipalSelecionados', id);
  data.set('paginacao', '10');
  return XHR(url, 'POST', data);
}

function cloneFormData(data: FormData) {
  const newData = new FormData();
  for (const [key, value] of data) newData.append(key, value);
  return newData;
}
