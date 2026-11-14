import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { historicoDaPagina } from '../src/conteudo/historico';

const dirsParaLimpar: string[] = [];

function criarTempDir(prefixo = 'scriptorium-hist-'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
  dirsParaLimpar.push(dir);
  return dir;
}

function git(cwd: string, args: string[], envExtras?: Record<string, string>): string {
  return execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Autor Teste',
      GIT_AUTHOR_EMAIL: 'autor@example.com',
      GIT_COMMITTER_NAME: 'Autor Teste',
      GIT_COMMITTER_EMAIL: 'autor@example.com',
      ...envExtras,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function iniciarRepo(dir: string): void {
  git(dir, ['init']);
  git(dir, ['config', 'user.name', 'Autor Teste']);
  git(dir, ['config', 'user.email', 'autor@example.com']);
}

function escreverPagina(pasta: string, etapa: string, corpo: string): void {
  fs.mkdirSync(pasta, { recursive: true });
  const conteudo = `---\ntitulo: Página Teste\nresumo: Resumo teste\netapa: ${etapa}\n---\n\n${corpo}\n`;
  fs.writeFileSync(path.join(pasta, 'index.mdx'), conteudo, 'utf8');
}

afterEach(() => {
  while (dirsParaLimpar.length > 0) {
    const dir = dirsParaLimpar.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('historicoDaPagina', () => {
  it('retorna lista vazia para página em diretório sem git', () => {
    const dir = criarTempDir();
    const pasta = path.join(dir, 'blog', 'sem-git');
    escreverPagina(pasta, 'rascunho', 'Texto sem git.');

    expect(historicoDaPagina(pasta)).toEqual([]);
  });

  it('retorna lista vazia para conteudo/publico sem .git próprio mesmo dentro de outro repo', () => {
    const repoPai = criarTempDir();
    iniciarRepo(repoPai);

    const pastaPublico = path.join(repoPai, 'conteudo', 'publico', 'blog', 'post-sem-git');
    escreverPagina(pastaPublico, 'rascunho', 'Texto em publico sem git.');
    git(repoPai, ['add', '.']);
    git(repoPai, ['commit', '-m', 'commit no pai']);

    expect(historicoDaPagina(pastaPublico)).toEqual([]);
  });

  it('ordena mudanças da mais antiga para a mais nova e detecta mudança de etapa e trailer de IA', () => {
    const repo = criarTempDir();
    iniciarRepo(repo);

    const pasta = path.join(repo, 'blog', 'artigo');

    // 1. Anotação privada (deve ser omitida quando incluirPrivado é falso)
    escreverPagina(pasta, 'anotacao', 'Notas soltas privadas.');
    git(repo, ['add', '.']);
    git(repo, ['commit', '-m', 'conteudo(artigo): anotação inicial']);

    // 2. Rascunho à mão
    escreverPagina(pasta, 'rascunho', 'Primeiro parágrafo escrito à mão.\nSegunda linha do rascunho.');
    git(repo, ['add', '.']);
    git(repo, ['commit', '-m', 'conteudo(artigo): rascunho']);

    // 3. Figura adicionada em commit separado
    fs.mkdirSync(path.join(pasta, 'figuras'), { recursive: true });
    fs.writeFileSync(path.join(pasta, 'figuras', 'onda.js'), 'export default {};\n', 'utf8');
    git(repo, ['add', '.']);
    git(repo, [
      'commit',
      '-m',
      'conteudo(artigo): adiciona figura da onda',
      '-m',
      'Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>',
    ]);

    // 4. Revisão com IA
    escreverPagina(pasta, 'revisao-ia', 'Primeiro parágrafo revisado.\nSegunda linha do rascunho.');
    git(repo, ['add', '.']);
    git(repo, [
      'commit',
      '-m',
      'conteudo(artigo): revisão com IA',
      '-m',
      'Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>',
    ]);

    // 5. Aprovação final à mão
    escreverPagina(pasta, 'aprovado', 'Primeiro parágrafo revisado.\nSegunda linha do rascunho.');
    git(repo, ['add', '.']);
    git(repo, ['commit', '-m', 'conteudo(artigo): aprovado']);

    const hist = historicoDaPagina(pasta, { dev: false, env: {} });

    expect(hist.map((m) => m.assunto)).toEqual([
      'conteudo(artigo): rascunho',
      'conteudo(artigo): adiciona figura da onda',
      'conteudo(artigo): revisão com IA',
      'conteudo(artigo): aprovado',
    ]);

    expect(hist.map((m) => m.etapa)).toEqual(['rascunho', 'rascunho', 'revisao-ia', 'aprovado']);
    expect(hist.map((m) => m.comIA)).toEqual([false, true, true, false]);

    // Commit da figura registra figura tocada
    expect(hist[1].arquivos.figuras).toEqual(['onda.js']);

    // Commit da revisão com IA tem linhas adicionadas/removidas e o diff entre rascunho e revisao-ia
    expect(hist[2].linhas.adicionadas).toBeGreaterThan(0);
    expect(hist[2].linhas.removidas).toBeGreaterThan(0);
    expect(hist[2].diffTexto).toContain('-Primeiro parágrafo escrito à mão.');
    expect(hist[2].diffTexto).toContain('+Primeiro parágrafo revisado.');
  }, 15000);

  it('não marca coautor humano como comIA', () => {
    const repo = criarTempDir();
    iniciarRepo(repo);

    const pasta = path.join(repo, 'blog', 'coautor-humano');
    escreverPagina(pasta, 'rascunho', 'Texto em dupla.');
    git(repo, ['add', '.']);
    git(repo, [
      'commit',
      '-m',
      'conteudo(coautor-humano): rascunho',
      '-m',
      'Co-Authored-By: Maria Silva <maria@example.com>',
    ]);

    const hist = historicoDaPagina(pasta, { dev: false, env: {} });
    expect(hist).toHaveLength(1);
    expect(hist[0].comIA).toBe(false);
  });

  it('acompanha o histórico quando a página é renomeada (ex.: post promovido a capítulo)', () => {
    const repo = criarTempDir();
    iniciarRepo(repo);

    const pastaAntiga = path.join(repo, 'blog', 'meu-tema');
    escreverPagina(pastaAntiga, 'rascunho', 'Rascunho original no blog.');
    git(repo, ['add', '.']);
    git(repo, ['commit', '-m', 'conteudo(meu-tema): rascunho no blog']);

    const pastaNova = path.join(repo, 'livros', 'guia', 'meu-tema');
    fs.mkdirSync(path.dirname(pastaNova), { recursive: true });
    fs.renameSync(pastaAntiga, pastaNova);
    git(repo, ['add', '-A']);
    git(repo, ['commit', '-m', 'conteudo(meu-tema): promove post para capítulo']);

    escreverPagina(pastaNova, 'aprovado', 'Rascunho original no blog.\nAjuste final no livro.');
    git(repo, ['add', '.']);
    git(repo, ['commit', '-m', 'conteudo(meu-tema): aprovado no livro']);

    const hist = historicoDaPagina(pastaNova, { dev: false, env: {} });

    expect(hist).toHaveLength(3);
    expect(hist.map((m) => m.assunto)).toEqual([
      'conteudo(meu-tema): rascunho no blog',
      'conteudo(meu-tema): promove post para capítulo',
      'conteudo(meu-tema): aprovado no livro',
    ]);
    expect(hist[0].etapa).toBe('rascunho');
    expect(hist[2].etapa).toBe('aprovado');
  }, 15000);
});
