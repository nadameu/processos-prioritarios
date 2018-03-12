import CompetenciasCorregedoria from './CompetenciasCorregedoria';
import Situacoes from './Situacoes';
import RegrasCorregedoria from './RegrasCorregedoria';

const MILISSEGUNDOS_EM_UM_DIA = 864e5;
const COMPETENCIA_JUIZADO_MIN = 9,
	COMPETENCIA_JUIZADO_MAX = 20,
	COMPETENCIA_CRIMINAL_MIN = 21,
	COMPETENCIA_CRIMINAL_MAX = 30,
	COMPETENCIA_EF_MIN = 41,
	COMPETENCIA_EF_MAX = 43,
	CLASSE_EF = 99,
	CLASSE_CARTA_PRECATORIA = 60;

const memoize = fn => {
	const store = new Map();
	return x => {
		if (! store.has(x)) {
			store.set(x, fn(x));
		}
		return store.get(x);
	};
};

const DOMINGO = 0;
const SEGUNDA = 1;
const SABADO = 6;

const adiantarParaSabado = data => {
	const diaDaSemana = data.getDay();
	if (diaDaSemana === DOMINGO) {
		return new Date(data.getFullYear(), data.getMonth(), data.getDate() - 1);
	}
	if (diaDaSemana === SEGUNDA) {
		return new Date(data.getFullYear(), data.getMonth(), data.getDate() - 2);
	}
	return new Date(data.getTime());
};

const prorrogarParaSegunda = data => {
	const diaDaSemana = data.getDay();
	if (diaDaSemana === DOMINGO) {
		return new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
	}
	if (diaDaSemana === SABADO) {
		return new Date(data.getFullYear(), data.getMonth(), data.getDate() + 2);
	}
	return new Date(data.getTime());
};

const JANEIRO = 0;
const DEZEMBRO = 11;
const calcularRecesso = memoize(ano => {
	const inicio = adiantarParaSabado(new Date(ano, DEZEMBRO, 20));
	const retorno = prorrogarParaSegunda(new Date(ano + 1, JANEIRO, 7));
	return { inicio, retorno };
});

const calcularRecessoData = data => {
	let { inicio, retorno } = calcularRecesso(data.getFullYear() - 1);
	while (data > retorno) {
		const recesso = calcularRecesso(retorno.getFullYear());
		inicio = recesso.inicio;
		retorno = recesso.retorno;
	}
	return { inicio, retorno };
};

const calcularAtraso = (a, b) => {
	const { inicio, retorno } = calcularRecessoData(a);
	return (
		Math.max(0, inicio - a) - Math.max(0, inicio - b) + Math.max(0, b - retorno)
	);
};

export default class Processo {
	constructor() {
		this.classe = null;
		this.dadosComplementares = new Set();
		this.dataAutuacao = null;
		this.dataInclusaoLocalizador = null;
		this.dataSituacao = null;
		this.dataUltimoEvento = null;
		this.juizo = null;
		this.lembretes = [];
		this.linha = null;
		this.link = null;
		this.localizadores = [];
		this.numClasse = null;
		this.numCompetencia = null;
		this.numproc = null;
		this.numprocFormatado = null;
		this.sigilo = null;
		this.situacao = null;
		this.ultimoEvento = null;
	}
	get atraso() {
		var hoje = new Date();
		return (
			calcularAtraso(this.termoPrazoCorregedoria, hoje) /
			MILISSEGUNDOS_EM_UM_DIA
		);
	}
	get atrasoPorcentagem() {
		return this.atraso / this.prazoCorregedoria;
	}
	get competenciaCorregedoria() {
		if (
			this.numCompetencia >= COMPETENCIA_JUIZADO_MIN &&
			this.numCompetencia <= COMPETENCIA_JUIZADO_MAX
		) {
			return CompetenciasCorregedoria.JUIZADO;
		} else if (
			this.numCompetencia >= COMPETENCIA_CRIMINAL_MIN &&
			this.numCompetencia <= COMPETENCIA_CRIMINAL_MAX
		) {
			return CompetenciasCorregedoria.CRIMINAL;
		} else if (
			(this.numCompetencia >= COMPETENCIA_EF_MIN ||
				this.numCompetencia <= COMPETENCIA_EF_MAX) &&
			(this.numClasse === CLASSE_EF ||
				this.numClasse === CLASSE_CARTA_PRECATORIA)
		) {
			return CompetenciasCorregedoria.EXECUCAO_FISCAL;
		}
		return CompetenciasCorregedoria.CIVEL;
	}
	get campoDataConsiderada() {
		var ret = 'dataSituacao';
		switch (this.situacao) {
		case 'MOVIMENTO-AGUARDA DESPACHO':
		case 'MOVIMENTO-AGUARDA SENTENÇA':
			ret = 'dataSituacao';
			break;
		case 'MOVIMENTO':
			ret = 'dataUltimoEvento';
			if (this.dataInclusaoLocalizador < this.dataUltimoEvento) {
				if (document.body.matches('.gmConsiderarDataInclusaoLocalizador')) {
					ret = 'dataInclusaoLocalizador';
				}
			}
			break;
		default:
			ret = 'dataSituacao';
			break;
		}
		return ret;
	}
	get prazoCorregedoria() {
		var situacao = Situacoes[this.situacao] || Situacoes['INDEFINIDA'];
		var dias = RegrasCorregedoria[this.competenciaCorregedoria][situacao];
		if (this.prioridade && document.body.matches('.gmPrazoMetade')) dias /= 2;
		return dias;
	}
	get prioridade() {
		return (
			this.dadosComplementares.has('Prioridade Atendimento') ||
			this.dadosComplementares.has('Réu Preso')
		);
	}
	get termoPrazoCorregedoria() {
		var dataConsiderada = new Date(this[this.campoDataConsiderada].getTime());
		let recesso = calcularRecessoData(dataConsiderada);
		if (dataConsiderada >= recesso.inicio) {
			dataConsiderada.setTime(recesso.retorno.getTime());
		}
		var dataTermo = new Date(dataConsiderada.getTime());
		dataTermo.setDate(dataTermo.getDate() + this.prazoCorregedoria);
		while (dataTermo >= recesso.inicio) {
			dataTermo.setTime(
				dataTermo.getTime() + (recesso.retorno - recesso.inicio)
			);
			recesso = calcularRecesso(recesso.retorno.getFullYear());
		}
		return dataTermo;
	}
}
