import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { paginaVisivel, raizesAtivas } from '../src/conteudo/raizes';

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scriptorium-raizes-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function criarPastas(...nomes: string[]) {
  for (const nome of nomes) {
    fs.mkdirSync(path.join(tempDir, nome), { recursive: true });
  }
}

describe('raizesAtivas', () => {
  it('ignora raízes ausentes sem erro', () => {
    const raizes = raizesAtivas({ baseDir: tempDir, dev: false, env: {} });
    expect(raizes).toEqual([]);
  });

  it('usa exemplo quando publico não existe', () => {
    criarPastas('exemplo');
    const raizes = raizesAtivas({ baseDir: tempDir, dev: false, env: {} });
    expect(raizes.map((r) => r.nome)).toEqual(['exemplo']);
  });

  it('usa publico no lugar de exemplo quando publico existe', () => {
    criarPastas('exemplo', 'publico');
    const raizes = raizesAtivas({ baseDir: tempDir, dev: false, env: {} });
    expect(raizes.map((r) => r.nome)).toEqual(['publico']);
  });

  it('mantém privada fora do build público', () => {
    criarPastas('exemplo', 'privado');
    const raizes = raizesAtivas({ baseDir: tempDir, dev: false, env: {} });
    expect(raizes.map((r) => r.nome)).toEqual(['exemplo']);
  });

  it('inclui privada quando está em modo dev', () => {
    criarPastas('exemplo', 'privado');
    const raizes = raizesAtivas({ baseDir: tempDir, dev: true, env: {} });
    expect(raizes.map((r) => r.nome)).toEqual(['exemplo', 'privado']);
  });

  it('inclui privada quando CONTEUDO_PRIVADO=1', () => {
    criarPastas('exemplo', 'privado');
    const raizes = raizesAtivas({
      baseDir: tempDir,
      dev: false,
      env: { CONTEUDO_PRIVADO: '1' },
    });
    expect(raizes.map((r) => r.nome)).toEqual(['exemplo', 'privado']);
  });
});

describe('paginaVisivel', () => {
  it('deixa anotacao fora do build público', () => {
    expect(paginaVisivel('anotacao', { dev: false, env: {} })).toBe(false);
    expect(paginaVisivel('rascunho', { dev: false, env: {} })).toBe(true);
    expect(paginaVisivel('revisao-ia', { dev: false, env: {} })).toBe(true);
    expect(paginaVisivel('aprovado', { dev: false, env: {} })).toBe(true);
  });

  it('inclui anotacao em dev ou com CONTEUDO_PRIVADO=1', () => {
    expect(paginaVisivel('anotacao', { dev: true, env: {} })).toBe(true);
    expect(paginaVisivel('anotacao', { dev: false, env: { CONTEUDO_PRIVADO: '1' } })).toBe(true);
  });
});
