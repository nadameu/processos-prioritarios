import { bits, comprimir, descomprimir, stringToByteArray, createHeap, lerp } from './Compressao';

test('Funciona', () => {
  /*
  const string =
    'hdnNumProcessoLista&hdnAcaoPreferencia&txtPreferencia&hdnPreferencia&hdnPreferenciaUsuario&txtDescricaoCadastro&hdnTipoFiltroMagistrado&txtUltimoEvento&hdnUltimoEvento&txtUsuarioUltimoEvento&hdnUsuarioUltimoEvento&selComEvento_text&selComEventoSelecionados&selComEventoRecupSelecionados&txtUsuarioComEvento&hdnUsuarioComEvento&selSemEvento_text&selSemEventoSelecionados&selSemEventoRecupSelecionados&txtPeticao&hdnPeticao&selTipoPeticao_text&selTipoPeticaoSelecionados&selTipoPeticaoRecupSelecionados&selAssunto_text&selAssuntoSelecionados&selAssuntoRecupSelecionados&selClasse_text&selClasseSelecionados&selClasseRecupSelecionados&selClasseOrigem_text&selClasseOrigemSelecionados&selClasseOrigemRecupSelecionados&txtApenso&txtMultiplosProcessos&hdnMultiplosProcessos&selTipoTemasRepetitivos_text&selTipoTemasRepetitivosSelecionados&selTipoTemasRepetitivosRecupSelecionados&selSituacaoTemasRepetitivos_text&selSituacaoTemasRepetitivosSelecionados&selSituacaoTemasRepetitivosRecupSelecionados&selTemasRepetitivos_text&selTemasRepetitivosSelecionados&selTemasRepetitivosRecupSelecionados&selLocalidadeOrigem_text&selLocalidadeOrigemSelecionados&selLocalidadeOrigemRecupSelecionados&selLocalidadeOrigemPolo_text&selLocalidadeOrigemPoloSelecionados&selLocalidadeOrigemPoloRecupSelecionados&txtOabLoginProcurador&hdnOabLoginProcurador&selPrazo_text&txtDiasSemMovimentacao&txtValorCausaMin&txtValorCausaMax&txtValorCdaMin&txtValorCdaMax&selLocalizadorPrincipal_text&selLocalizadorPrincipalSelecionados&selLocalizadorPrincipalRecupSelecionados&selLocalizadoresSelecionados&selDadoComplementar_text&selIdOrgaoJuizo_text&selCompetencia_text&selCompetenciaSelecionados&selCompetenciaRecupSelecionados&selStatusProcesso_text&selIdSigilo_text&txtDataAutuacao&txtDataAutuacaoFinal&txtLembrete&selEntidade_text&selEntidadeSelecionados&selEntidadeRecupSelecionados&selRitoProcesso_text&selTipoAcao_text&txtIdadeMinima&selAnexoFisico&selRpvPrecatorio_text&txtDataInicioAbertConta&txtDataFimAbertConta&selFiltroCdaStatus_text&selFiltroCdaGrupoStatus_text&selSubsecaoOrigem_text&selSubsecaoOrigemSelecionados&selSubsecaoOrigemRecupSelecionados';
  */
  const string = 'AAAAAAA';
  const comprimido = comprimir(string);
  console.info(
    'Diferença:',
    (
      (comprimido.length * comprimido.BYTES_PER_ELEMENT) / (string.length * 2) -
      1
    ).toLocaleString('en-US', { style: 'percent' }),
    ' (',
    string.length * 2,
    '->',
    comprimido.length * comprimido.BYTES_PER_ELEMENT,
    ')'
  );
  const descomprimido = descomprimir(comprimido);
  expect(descomprimido).toEqual(string);
});

