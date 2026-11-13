import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { incluirPrivado, type EtapaEditorial, type OpcoesRaizes } from './raizes';

export interface ArquivosMudanca {
  texto: string[];
  figuras: string[];
  imagens: string[];
}

export interface LinhasMudanca {
  adicionadas: number;
  removidas: number;
}

export interface MudancaEditorial {
  hash: string;
  data: string;
  assunto: string;
  etapa: EtapaEditorial | null;
  comIA: boolean;
  arquivos: ArquivosMudanca;
  linhas: LinhasMudanca;
  diffTexto?: string;
}

export interface OpcoesHistorico extends OpcoesRaizes {
  /** Inclui commits em etapa `anotacao` mesmo fora do modo dev (útil em testes). */
  incluirAnotacao?: boolean;
}

const ETAPAS_VALIDAS = new Set<EtapaEditorial>(['anotacao', 'rascunho', 'revisao-ia', 'aprovado']);

const PADRAO_MODELO_IA =
  /^Co-Authored-By:\s*.*(claude|anthropic|gemini|gpt|openai|codex|copilot|llm|bot|noreply@anthropic\.com|noreply@openai\.com|noreply@google\.com)/im;

const SEP_REGISTRO = '\x1e';
const SEP_CAMPO = '\x1f';

function paraPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

