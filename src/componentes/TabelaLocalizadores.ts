import { html } from 'lit-html';
import { LocalizadorOrgao } from '../Localizador';
import { LinhaLocalizador } from './LinhaLocalizador';

export const TabelaLocalizadores = (
  dados: LocalizadorOrgao[],
  infoRelatorioGeral: { data: FormData; url: string }
) =>
  html`
    <table class="infraTable summa-dies__tabela">
      <thead>
        <tr>
          <th class="infraTh">
            Nome
            <br />
            <small>Descrição</small>
          </th>
          <th class="infraTh">Lembrete</th>
          <th class="infraTh">Sistema</th>
          <th class="infraTh">Qtd. processos</th>
        </tr>
      </thead>
      <tbody>
        ${dados.map(d => LinhaLocalizador(d, infoRelatorioGeral))}
      </tbody>
    </table>
  `;
