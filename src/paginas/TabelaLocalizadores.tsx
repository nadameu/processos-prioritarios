import preact from 'preact';
import { LocalizadorOrgao } from '../Localizador';
import { LinhaLocalizador } from './LinhaLocalizador';

export function TabelaLocalizadores({ dados }: { dados: LocalizadorOrgao[] }) {
  return (
    <table class="infraTable gmTabelaLocalizadores">
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
        {dados.map(loc => (
          <LinhaLocalizador {...loc}></LinhaLocalizador>
        ))}
      </tbody>
    </table>
  );
}
