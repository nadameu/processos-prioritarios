import { CompetenciasCorregedoria } from './CompetenciasCorregedoria';
import { Situacoes } from './Situacoes';

export const RegrasCorregedoria = {
	[CompetenciasCorregedoria.JUIZADO]: {
		[Situacoes['INICIAL']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 15,
		[Situacoes['MOVIMENTO']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 45,
		[Situacoes['INDEFINIDA']]: 30,
	},
	[CompetenciasCorregedoria.CIVEL]: {
		[Situacoes['INICIAL']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
		[Situacoes['MOVIMENTO']]: 15,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
		[Situacoes['INDEFINIDA']]: 60,
	},
	[CompetenciasCorregedoria.CRIMINAL]: {
		[Situacoes['INICIAL']]: 15,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
		[Situacoes['MOVIMENTO']]: 15,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
		[Situacoes['INDEFINIDA']]: 30,
	},
	[CompetenciasCorregedoria.EXECUCAO_FISCAL]: {
		[Situacoes['INICIAL']]: 10,
		[Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 60,
		[Situacoes['MOVIMENTO']]: 25,
		[Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
		[Situacoes['INDEFINIDA']]: 120,
	},
};