test('bits', () => {
  const input1 = [0, 1, 1, 0, 0, 0, 1, 1];
  const output1 = bits(1, [1, 8], input1);
  expect(bits([1, 8], 1, output1)).toEqual(input1);

  const input2 = [3, 1, 0, 2];
  const output2 = bits(2, [2, 8], input2);
  expect(bits([2, 8], 2, output2)).toEqual(input2);

  const input3 = [7, 2, 4, 1, 3, 6, 5, 0];
  const output3 = bits(3, [3, 8], input3);
  expect(bits([3, 8], 3, output3)).toEqual(input3);

  const input4 = [15, 9];
  const output4 = bits(4, [4, 8], input4);
  expect(bits([4, 8], 4, output4)).toEqual(input4);

  const input5 = [0, 31, 26, 21, 3, 30, 22, 12];
  const output5 = bits(5, [5, 8], input5);
  expect(bits([5, 8], 5, output5)).toEqual(input5);

  const input6 = [0, 63, 45, 9];
  const output6 = bits(6, [6, 8], input6);
  expect(bits([6, 8], 6, output6)).toEqual(input6);

  const input7 = [127, 26, 65, 98, 45, 85, 11, 23, 37];
  const output7 = bits(7, [7, 8], input7);
  expect(bits([7, 8], 7, output7)).toEqual(input7);

  const input8 = [0, 255];
  const output8 = bits(8, 8, input8);
  expect(bits(8, 8, output8)).toEqual(input8);

  const input16 = [0x0045, 0xffaa];
  const output16 = bits(16, [16, 8], input16);
  expect(bits([16, 8], 16, output16)).toEqual(input16);

  const input32 = [0xabcdef12];
  const output32 = bits(32, [32, 8], input32);
  expect(bits([32, 8], 32, output32)).toEqual(input32);
});

test('Comprimentos diversos', () => {
  expect(bits(1, [1, 8], [1])).toEqual([0b10000000]);
  expect(bits([1, 8], 1, [0b10000000], 1)).toEqual([1]);
  expect(bits([3, 11], [5, 7], [0b01001000100, 0b01000100010, 0b00100010010])).toEqual([
    0b0001000,
    0b0100000,
    0b1000000,
    0b0100000,
    0b1000001,
    0b0000000,
    0b1000001,
    0b0000100,
  ]);
});

test('encode', () => {
  expect(stringToByteArray('A')).toEqual('01000001');
  expect(stringToByteArray('AA')).toEqual('010000011');
  expect(stringToByteArray('AAA')).toEqual('0100000111');
});

test('heap', () => {
  const h1 = createHeap(1);
  h1.set([0], 0);
  h1.set([1], 1);
  expect(h1.toArray()).toEqual([0, 1]);

  const h2 = createHeap(2);
  h2.set([0], 0);
  h2.set([1], 1);
  h2.set([0, 0], 2);
  h2.set([0, 1], 3);
  h2.set([1, 0], 4);
  h2.set([1, 1], 5);
  expect(h2.toArray()).toEqual([0, 1, 2, 3, 4, 5]);

  const h3 = createHeap(3);
  h3.set([0], 0);
  h3.set([1], 1);
  h3.set([0, 0], 2);
  h3.set([0, 1], 3);
  h3.set([1, 0], 4);
  h3.set([1, 1], 5);
  h3.set([0, 0, 0], 6);
  h3.set([0, 0, 1], 7);
  h3.set([0, 1, 0], 8);
  h3.set([0, 1, 1], 9);
  h3.set([1, 0, 0], 10);
  h3.set([1, 0, 1], 11);
  h3.set([1, 1, 0], 12);
  h3.set([1, 1, 1], 13);
  expect(h3.toArray()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
});

test('lerp', () => {
  const [a, b] = [0, 2 / 3].map(x => lerp(-1, 1, x));
  const [c, d] = [a, b].map(x => lerp(0, 2, x));
  expect(c).toBeLessThan(d);
  const [e, f] = [c, d].map(x => lerp(0, 2, x));
  expect(e).toBeLessThan(f);
});
