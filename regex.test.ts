import { concat, literal, oneOf } from './regex';

test('literal', () => {
  expect(literal('abcd')).toEqual(/abcd/);
  expect(literal('[')).toEqual(/\[/);
  expect(literal(']')).toEqual(/\]/);
  expect(literal('[abcd]')).toEqual(/\[abcd\]/);
  expect(literal('0..1')).toEqual(/0\.\.1/);
  expect(literal('  ^  ')).toEqual(/  \^  /);
  expect(literal('^  ')).toEqual(/\^  /);
  expect(literal('e/ou')).toEqual(/e\/ou/);
  expect(literal('?')).toEqual(/\?/);
});

test('concat', () => {
  expect(concat(/^/, 'a.b/c', /(1|2)/)).toEqual(/^a\.b\/c(1|2)/);
});

test('oneOf', () => {
  expect(oneOf('a', 'b', 'c')).toEqual(/(a|b|c)/);
});

test('regex', () => {
  const re = concat(
    /^/,
    'https://',
    oneOf(
      concat('eproc.jf', oneOf('pr', 'rs', 'sc'), '.jus.br/eprocV2'),
      'eproc.trf4.jus.br/eproc2trf4',
      'homologa-sc.trf4.jus.br/homologa_1g'
    ),
    '/controlador.php?acao=',
    oneOf(
      'usuario_tipo_monitoramento_localizador_listar',
      'localizador_processos_lista',
      'localizador_orgao_listar',
      'relatorio_geral_listar',
      concat(/[^&]+/, '&acao_origem=principal')
    ),
    '&'
  );
  expect(re).toEqual(
    /^https:\/\/(eproc\.jf(pr|rs|sc)\.jus\.br\/eprocV2|eproc\.trf4\.jus\.br\/eproc2trf4|homologa-sc\.trf4\.jus\.br\/homologa_1g)\/controlador\.php\?acao=(usuario_tipo_monitoramento_localizador_listar|localizador_processos_lista|localizador_orgao_listar|relatorio_geral_listar|[^&]+&acao_origem=principal)&/
  );
});
