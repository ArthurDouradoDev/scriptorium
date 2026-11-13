import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { carregarLivro, listarLivros, type EntradaCapituloMinima } from '../src/conteudo/livro';

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rf-guide-livro-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function escreverLivroYaml(livroId: string, conteudoYaml: string): string {
  const dirLivro = path.join(tempDir, 'exemplo', 'livros', livroId);
  fs.mkdirSync(dirLivro, { recursive: true });
  const caminhoYaml = path.join(dirLivro, 'livro.yaml');
  fs.writeFileSync(caminhoYaml, conteudoYaml, 'utf8');
  return caminhoYaml;
}

function cap(
  livroId: string,
  slug: string,
  titulo: string,
  etapa: EntradaCapituloMinima['data']['etapa'] = 'aprovado',
): EntradaCapituloMinima {
  return {
    id: `${livroId}/${slug}`,
    filePath: `conteudo/exemplo/livros/${livroId}/${slug}/index.mdx`,
    data: {
      titulo,
      resumo: `Resumo de ${titulo}`,
      etapa,
    },
  };
}

describe('carregarLivro', () => {
  it('ordena e numera capítulos e liga anterior/próximo nas bordas e entre partes', () => {
    const caminhoYaml = escreverLivroYaml(
      'guia',
      `titulo: Guia Teste
resumo: Um livro de teste.
cores:
  vermelho: sinal útil
  verde: interferência
  ambar: ruído
partes:
  - titulo: Parte Um
    capitulos:
      - cap-b
      - cap-a
  - titulo: Parte Dois
    capitulos:
      - cap-c
`,
    );

    const entradas = [
      cap('guia', 'cap-a', 'Capítulo A'),
      cap('guia', 'cap-c', 'Capítulo C'),
      cap('guia', 'cap-b', 'Capítulo B'),
    ];

    const livro = carregarLivro('guia', entradas, { caminhoYaml, dev: false, env: {} });

    expect(livro.titulo).toBe('Guia Teste');
    expect(livro.cores?.map((c) => c.rotulo)).toEqual(['vermelho', 'verde', 'âmbar']);
    expect(livro.partes).toHaveLength(2);
    expect(livro.partes[0].numero).toBe(1);
    expect(livro.partes[1].numero).toBe(2);

    expect(livro.capitulos.map((c) => [c.numero, c.slug, c.parte.titulo])).toEqual([
      [1, 'cap-b', 'Parte Um'],
      [2, 'cap-a', 'Parte Um'],
      [3, 'cap-c', 'Parte Dois'],
    ]);

    // Borda inicial
    expect(livro.capitulos[0].anterior).toBeNull();
    expect(livro.capitulos[0].proximo).toEqual({ slug: 'cap-a', titulo: 'Capítulo A', numero: 2 });

    // Transição entre partes (cap-a na Parte Um -> cap-c na Parte Dois)
    expect(livro.capitulos[1].anterior).toEqual({ slug: 'cap-b', titulo: 'Capítulo B', numero: 1 });
    expect(livro.capitulos[1].proximo).toEqual({ slug: 'cap-c', titulo: 'Capítulo C', numero: 3 });

    // Borda final
    expect(livro.capitulos[2].anterior).toEqual({ slug: 'cap-a', titulo: 'Capítulo A', numero: 2 });
    expect(livro.capitulos[2].proximo).toBeNull();
  });

  it('falha com o nome do arquivo quando um capítulo listado não existe', () => {
    const caminhoYaml = escreverLivroYaml(
      'guia',
      `titulo: Guia Teste
resumo: Um livro de teste.
partes:
  - titulo: Parte Um
    capitulos:
      - existente
      - faltando
`,
    );

    expect(() =>
      carregarLivro('guia', [cap('guia', 'existente', 'Existente')], { caminhoYaml, dev: false, env: {} }),
    ).toThrow(/faltando.*livro\.yaml|livro\.yaml.*faltando/);
  });

  it('falha com o nome do arquivo quando existe capítulo órfão não listado no livro.yaml', () => {
    const caminhoYaml = escreverLivroYaml(
      'guia',
      `titulo: Guia Teste
resumo: Um livro de teste.
partes:
  - titulo: Parte Um
    capitulos:
      - listado
`,
    );

    const entradas = [
      cap('guia', 'listado', 'Listado'),
      cap('guia', 'orfao', 'Órfão'),
    ];

    expect(() =>
      carregarLivro('guia', entradas, { caminhoYaml, dev: false, env: {} }),
    ).toThrow(/conteudo\/exemplo\/livros\/guia\/orfao\/index\.mdx/);
  });

  it('falha quando o mesmo capítulo aparece duas vezes no livro.yaml', () => {
    const caminhoYaml = escreverLivroYaml(
      'guia',
      `titulo: Guia Teste
resumo: Um livro de teste.
partes:
  - titulo: Parte Um
    capitulos:
      - repetido
      - repetido
`,
    );

    expect(() =>
      carregarLivro('guia', [cap('guia', 'repetido', 'Repetido')], { caminhoYaml, dev: false, env: {} }),
    ).toThrow(/repetido/);
  });

  it('omite capítulos em anotacao no build público sem quebrar a navegação', () => {
    const caminhoYaml = escreverLivroYaml(
      'guia',
      `titulo: Guia Teste
resumo: Um livro de teste.
partes:
  - titulo: Parte Um
    capitulos:
      - um
      - dois
      - tres
`,
    );

    const entradas = [
      cap('guia', 'um', 'Um', 'aprovado'),
      cap('guia', 'dois', 'Dois', 'anotacao'),
      cap('guia', 'tres', 'Três', 'rascunho'),
    ];

    const publico = carregarLivro('guia', entradas, { caminhoYaml, dev: false, env: {} });
    expect(publico.capitulos.map((c) => c.slug)).toEqual(['um', 'tres']);
    expect(publico.capitulos[0].proximo?.slug).toBe('tres');
    expect(publico.capitulos[1].anterior?.slug).toBe('um');

    const local = carregarLivro('guia', entradas, { caminhoYaml, dev: true, env: {} });
    expect(local.capitulos.map((c) => c.slug)).toEqual(['um', 'dois', 'tres']);
  });
});

describe('listarLivros', () => {
  it('lista livros com livro.yaml nas raízes ativas', () => {
    escreverLivroYaml(
      'alfa',
      `titulo: Alfa
resumo: Livro Alfa
partes:
  - titulo: P1
    capitulos: []
`,
    );
    fs.mkdirSync(path.join(tempDir, 'exemplo', 'livros', 'sem-yaml'), { recursive: true });

    const lista = listarLivros({ baseDir: tempDir, dev: false, env: {} });
    expect(lista.map((l) => l.id)).toEqual(['alfa']);
  });
});
