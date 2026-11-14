import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { lerLivroYaml, listarLivros } from './livro';
import { paginaVisivel, raizesAtivas, type EtapaEditorial, type OpcoesRaizes } from './raizes';

export interface FlashcardExtraido {
  id: string;
  frente: string;
  verso: string;
}

export interface OpcoesExtrairCards {
  /** Identificador estável da página (ex.: `livros/guia-de-rf/rsrp-e-rsrq` ou `blog/meu-post`). */
  pagina?: string;
}

export interface EntradaCardAnki {
  id: string;
  frente: string;
  verso: string;
  tags?: string[];
  baralho?: string;
}

export interface ExportacaoFlashcards {
  /** Caminho relativo dentro de `dist-flashcards/` e `/flashcards/` (ex.: `livros/guia-de-rf/rsrp-e-rsrq.txt`). */
  caminhoRelativo: string;
  /** Nome do baralho no Anki (ex.: `Guia de RF::RSRP e RSRQ`). */
  baralho: string;
  /** Conteúdo completo do arquivo `.txt` no formato Anki. */
  conteudo: string;
  /** Quantidade de cards exportados. */
  quantidade: number;
}

interface FrontmatterPagina {
  titulo?: string;
  etapa?: EtapaEditorial;
  tags?: string[];
}

/** Normaliza o identificador da página para gerar IDs estáveis independentes da raiz e do SO. */
export function normalizarPagina(pagina: string): string {
  const posix = pagina.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const semIndex = posix.replace(/\/index\.mdx$/i, '');
  const matchRaiz = semIndex.match(/(?:^|\/)conteudo\/(?:exemplo|publico|privado)\/(.+)$/);
  return matchRaiz ? matchRaiz[1] : semIndex;
}

/** Gera um identificador estável para o Anki a partir da página e da frente do card. */
export function gerarIdCard(pagina: string, frente: string): string {
  const paginaLimpa = normalizarPagina(pagina);
  const frenteLimpa = frente.trim();
  return crypto.createHash('sha256').update(`${paginaLimpa}\0${frenteLimpa}`).digest('hex').slice(0, 16);
}

/** Remove blocos de código cercados (``` ou ~~~) para não extrair exemplos da documentação. */
function removerBlocosCodigo(mdx: string): string {
  return mdx.replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\r?\n[\s\S]*?\r?\n\1\2[ \t]*$/gm, '');
}

/** Remove indentação comum de linhas não vazias e apara bordas. */
function desindentar(texto: string): string {
  const linhas = texto.replace(/^\s*\r?\n/, '').replace(/\r?\n\s*$/, '').split(/\r?\n/);
  let menorIndent = Infinity;
  for (const linha of linhas) {
    if (!linha.trim()) continue;
    const match = linha.match(/^[ \t]*/);
    const indent = match ? match[0].length : 0;
    if (indent < menorIndent) menorIndent = indent;
  }
  if (!Number.isFinite(menorIndent) || menorIndent === 0) {
    return linhas.join('\n').trim();
  }
  return linhas.map((l) => (l.trim() ? l.slice(menorIndent) : '')).join('\n').trim();
}