function executarGit(gitRoot: string, args: string[]): string | null {
  try {
    return execFileSync('git', ['-c', 'core.quotePath=false', '-C', gitRoot, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

/**
 * Encontra a raiz git responsável pela pasta da página.
 * Para `conteudo/publico` e `conteudo/privado`, exige `.git` próprio na raiz
 * para não herdar o repositório do motor quando forem pastas sem git.
 */
export function encontrarRaizGit(pastaPagina: string): string | null {
  const abs = path.resolve(pastaPagina);
  const partes = paraPosix(abs).split('/');
  const idxConteudo = partes.lastIndexOf('conteudo');

  if (idxConteudo !== -1 && idxConteudo + 1 < partes.length) {
    const nomeRaiz = partes[idxConteudo + 1];
    if (nomeRaiz === 'publico' || nomeRaiz === 'privado') {
      const raizConteudo = partes.slice(0, idxConteudo + 2).join('/');
      if (!fs.existsSync(path.join(raizConteudo, '.git'))) {
        return null;
      }
    }
  }

  const dirBusca = fs.existsSync(abs) ? fs.realpathSync.native(abs) : fs.realpathSync.native(path.dirname(abs));
  if (!fs.existsSync(dirBusca)) return null;

  const topo = executarGit(dirBusca, ['rev-parse', '--show-toplevel']);
  if (!topo) return null;
  return fs.realpathSync.native(path.resolve(topo.trim()));
}

/** Extrai o campo `etapa` do frontmatter YAML de um conteúdo MDX. */
export function extrairEtapaFrontmatter(conteudo: string): EtapaEditorial | null {
  const match = conteudo.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    const dados = YAML.parse(match[1]) as { etapa?: unknown } | null;
    if (dados && typeof dados.etapa === 'string' && ETAPAS_VALIDAS.has(dados.etapa as EtapaEditorial)) {
      return dados.etapa as EtapaEditorial;
    }
  } catch {
    return null;
  }
  return null;
}

export function ehCommitComIA(mensagemCompleta: string): boolean {
  return PADRAO_MODELO_IA.test(mensagemCompleta);
}

interface CommitBruto {
  hash: string;
  data: string;
  assunto: string;
  corpo: string;
  caminhoTextoNoCommit?: string;
}

function parsearCommitsFollow(saida: string): CommitBruto[] {
  const commits: CommitBruto[] = [];
  const blocos = saida.split(SEP_REGISTRO).filter((b) => b.trim().length > 0);

  for (const bloco of blocos) {
    const partes = bloco.split(SEP_CAMPO);
    if (partes.length < 4) continue;
    const hash = partes[0].trim();
    const data = partes[1].trim();
    const assunto = partes[2].trim();
    const corpo = partes[3] ?? '';
    const resto = partes.slice(4).join(SEP_CAMPO).trim();

    let caminhoTextoNoCommit: string | undefined;
    for (const linha of resto.split(/\r?\n/)) {
      const l = linha.trim();
      if (!l) continue;
      const cols = l.split('\t');
      if (cols.length >= 2) {
        // Em rename (R100 old new), cols[2] é o caminho neste commit (o novo após o rename).
        caminhoTextoNoCommit = cols.length >= 3 ? cols[2] : cols[1];
        break;
      }
    }

    commits.push({ hash, data, assunto, corpo, caminhoTextoNoCommit });
  }

  return commits;
}

function parsearCommitsSimples(saida: string): CommitBruto[] {
  const commits: CommitBruto[] = [];
  const blocos = saida.split(SEP_REGISTRO).filter((b) => b.trim().length > 0);

  for (const bloco of blocos) {
    const partes = bloco.split(SEP_CAMPO);
    if (partes.length < 4) continue;
    commits.push({
      hash: partes[0].trim(),
      data: partes[1].trim(),
      assunto: partes[2].trim(),
      corpo: partes[3] ?? '',
    });
  }

  return commits;
}

function classificarArquivos(caminhos: string[], pastasConhecidas: Set<string>): ArquivosMudanca {
  const texto = new Set<string>();
  const figuras = new Set<string>();
  const imagens = new Set<string>();

  for (const arq of caminhos) {
    const posix = paraPosix(arq);
    let relativo: string | null = null;

    for (const pasta of pastasConhecidas) {
      const prefixo = pasta === '.' ? '' : `${pasta}/`;
      if (prefixo === '' || posix.startsWith(prefixo)) {
        relativo = posix.slice(prefixo.length);
        break;
      }
    }

    if (!relativo) continue;

    if (relativo === 'index.mdx' || relativo.endsWith('.mdx') || relativo.endsWith('.md')) {
      texto.add(relativo);
    } else if (relativo.startsWith('figuras/')) {
      figuras.add(relativo.slice('figuras/'.length));
    } else if (relativo.startsWith('imagens/')) {
      imagens.add(relativo.slice('imagens/'.length));
    }
  }

  return {
    texto: [...texto],
    figuras: [...figuras],
    imagens: [...imagens],
  };
}

/**
 * Devolve o histórico editorial de uma página (da mudança mais antiga para a mais nova),
 * lendo o histórico git da raiz de conteúdo em que a página está.
 * Sem git na raiz ou sem commits, devolve lista vazia.
 */
export function historicoDaPagina(caminho: string, opcoes?: OpcoesHistorico): MudancaEditorial[] {
  if (!caminho || !caminho.trim()) return [];

  const absEntrada = path.resolve(caminho);
  const pastaBruta = absEntrada.endsWith('.mdx') || absEntrada.endsWith('.md') ? path.dirname(absEntrada) : absEntrada;
  if (!fs.existsSync(pastaBruta)) return [];
  const pastaPagina = fs.realpathSync.native(pastaBruta);

  const gitRoot = encontrarRaizGit(pastaPagina);
  if (!gitRoot) return [];

  const relPasta = paraPosix(path.relative(gitRoot, pastaPagina)) || '.';
  const relIndex = relPasta === '.' ? 'index.mdx' : `${relPasta}/index.mdx`;

  const formato = '%x1e%H%x1f%aI%x1f%s%x1f%B%x1f';

  // 1. Segue o index.mdx ao longo de renomeações.
  const saidaFollow = executarGit(gitRoot, ['log', '--follow', '--name-status', `--format=${formato}`, '--', relIndex]);
  const commitsFollow = saidaFollow ? parsearCommitsFollow(saidaFollow) : [];

  // Reconstroi a lista de pastas históricas da página para também capturar commits só de figuras/imagens.
  const pastasConhecidas = new Set<string>([relPasta]);
  const caminhoTextoPorHash = new Map<string, string>();

  // Como commitsFollow vem do mais novo para o mais antigo, rastreamos os caminhos anteriores.
  for (const c of commitsFollow) {
    if (c.caminhoTextoNoCommit) {
      caminhoTextoPorHash.set(c.hash, c.caminhoTextoNoCommit);
      const dir = paraPosix(path.posix.dirname(c.caminhoTextoNoCommit));
      pastasConhecidas.add(dir);
    }
  }

  // 2. Busca commits que tocaram qualquer arquivo nas pastas da página.
  const porHash = new Map<string, CommitBruto>();
  for (const c of commitsFollow) {
    porHash.set(c.hash, c);
  }

  for (const pasta of pastasConhecidas) {
    const saidaPasta = executarGit(gitRoot, ['log', `--format=${formato}`, '--', pasta]);
    if (!saidaPasta) continue;
    for (const c of parsearCommitsSimples(saidaPasta)) {
      if (!porHash.has(c.hash)) {
        porHash.set(c.hash, c);
      }
    }
  }

  if (porHash.size === 0) return [];

  // Ordena da mudança mais antiga para a mais nova usando a ordem real do grafo git
  // (evita empate de timestamp quando dois commits ocorrem no mesmo segundo).
  const revList = executarGit(gitRoot, ['rev-list', '--reverse', 'HEAD']);
  const ordemRev = new Map<string, number>();
  if (revList) {
    revList
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((h, idx) => ordemRev.set(h.trim(), idx));
  }

  const ordenados = [...porHash.values()].sort((a, b) => {
    const ia = ordemRev.get(a.hash);
    const ib = ordemRev.get(b.hash);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    return new Date(a.data).getTime() - new Date(b.data).getTime();
  });

  // Preenche caminhoTextoPorHash para commits que não tocaram diretamente index.mdx.
  let ultimoCaminhoTexto = relIndex;
  for (let i = ordenados.length - 1; i >= 0; i--) {
    const c = ordenados[i];
    const encontrado = caminhoTextoPorHash.get(c.hash);
    if (encontrado) {
      ultimoCaminhoTexto = encontrado;
    } else {
      caminhoTextoPorHash.set(c.hash, ultimoCaminhoTexto);
    }
  }

  const incluirAnotacao = opcoes?.incluirAnotacao ?? incluirPrivado(opcoes);
  const mudancas: MudancaEditorial[] = [];

  let ultimoRascunho: { hash: string; caminhoTexto: string } | null = null;
  let jaTeveDiffRevisao = false;

  for (const c of ordenados) {
    const caminhoTexto = caminhoTextoPorHash.get(c.hash) ?? relIndex;
    const conteudoMdx = executarGit(gitRoot, ['show', `${c.hash}:${caminhoTexto}`]);
    const etapa = conteudoMdx ? extrairEtapaFrontmatter(conteudoMdx) : null;

    if (!incluirAnotacao && etapa === 'anotacao') {
      continue;
    }

    // Arquivos e linhas tocados neste commit dentro das pastas da página.
    const numstat = executarGit(gitRoot, ['show', '--numstat', '--format=', c.hash, '--', ...pastasConhecidas]) ?? '';
    const arquivosTocados: string[] = [];
    let adicionadas = 0;
    let removidas = 0;

    for (const linha of numstat.split(/\r?\n/)) {
      if (!linha.trim()) continue;
      const partes = linha.split('\t');
      if (partes.length < 3) continue;
      const [addStr, remStr, arq] = partes;
      // Em rename, git pode mostrar "old => new" ou com --numstat sem -M mostrar o caminho direto.
      const arqLimpo = arq.includes(' => ') ? arq.replace(/\{[^}]*=>\s*([^}]*)\}/g, '$1').split(' => ').pop()!.trim() : arq;
      arquivosTocados.push(arqLimpo);

      if (arqLimpo === caminhoTexto || arqLimpo.endsWith('/index.mdx')) {
        const add = Number.parseInt(addStr, 10);
        const rem = Number.parseInt(remStr, 10);
        if (!Number.isNaN(add)) adicionadas += add;
        if (!Number.isNaN(rem)) removidas += rem;
      }
    }

    const arquivos = classificarArquivos(arquivosTocados, pastasConhecidas);
    const comIA = ehCommitComIA(`${c.assunto}\n${c.corpo}`);

    let diffTexto: string | undefined;
    if (etapa === 'revisao-ia' && ultimoRascunho && !jaTeveDiffRevisao) {
      const diff = executarGit(gitRoot, [
        'diff',
        '-U3',
        `${ultimoRascunho.hash}:${ultimoRascunho.caminhoTexto}`,
        `${c.hash}:${caminhoTexto}`,
      ]);
      if (diff && diff.trim().length > 0) {
        diffTexto = diff;
        jaTeveDiffRevisao = true;
      }
    }

    if (etapa === 'rascunho') {
      ultimoRascunho = { hash: c.hash, caminhoTexto };
    }

    mudancas.push({
      hash: c.hash.slice(0, 7),
      data: c.data,
      assunto: c.assunto,
      etapa,
      comIA,
      arquivos,
      linhas: { adicionadas, removidas },
      ...(diffTexto ? { diffTexto } : {}),
    });
  }

  return mudancas;
}

const ROTULOS_ETAPA: Record<EtapaEditorial, string> = {
  anotacao: 'anotação',
  rascunho: 'rascunho',
  'revisao-ia': 'revisão com IA',
  aprovado: 'aprovado',
};

export function rotuloEtapa(etapa: EtapaEditorial): string {
  return ROTULOS_ETAPA[etapa] ?? etapa;
}
