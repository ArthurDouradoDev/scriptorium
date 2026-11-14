import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  coletarExportacoesFlashcards,
  escaparCampoAnki,
  extrairCards,
  extrairCardsDoTexto,
  formatarArquivoAnki,
} from '../src/conteudo/flashcards';

describe('extrairCardsDoTexto', () => {
  it('extrai as duas formas do componente Flashcard e ignora blocos de código', () => {
    const mdx = [
      '---',
      'titulo: Teste',
      '---',
      '',
      '```mdx',
      '<Flashcard frente="Exemplo em código" verso="Não deve ser extraído" />',
      '```',
      '',
      '<Flashcards>',
      '  <Flashcard frente="O que é RSRP?" verso="Potência média do sinal de referência." />',
      '  <Flashcard frente="Por que o RSRQ vale −10,8 dB?">',
      '    Porque 1/12 em dB vale −10,8 dB.',
      '  </Flashcard>',
      '  <Flashcard frente="Forma salva pelo editor" verso="Resposta curta">',
      '  </Flashcard>',
      '</Flashcards>',
      '',
    ].join('\n');

    const cards = extrairCardsDoTexto(mdx, 'livros/guia-de-rf/rsrp-e-rsrq');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toMatchObject({
      frente: 'O que é RSRP?',
      verso: 'Potência média do sinal de referência.',
    });
    expect(cards[1]).toMatchObject({
      frente: 'Por que o RSRQ vale −10,8 dB?',
      verso: 'Porque 1/12 em dB vale −10,8 dB.',
    });
    expect(cards[2]).toMatchObject({
      frente: 'Forma salva pelo editor',
      verso: 'Resposta curta',
    });
  });

  it('mantém o identificador estável quando o verso muda, e muda quando frente ou página mudam', () => {
    const pagina = 'livros/guia-de-rf/rsrp-e-rsrq';
    const mdxV1 = '<Flashcard frente="O que o RSRP mede?" verso="Verso 1" />';
    const mdxV2 = '<Flashcard frente="O que o RSRP mede?" verso="Verso 2 atualizado" />';
    const mdxOutraFrente = '<Flashcard frente="Em que unidade o RSRP é medido?" verso="Verso 1" />';

    const [c1] = extrairCardsDoTexto(mdxV1, pagina);
    const [c2] = extrairCardsDoTexto(mdxV2, pagina);
    const [c3] = extrairCardsDoTexto(mdxOutraFrente, pagina);
    const [c4] = extrairCardsDoTexto(mdxV1, 'livros/guia-de-rf/outro-capitulo');

    expect(c1.id).toBe(c2.id);
    expect(c1.id).not.toBe(c3.id);
    expect(c1.id).not.toBe(c4.id);
  });

  it('lê cards do arquivo real de exemplo', () => {
    const caminho = path.resolve('conteudo/exemplo/livros/guia-de-rf/rsrp-e-rsrq/index.mdx');
    const cards = extrairCards(caminho);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards[0].frente).toContain('RSRP');
  });
});

describe('formatarArquivoAnki', () => {
  it('escapa tabulação e quebra de linha e inclui todos os cabeçalhos exigidos', () => {
    expect(escaparCampoAnki('col1\tcol2\nlinha2\r\nlinha3')).toBe('col1&#9;col2<br>linha2<br>linha3');

    const saida = formatarArquivoAnki('Guia de RF::RSRP e RSRQ', [
      {
        id: 'abc123',
        frente: 'Pergunta\tcom tab',
        verso: 'Linha 1\nLinha 2',
        tags: ['lte', 'medidas'],
      },
    ]);

    const linhas = saida.trimEnd().split('\n');
    expect(linhas.slice(0, 6)).toEqual([
      '#separator:tab',
      '#html:true',
      '#notetype:Basic',
      '#deck:Guia de RF::RSRP e RSRQ',
      '#guid column:1',
      '#tags column:4',
    ]);

    const colunas = linhas[6].split('\t');
    expect(colunas).toEqual([
      'abc123',
      'Pergunta&#9;com tab',
      'Linha 1<br>Linha 2',
      'lte medidas',
    ]);
  });
});

describe('coletarExportacoesFlashcards', () => {
  it('exporta páginas públicas e só inclui privadas com CONTEUDO_PRIVADO=1', () => {
    const baseTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'rf-flashcards-'));
    try {
      const livroDir = path.join(baseTemp, 'exemplo', 'livros', 'guia-de-rf');
      const capPub = path.join(livroDir, 'cap-pub');
      const capAnot = path.join(livroDir, 'cap-anot');
      const postPriv = path.join(baseTemp, 'privado', 'blog', 'nota-interna');

      fs.mkdirSync(capPub, { recursive: true });
      fs.mkdirSync(capAnot, { recursive: true });
      fs.mkdirSync(postPriv, { recursive: true });

      fs.writeFileSync(
        path.join(livroDir, 'livro.yaml'),
        [
          'titulo: Guia de RF',
          'resumo: Resumo',
          'partes:',
          '  - titulo: Parte 1',
          '    capitulos:',
          '      - cap-pub',
          '      - cap-anot',
        ].join('\n'),
        'utf8',
      );

      fs.writeFileSync(
        path.join(capPub, 'index.mdx'),
        [
          '---',
          'titulo: Capítulo Público',
          'resumo: Resumo',
          'etapa: aprovado',
          'tags: [rf]',
          '---',
          '<Flashcards>',
          '  <Flashcard frente="F1" verso="V1" />',
          '</Flashcards>',
        ].join('\n'),
        'utf8',
      );

      fs.writeFileSync(
        path.join(capAnot, 'index.mdx'),
        [
          '---',
          'titulo: Capítulo Anotação',
          'resumo: Resumo',
          'etapa: anotacao',
          '---',
          '<Flashcards>',
          '  <Flashcard frente="F2" verso="V2" />',
          '</Flashcards>',
        ].join('\n'),
        'utf8',
      );

      fs.writeFileSync(
        path.join(postPriv, 'index.mdx'),
        [
          '---',
          'titulo: Nota Interna',
          'resumo: Resumo',
          'etapa: rascunho',
          'data: 2026-11-12',
          '---',
          '<Flashcards>',
          '  <Flashcard frente="F3" verso="V3" />',
          '</Flashcards>',
        ].join('\n'),
        'utf8',
      );

      const publicas = coletarExportacoesFlashcards({ baseDir: baseTemp, dev: false, env: {} });
      expect(publicas.map((e) => e.caminhoRelativo).sort()).toEqual([
        'livros/guia-de-rf.txt',
        'livros/guia-de-rf/cap-pub.txt',
      ]);

      const comPrivado = coletarExportacoesFlashcards({
        baseDir: baseTemp,
        dev: false,
        env: { CONTEUDO_PRIVADO: '1' },
      });
      expect(comPrivado.map((e) => e.caminhoRelativo).sort()).toEqual([
        'blog/nota-interna.txt',
        'livros/guia-de-rf.txt',
        'livros/guia-de-rf/cap-anot.txt',
        'livros/guia-de-rf/cap-pub.txt',
      ]);
    } finally {
      fs.rmSync(baseTemp, { recursive: true, force: true });
    }
  });
});
