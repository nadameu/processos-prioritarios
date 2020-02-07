import * as preact from 'preact';
import { LocalizadorOrgao, siglaNomeToTexto } from '../Localizador';
import { truthyKeys } from '../truthyKeys';
import { LinkLocalizador } from './LinkLocalizador';

export const LinhaLocalizador: preact.FunctionComponent<LocalizadorOrgao> = ({
  url,
  siglaNome,
  descricao,
  lembrete,
  sistema,
  quantidadeProcessos,
}) => (
  <tr class={truthyKeys({ infraTrClara: true, 'summa-dies__vazio': quantidadeProcessos === 0 })}>
    <td>
      <LinkLocalizador url={url}>{siglaNomeToTexto(siglaNome)}</LinkLocalizador>
      <br />
      {descricao ? <small>{descricao}</small> : null}
    </td>
    <td>
      {lembrete ? (
        <img
          src="infra_css/imagens/balao.gif"
          onMouseOver={() => (globalThis as any).infraTooltipMostrar(lembrete, 'Lembrete', 400)}
          onMouseOut={() => (globalThis as any).infraTooltipOcultar()}
        />
      ) : null}
    </td>
    <td>{sistema ? 'Sim' : 'Não'}</td>
    <td>
      <LinkLocalizador url={url}>{String(quantidadeProcessos)}</LinkLocalizador>
    </td>
  </tr>
);
