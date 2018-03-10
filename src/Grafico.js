import { apenasData } from './helpers';

export default class Grafico {
	get area() {
		var area = {
			corFundo: 'rgba(102, 102, 102, 0.25)',
			linha: { espessura: 1, cor: '#666' },
		};
		const margemExterna =
			this.dimensoes.margem +
			this.linha.espessura / 2 +
			this.dimensoes.espacamento +
			area.linha.espessura / 2;
		area.margens = {
			t: margemExterna + this.texto.altura / 2,
			r: margemExterna,
			b: margemExterna + this.texto.altura + this.dimensoes.espacamento,
			l: margemExterna + this.escala.largura + 2 * this.dimensoes.espacamento,
		};
		area.dimensoes = {
			largura: this.dimensoes.largura - area.margens.l - area.margens.r,
			altura: this.dimensoes.altura - area.margens.t - area.margens.b,
		};
		return area;
	}
	constructor() {
		this.dimensoes = {
			get largura() {
				return Math.min(
					1024,
					document.querySelector('#divInfraAreaTelaD').clientWidth
				);
			},
			altura: 400,
			margem: 3,
			espacamento: 5,
		};
		this.linha = { espessura: 1, cor: 'rgba(255, 255, 255, 0.9)' };
		this.corFundo = 'rgb(51, 51, 51)';
		this.texto = {
			altura: 10,
			cor: 'hsla(180, 100%, 87%, 0.87)',
			corSecundaria: 'hsla(180, 100%, 87%, 0.5)',
		};
		this.escala = {
			maximo: 20,
			unidadePrimaria: 10,
			unidadeSecundaria: 5,
			largura: 2 * this.texto.altura,
			linhaPrimaria: { espessura: 2, cor: '#888' },
			linhaSecundaria: { espessura: 0.5, cor: '#666' },
		};
		let self = this;
		this.categorias = {
			quantidade: 1,
			get distancia() {
				return self.area.dimensoes.largura / self.categorias.quantidade;
			},
		};
		this.barras = {
			corVencido: 'hsla(15, 80%, 75%, 1)',
			corProximosDias: 'hsla(60, 100%, 75%, 1)',
			corNoPrazo: 'hsla(120, 75%, 80%, 1)',
			espacamento: 0.2,
			/* valor entre 0 e 1, proporcional à largura disponível */ get largura() {
				return self.categorias.distancia * (1 - self.barras.espacamento);
			},
		};
		const canvas = document.createElement('canvas');
		canvas.width = this.dimensoes.largura;
		canvas.height = this.dimensoes.altura;
		this.canvas = canvas;
		this.context = this.canvas.getContext('2d');
		this.dados = new Map();
	}
	inserirDados(dados) {
		this.dados = dados;
	}
	render() {
		this.calcularEscala();
		this.calcularLarguraEscala();
		this.calcularCategorias();
		this.desenharFundo();
		this.desenharArea();
		this.desenharEscala();
		this.desenharCategorias();
		this.desenharBarras();
		return this.canvas;
	}
	desenharFundo() {
		const context = this.context;
		context.fillStyle = this.corFundo;
		context.fillRect(0, 0, this.dimensoes.largura, this.dimensoes.altura);
		context.beginPath();
		let x = this.dimensoes.margem;
		let y = x;
		let w = this.dimensoes.largura - 2 * this.dimensoes.margem;
		let h = this.dimensoes.altura - 2 * this.dimensoes.margem;
		context.rect(x, y, w, h);
		context.lineWidth = this.linha.espessura;
		context.strokeStyle = this.linha.cor;
		context.stroke();
	}
	desenharArea() {
		const context = this.context;
		context.beginPath();
		context.rect(
			this.area.margens.l,
			this.area.margens.t,
			this.area.dimensoes.largura,
			this.area.dimensoes.altura
		);
		context.fillStyle = this.area.corFundo;
		context.fill();
		context.lineWidth = this.area.linha.espessura;
		context.strokeStyle = this.area.linha.cor;
		context.stroke();
	}
	desenharEscala() {
		const context = this.context;
		const xTexto =
			this.dimensoes.margem +
			this.linha.espessura / 2 +
			this.dimensoes.espacamento +
			this.escala.largura / 2;
		const xLinha =
			xTexto + this.escala.largura / 2 + this.dimensoes.espacamento;
		const wLinha = this.area.dimensoes.largura + this.dimensoes.espacamento;
		for (
			let i = 0;
			i <= this.escala.maximo;
			i += this.escala.unidadeSecundaria
		) {
			if (i % this.escala.unidadePrimaria === 0) {
				context.fillStyle = this.texto.cor;
				context.strokeStyle = this.escala.linhaPrimaria.cor;
				context.lineWidth = this.escala.linhaPrimaria.espessura;
			} else {
				context.fillStyle = this.texto.corSecundaria;
				context.strokeStyle = this.escala.linhaSecundaria.cor;
				context.lineWidth = this.escala.linhaSecundaria.espessura;
			}
			let proporcao = i / this.escala.maximo;
			let y =
				this.dimensoes.altura -
				this.area.margens.b -
				proporcao * this.area.dimensoes.altura;
			context.fillText(i.toString(), xTexto, y);
			context.beginPath();
			context.moveTo(xLinha, y);
			context.lineTo(xLinha + wLinha, y);
			context.stroke();
		}
	}
	desenharCategorias() {
		const context = this.context;
		const larguraPossivelTexto = context.measureText('99').width;
		const step = Math.ceil(
			(larguraPossivelTexto + this.dimensoes.espacamento) /
				this.categorias.distancia
		);
		const hoje = apenasData(Date.now());
		context.fillStyle = this.texto.cor;
		const y =
			this.dimensoes.altura -
			(this.dimensoes.margem + this.linha.espessura / 2 + this.area.margens.b) /
				2;
		for (let i = 0; i < this.categorias.quantidade; i += step) {
			let dia = new Date(
				hoje.getFullYear(),
				hoje.getMonth(),
				hoje.getDate() + i
			);
			let x = this.area.margens.l + (i + 0.5) * this.categorias.distancia;
			context.fillText(dia.getDate().toString(), x, y);
		}
	}
	desenharBarras() {
		const context = this.context;
		const hoje = apenasData(Date.now());
		const larguraBarra =
			this.categorias.distancia * (1 - this.barras.espacamento);
		for (let i = 0; i < this.categorias.quantidade; i++) {
			if (i === 0) {
				context.fillStyle = this.barras.corVencido;
			} else if (i <= 3) {
				context.fillStyle = this.barras.corProximosDias;
			} else {
				context.fillStyle = this.barras.corNoPrazo;
			}
			let dia = new Date(
				hoje.getFullYear(),
				hoje.getMonth(),
				hoje.getDate() + i
			);
			if (this.dados.has(dia.getTime())) {
				let x =
					this.area.margens.l +
					(i + 0.5) * this.categorias.distancia -
					larguraBarra / 2;
				let valor = this.dados.get(dia.getTime());
				let altura = valor / this.escala.maximo * this.area.dimensoes.altura;
				let y = this.dimensoes.altura - this.area.margens.b - altura;
				context.fillRect(x, y, larguraBarra, altura);
			}
		}
	}
	calcularEscala() {
		const quantidades = Array.from(this.dados.values());
		const maximo = Math.max.apply(null, quantidades);
		this.calcularDadosEscala(maximo);
		const distanciaMinima =
			2 * this.dimensoes.espacamento + 2 * this.texto.altura;
		let secundariaOk = this.assegurarDistanciaMinima(
			'unidadeSecundaria',
			distanciaMinima
		);
		if (secundariaOk) return;
		let primariaOk = this.assegurarDistanciaMinima(
			'unidadePrimaria',
			distanciaMinima
		);
		if (primariaOk) {
			this.escala.unidadeSecundaria = this.escala.unidadePrimaria;
		} else {
			throw new Error('Não sei o que fazer');
		}
	}
	calcularLarguraEscala() {
		const context = this.context;
		context.textBaseline = 'middle';
		context.textAlign = 'center';
		context.font = `${this.texto.altura}px Arial`;
		const largura = context.measureText(this.escala.maximo.toString()).width;
		this.escala.largura = largura;
	}
	calcularCategorias() {
		const dias = Array.from(this.dados.keys());
		const hoje = apenasData(Date.now());
		const minimo = hoje.getTime();
		const maximo = Math.max.apply(null, dias);
		const UM_DIA = 864e5;
		this.categorias.quantidade = (maximo - minimo) / UM_DIA + 1;
	}
	calcularDadosEscala(maximo) {
		if (maximo <= 10) {
			this.escala.unidadePrimaria = 10;
		} else {
			const ordem = Math.floor(Math.log(maximo) / Math.log(10));
			this.escala.unidadePrimaria = Math.pow(10, ordem);
		}
		this.escala.unidadeSecundaria = this.escala.unidadePrimaria / 10;
		this.escala.maximo =
			Math.ceil(maximo / this.escala.unidadeSecundaria) *
			this.escala.unidadeSecundaria;
	}
	assegurarDistanciaMinima(unidade, distancia) {
		let tamanhoIdealEncontrado = false;
		[1, 2, 2.5, 5, 10].forEach(mult => {
			if (tamanhoIdealEncontrado) return;
			let novoIntervalo = this.escala[unidade] * mult;
			if (novoIntervalo % 1 !== 0) return;
			let novoMaximo =
				Math.ceil(this.escala.maximo / novoIntervalo) * novoIntervalo;
			if (
				novoMaximo / novoIntervalo * distancia <=
				this.area.dimensoes.altura
			) {
				tamanhoIdealEncontrado = true;
				if (mult !== 1) {
					this.escala[unidade] *= mult;
					this.escala.maximo = novoMaximo;
				}
			}
		});
		return tamanhoIdealEncontrado;
	}
}