function decodificarEntidadesBasicas(texto: string): string {
  return texto
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function lerAtributos(fonte: string, inicio: number): {
  atributos: Record<string, string>;
  autoFechada: boolean;
  fimTag: number;
} | null {
  const atributos: Record<string, string> = {};
  let i = inicio;
  const n = fonte.length;

  while (i < n) {
    while (i < n && /\s/.test(fonte[i])) i++;
    if (i >= n) return null;

    if (fonte[i] === '/' && fonte[i + 1] === '>') {
      return { atributos, autoFechada: true, fimTag: i + 2 };
    }
    if (fonte[i] === '>') {
      return { atributos, autoFechada: false, fimTag: i + 1 };
    }

    const inicioNome = i;
    while (i < n && /[A-Za-z0-9_:-]/.test(fonte[i])) i++;
    const nome = fonte.slice(inicioNome, i);
    if (!nome) {
      i++;
      continue;
    }

    while (i < n && /\s/.test(fonte[i])) i++;
    if (fonte[i] !== '=') {
      atributos[nome] = 'true';
      continue;
    }
    i++;
    while (i < n && /\s/.test(fonte[i])) i++;
    if (i >= n) return null;

    const delimitador = fonte[i];
    if (delimitador === '"' || delimitador === "'") {
      i++;
      let valor = '';
      while (i < n && fonte[i] !== delimitador) {
        if (fonte[i] === '\\' && i + 1 < n) {
          valor += fonte[i + 1];
          i += 2;
        } else {
          valor += fonte[i];
          i++;
        }
      }
      if (fonte[i] === delimitador) i++;
      atributos[nome] = decodificarEntidadesBasicas(valor);
    } else if (delimitador === '{') {
      i++;
      while (i < n && /\s/.test(fonte[i])) i++;
      const aspas = fonte[i];
      if (aspas === '"' || aspas === "'" || aspas === '`') {
        i++;
        let valor = '';
        while (i < n && fonte[i] !== aspas) {
          if (fonte[i] === '\\' && i + 1 < n) {
            valor += fonte[i + 1];
            i += 2;
          } else {
            valor += fonte[i];
            i++;
          }
        }
        if (fonte[i] === aspas) i++;
        while (i < n && fonte[i] !== '}') i++;
        if (fonte[i] === '}') i++;
        atributos[nome] = valor;
      } else {
        let prof = 1;
        const inicioExpr = i;
        while (i < n && prof > 0) {
          if (fonte[i] === '{') prof++;
          else if (fonte[i] === '}') prof--;
          i++;
        }
        atributos[nome] = fonte.slice(inicioExpr, i - 1).trim();
      }
    } else {
      const inicioVal = i;
      while (i < n && !/[\s/>]/.test(fonte[i])) i++;
      atributos[nome] = fonte.slice(inicioVal, i);
    }
  }

  return null;
}

/** Extrai flashcards a partir do conteúdo MDX bruto e do identificador da página. */
export function extrairCardsDoTexto(conteudoMdx: string, pagina = ''): FlashcardExtraido[] {
  const semCodigo = removerBlocosCodigo(conteudoMdx);
  const cards: FlashcardExtraido[] = [];
  const marcador = '<Flashcard';
  let pos = 0;

  while (pos < semCodigo.length) {
    const idx = semCodigo.indexOf(marcador, pos);
    if (idx === -1) break;

    const proximoChar = semCodigo[idx + marcador.length];
    if (proximoChar && !/[\s/>]/.test(proximoChar)) {
      pos = idx + marcador.length;
      continue;
    }

    const parsed = lerAtributos(semCodigo, idx + marcador.length);
    if (!parsed) {
      pos = idx + marcador.length;
      continue;
    }

    const frente = (parsed.atributos.frente ?? '').trim();
    let verso = (parsed.atributos.verso ?? '').trim();

    if (parsed.autoFechada) {
      pos = parsed.fimTag;
    } else {
      const idxFechamento = semCodigo.indexOf('</Flashcard>', parsed.fimTag);
      if (idxFechamento === -1) {
        pos = parsed.fimTag;
        continue;
      }
      const corpo = desindentar(semCodigo.slice(parsed.fimTag, idxFechamento));
      if (!verso && corpo) {
        verso = corpo;
      }
      pos = idxFechamento + '</Flashcard>'.length;
    }

    if (frente && verso) {
      cards.push({
        id: gerarIdCard(pagina, frente),
        frente,
        verso,
      });
    }
  }

  return cards;
}

/** Lê um arquivo `.mdx` do disco e extrai os flashcards com IDs estáveis. */
export function extrairCards(arquivoMdx: string, opcoes?: OpcoesExtrairCards): FlashcardExtraido[] {
  const conteudo = fs.readFileSync(arquivoMdx, 'utf8');
  const pagina = opcoes?.pagina ?? arquivoMdx;
  return extrairCardsDoTexto(conteudo, pagina);
}

/** Escapa tabulações e quebras de linha para o formato TSV + HTML do Anki. */
export function escaparCampoAnki(texto: string): string {
  return texto
    .trim()
    .replace(/\t/g, '&#9;')
    .replace(/\r?\n/g, '<br>');
}

function formatarTagsAnki(tags?: string[]): string {
  if (!tags || tags.length === 0) return '';
  return tags
    .map((t) => t.trim().replace(/\s+/g, '-'))
    .filter(Boolean)
    .join(' ');
}

/**
 * Formata uma lista de cards no arquivo `.txt` de importação do Anki.
 * Quando `baralhoPorCard` é true, inclui `#deck column:5` para agrupar um livro inteiro
 * preservando os sub-baralhos `<Livro>::<Capítulo>`.
 */
export function formatarArquivoAnki(
  baralho: string,
  cards: readonly EntradaCardAnki[],
  opcoes?: { baralhoPorCard?: boolean },
): string {
  const baralhoLimpo = escaparCampoAnki(baralho);
  const incluirColunaBaralho = Boolean(opcoes?.baralhoPorCard);

  const cabecalhos = [
    '#separator:tab',
    '#html:true',
    '#notetype:Basic',
    `#deck:${baralhoLimpo}`,
    '#guid column:1',
    '#tags column:4',
  ];
  if (incluirColunaBaralho) {
    cabecalhos.push('#deck column:5');
  }

  const linhas = cards.map((card) => {
    const colunas = [
      escaparCampoAnki(card.id),
      escaparCampoAnki(card.frente),
      escaparCampoAnki(card.verso),
      escaparCampoAnki(formatarTagsAnki(card.tags)),
    ];
    if (incluirColunaBaralho) {
      colunas.push(escaparCampoAnki(card.baralho ?? baralhoLimpo));
    }
    return colunas.join('\t');
  });

  return [...cabecalhos, ...linhas, ''].join('\n');
}

function lerFrontmatter(conteudoMdx: string): FrontmatterPagina {
  const match = conteudoMdx.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {};
  const dados = YAML.parse(match[1]) as Record<string, unknown> | null;
  if (!dados || typeof dados !== 'object') return {};

  const tags = Array.isArray(dados.tags)
    ? dados.tags.filter((t): t is string => typeof t === 'string')
    : undefined;

  return {
    titulo: typeof dados.titulo === 'string' ? dados.titulo.trim() : undefined,
    etapa: typeof dados.etapa === 'string' ? (dados.etapa as EtapaEditorial) : undefined,
    tags,
  };
}

/** Coleta todas as exportações de flashcards (por página e por livro) das raízes ativas. */
export function coletarExportacoesFlashcards(opcoes?: OpcoesRaizes): ExportacaoFlashcards[] {
  const raizes = raizesAtivas(opcoes);
  const exportacoes: ExportacaoFlashcards[] = [];

  for (const infoLivro of listarLivros(opcoes)) {
    const livroYaml = lerLivroYaml(infoLivro.caminhoYaml);
    const dirLivro = path.dirname(infoLivro.caminhoYaml);
    const cardsDoLivro: EntradaCardAnki[] = [];

    for (const parte of livroYaml.partes) {
      for (const capSlug of parte.capitulos) {
        const arquivoMdx = path.join(dirLivro, capSlug, 'index.mdx');
        if (!fs.existsSync(arquivoMdx)) continue;

        const conteudo = fs.readFileSync(arquivoMdx, 'utf8');
        const fm = lerFrontmatter(conteudo);
        if (fm.etapa && !paginaVisivel(fm.etapa, opcoes)) continue;

        const pagina = `livros/${infoLivro.id}/${capSlug}`;
        const cards = extrairCardsDoTexto(conteudo, pagina);
        if (cards.length === 0) continue;

        const tituloCap = fm.titulo || capSlug;
        const baralhoCap = `${livroYaml.titulo}::${tituloCap}`;
        const entradas: EntradaCardAnki[] = cards.map((c) => ({
          ...c,
          tags: fm.tags,
          baralho: baralhoCap,
        }));

        exportacoes.push({
          caminhoRelativo: `${pagina}.txt`,
          baralho: baralhoCap,
          conteudo: formatarArquivoAnki(baralhoCap, entradas),
          quantidade: entradas.length,
        });

        cardsDoLivro.push(...entradas);
      }
    }

    if (cardsDoLivro.length > 0) {
      exportacoes.push({
        caminhoRelativo: `livros/${infoLivro.id}.txt`,
        baralho: livroYaml.titulo,
        conteudo: formatarArquivoAnki(livroYaml.titulo, cardsDoLivro, { baralhoPorCard: true }),
        quantidade: cardsDoLivro.length,
      });
    }
  }

  const postsVistos = new Set<string>();
  for (const raiz of raizes) {
    const dirBlog = path.join(raiz.caminho, 'blog');
    if (!fs.existsSync(dirBlog)) continue;

    for (const entrada of fs.readdirSync(dirBlog, { withFileTypes: true })) {
      if (!entrada.isDirectory()) continue;
      if (postsVistos.has(entrada.name)) continue;

      const arquivoMdx = path.join(dirBlog, entrada.name, 'index.mdx');
      if (!fs.existsSync(arquivoMdx)) continue;
      postsVistos.add(entrada.name);

      const conteudo = fs.readFileSync(arquivoMdx, 'utf8');
      const fm = lerFrontmatter(conteudo);
      if (fm.etapa && !paginaVisivel(fm.etapa, opcoes)) continue;

      const pagina = `blog/${entrada.name}`;
      const cards = extrairCardsDoTexto(conteudo, pagina);
      if (cards.length === 0) continue;

      const tituloPost = fm.titulo || entrada.name;
      const baralhoPost = `Blog::${tituloPost}`;
      const entradas: EntradaCardAnki[] = cards.map((c) => ({
        ...c,
        tags: fm.tags,
        baralho: baralhoPost,
      }));

      exportacoes.push({
        caminhoRelativo: `${pagina}.txt`,
        baralho: baralhoPost,
        conteudo: formatarArquivoAnki(baralhoPost, entradas),
        quantidade: entradas.length,
      });
    }
  }

  return exportacoes;
}
