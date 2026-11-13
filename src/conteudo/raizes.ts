import fs from 'node:fs';
import path from 'node:path';

export type NomeRaiz = 'exemplo' | 'publico' | 'privado';
export type EtapaEditorial = 'anotacao' | 'rascunho' | 'revisao-ia' | 'aprovado';

export interface Raiz {
  nome: NomeRaiz;
  caminho: string;
  privada: boolean;
}

export interface OpcoesRaizes {
  /** Diretório que contém as pastas de conteúdo (padrão: `<cwd>/conteudo`). */
  baseDir?: string;
  /** Sobrescreve a detecção de modo de desenvolvimento (`astro dev`). */
  dev?: boolean;
  /** Variáveis de ambiente a consultar (padrão: `process.env`). */
  env?: Record<string, string | undefined>;
}

function emModoDev(opcoes?: OpcoesRaizes): boolean {
  if (opcoes?.dev !== undefined) return opcoes.dev;
  const env = opcoes?.env ?? process.env;
  if (env.VITEST || import.meta.env?.MODE === 'test') return false;
  return Boolean(import.meta.env?.DEV) || process.argv.includes('dev');
}

/** Indica se o conteúdo privado (raiz `privado` e páginas `anotacao`) deve entrar. */
export function incluirPrivado(opcoes?: OpcoesRaizes): boolean {
  const env = opcoes?.env ?? process.env;
  return emModoDev(opcoes) || env.CONTEUDO_PRIVADO === '1';
}

/** Retorna as raízes de conteúdo ativas e existentes no disco. */
export function raizesAtivas(opcoes?: OpcoesRaizes): Raiz[] {
  const baseDir = opcoes?.baseDir ?? path.resolve(process.cwd(), 'conteudo');
  const ativas: Raiz[] = [];

  const caminhoPublico = path.join(baseDir, 'publico');
  const caminhoExemplo = path.join(baseDir, 'exemplo');

  if (fs.existsSync(caminhoPublico)) {
    ativas.push({ nome: 'publico', caminho: caminhoPublico, privada: false });
  } else if (fs.existsSync(caminhoExemplo)) {
    ativas.push({ nome: 'exemplo', caminho: caminhoExemplo, privada: false });
  }

  if (incluirPrivado(opcoes)) {
    const caminhoPrivado = path.join(baseDir, 'privado');
    if (fs.existsSync(caminhoPrivado)) {
      ativas.push({ nome: 'privado', caminho: caminhoPrivado, privada: true });
    }
  }

  return ativas;
}

/** Páginas em `anotacao` são tratadas como privadas em qualquer raiz. */
export function ehPrivadaPorEtapa(etapa: EtapaEditorial): boolean {
  return etapa === 'anotacao';
}

/** Decide se uma página com determinada `etapa` entra no resultado atual. */
export function paginaVisivel(etapa: EtapaEditorial, opcoes?: OpcoesRaizes): boolean {
  if (ehPrivadaPorEtapa(etapa)) return incluirPrivado(opcoes);
  return true;
}
