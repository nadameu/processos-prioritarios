import { nomeContemSigla } from './nomeContemSigla';

export interface SiglaNomeSeparados {
  sigla: string;
  nome: string;
}

export type SiglaNome = string | SiglaNomeSeparados;

export interface MeuLocalizadorVazio {
  siglaNome: SiglaNome;
}

export interface MeuLocalizador extends MeuLocalizadorVazio {
  id: string;
  quantidadeProcessos: number;
}

export interface LocalizadorOrgao {
  id: string;
  url: string;
  siglaNome: SiglaNomeSeparados;
  descricao?: string;
  sistema: boolean;
  lembrete?: string;
  quantidadeProcessos: number;
}

export type Localizador = MeuLocalizadorVazio | MeuLocalizador | LocalizadorOrgao;

export function siglaNomeIguais(x: SiglaNome, y: SiglaNome) {
  return siglaNomeToTexto(x) === siglaNomeToTexto(y);
}

export function siglaNomeToTexto(siglaNome: SiglaNome) {
  return typeof siglaNome === 'string'
    ? siglaNome
    : nomeContemSigla(siglaNome.sigla, siglaNome.nome)
    ? siglaNome.nome
    : `${siglaNome.sigla} - ${siglaNome.nome}`;
}
