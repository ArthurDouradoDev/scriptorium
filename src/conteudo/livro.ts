import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {
  paginaVisivel,
  raizesAtivas,
  type EtapaEditorial,
  type OpcoesRaizes,
  type Raiz,
} from './raizes';

export interface EntradaCapituloMinima {
  id: string;
  filePath?: string;
  data: {
    titulo: string;
    resumo: string;
    chamada?: string;
    etapa: EtapaEditorial;
    tags?: string[];
  };
}

export interface CorDoLivro {
  id: 'vermelha' | 'verde' | 'ambar';
  cssVar: '--caneta-vermelha' | '--caneta-verde' | '--caneta-ambar';
  rotulo: string;
  significado: string;
}

export interface LigacaoCapitulo {
  slug: string;
  titulo: string;
  numero: number;
}

export interface CapituloDoLivro<T extends EntradaCapituloMinima = EntradaCapituloMinima> {
  slug: string;
  id: string;
  numero: number;
  titulo: string;
  resumo: string;
  etapa: EtapaEditorial;
  parte: {
    numero: number;
    titulo: string;
  };
  anterior: LigacaoCapitulo | null;
  proximo: LigacaoCapitulo | null;
  entrada: T;
}

export interface ParteDoLivro<T extends EntradaCapituloMinima = EntradaCapituloMinima> {
  numero: number;
  titulo: string;
  capitulos: CapituloDoLivro<T>[];
}

export interface LivroCarregado<T extends EntradaCapituloMinima = EntradaCapituloMinima> {
  id: string;
  caminhoYaml: string;
  titulo: string;
  resumo: string;
  cores?: CorDoLivro[];
  partes: ParteDoLivro<T>[];
  capitulos: CapituloDoLivro<T>[];
}

export interface InfoLivro {
  id: string;
  caminhoYaml: string;
  raiz: Raiz;
}

export interface OpcoesCarregarLivro extends OpcoesRaizes {
  /** Caminho explícito do `livro.yaml` (útil em testes). */
  caminhoYaml?: string;
}

interface ParteYaml {
  titulo: string;
  capitulos: string[];
}

interface LivroYaml {
  titulo: string;
  resumo: string;
  partes: ParteYaml[];
  cores?: CorDoLivro[];
}

const MAPA_CORES: Record<string, Omit<CorDoLivro, 'significado'>> = {
  vermelho: { id: 'vermelha', cssVar: '--caneta-vermelha', rotulo: 'vermelho' },
  vermelha: { id: 'vermelha', cssVar: '--caneta-vermelha', rotulo: 'vermelho' },
  verde: { id: 'verde', cssVar: '--caneta-verde', rotulo: 'verde' },
  ambar: { id: 'ambar', cssVar: '--caneta-ambar', rotulo: 'âmbar' },
  âmbar: { id: 'ambar', cssVar: '--caneta-ambar', rotulo: 'âmbar' },
};

function textoObrigatorio(valor: unknown, campo: string, caminhoYaml: string): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new Error(`Campo "${campo}" inválido ou ausente em ${caminhoYaml}.`);
  }
  return valor.trim();
}

function normalizarCores(valor: unknown, caminhoYaml: string): CorDoLivro[] | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (typeof valor !== 'object' || Array.isArray(valor)) {
    throw new Error(`Campo "cores" deve ser um mapa (ex.: vermelho, verde, ambar) em ${caminhoYaml}.`);
  }

  const resultado: CorDoLivro[] = [];
  const vistas = new Set<string>();
  for (const [chave, desc] of Object.entries(valor as Record<string, unknown>)) {
    const info = MAPA_CORES[chave.trim().toLowerCase()];
    if (!info) {
      throw new Error(
        `Cor "${chave}" desconhecida em ${caminhoYaml}. Use: vermelho, verde ou ambar.`,
      );
    }
    if (vistas.has(info.id)) {
      throw new Error(`Cor "${info.rotulo}" duplicada em ${caminhoYaml}.`);
    }
    vistas.add(info.id);
    const significado = textoObrigatorio(desc, `cores.${chave}`, caminhoYaml);
    resultado.push({ ...info, significado });
  }
  return resultado.length > 0 ? resultado : undefined;
}

/** Lê e valida o arquivo `livro.yaml`. */
export function lerLivroYaml(caminhoYaml: string): LivroYaml {
  const bruto = fs.readFileSync(caminhoYaml, 'utf8');
  const dados = YAML.parse(bruto) as Record<string, unknown> | null;
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new Error(`Arquivo ${caminhoYaml} deve conter um objeto YAML.`);
  }

  const titulo = textoObrigatorio(dados.titulo, 'titulo', caminhoYaml);
  const resumo = textoObrigatorio(dados.resumo, 'resumo', caminhoYaml);

  if (!Array.isArray(dados.partes) || dados.partes.length === 0) {
    throw new Error(`Campo "partes" deve ser uma lista não vazia em ${caminhoYaml}.`);
  }

  const partes: ParteYaml[] = dados.partes.map((p, idx) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) {
      throw new Error(`Parte #${idx + 1} inválida em ${caminhoYaml}.`);
    }
    const parteObj = p as Record<string, unknown>;
    const tituloParte = textoObrigatorio(parteObj.titulo, `partes[${idx}].titulo`, caminhoYaml);
    if (!Array.isArray(parteObj.capitulos)) {
      throw new Error(`Campo "partes[${idx}].capitulos" deve ser uma lista em ${caminhoYaml}.`);
    }
    const capitulos = parteObj.capitulos.map((c, j) =>
      textoObrigatorio(c, `partes[${idx}].capitulos[${j}]`, caminhoYaml),
    );
    return { titulo: tituloParte, capitulos };
  });

  const cores = normalizarCores(dados.cores, caminhoYaml);
  return { titulo, resumo, partes, cores };
}

/** Lista todos os livros com `livro.yaml` nas raízes ativas. */
export function listarLivros(opcoes?: OpcoesRaizes): InfoLivro[] {
  const livros: InfoLivro[] = [];
  const vistos = new Set<string>();

  for (const raiz of raizesAtivas(opcoes)) {
    const dirLivros = path.join(raiz.caminho, 'livros');
    if (!fs.existsSync(dirLivros)) continue;

    const entradas = fs.readdirSync(dirLivros, { withFileTypes: true });
    for (const entrada of entradas) {
      if (!entrada.isDirectory()) continue;
      if (vistos.has(entrada.name)) continue;

      const caminhoYaml = path.join(dirLivros, entrada.name, 'livro.yaml');
      if (fs.existsSync(caminhoYaml)) {
        vistos.add(entrada.name);
        livros.push({ id: entrada.name, caminhoYaml, raiz });
      }
    }
  }

  return livros.sort((a, b) => a.id.localeCompare(b.id, 'pt-BR'));
}

/**
 * Cruza o `livro.yaml` com os capítulos da coleção `capitulos` e devolve
 * partes, capítulos numerados e ligações anterior/próximo.
 * Falha com o nome do arquivo se houver capítulo listado ausente ou capítulo órfão.
 */
export function carregarLivro<T extends EntradaCapituloMinima>(
  livroId: string,
  entradasCapitulos: readonly T[],
  opcoes?: OpcoesCarregarLivro,
): LivroCarregado<T> {
  const caminhoYaml =
    opcoes?.caminhoYaml ?? listarLivros(opcoes).find((l) => l.id === livroId)?.caminhoYaml;

  if (!caminhoYaml || !fs.existsSync(caminhoYaml)) {
    throw new Error(
      `Livro "${livroId}" não encontrado: esperado arquivo livros/${livroId}/livro.yaml.`,
    );
  }

  const yaml = lerLivroYaml(caminhoYaml);
  const prefixo = `${livroId}/`;
  const porSlug = new Map<string, T>();

  for (const entrada of entradasCapitulos) {
    if (!entrada.id.startsWith(prefixo)) continue;
    const slug = entrada.id.slice(prefixo.length);
    porSlug.set(slug, entrada);
  }

  const slugsListados = new Set<string>();
  const visiveisOrdenados: CapituloDoLivro<T>[] = [];
  const partesVisiveis: ParteDoLivro<T>[] = [];
  let numeroCapitulo = 0;

  yaml.partes.forEach((parteYaml, idxParte) => {
    const numeroParte = idxParte + 1;
    const capitulosDaParte: CapituloDoLivro<T>[] = [];

    for (const slug of parteYaml.capitulos) {
      if (slugsListados.has(slug)) {
        throw new Error(
          `Capítulo "${slug}" listado mais de uma vez em ${caminhoYaml}.`,
        );
      }
      slugsListados.add(slug);

      const entrada = porSlug.get(slug);
      if (!entrada) {
        throw new Error(
          `Capítulo "${slug}" listado em ${caminhoYaml} não existe (esperado em livros/${livroId}/${slug}/index.mdx).`,
        );
      }

      numeroCapitulo += 1;
      if (!paginaVisivel(entrada.data.etapa, opcoes)) {
        continue;
      }

      const cap: CapituloDoLivro<T> = {
        slug,
        id: entrada.id,
        numero: numeroCapitulo,
        titulo: entrada.data.titulo,
        resumo: entrada.data.resumo,
        etapa: entrada.data.etapa,
        parte: { numero: numeroParte, titulo: parteYaml.titulo },
        anterior: null,
        proximo: null,
        entrada,
      };
      capitulosDaParte.push(cap);
      visiveisOrdenados.push(cap);
    }

    if (capitulosDaParte.length > 0) {
      partesVisiveis.push({
        numero: numeroParte,
        titulo: parteYaml.titulo,
        capitulos: capitulosDaParte,
      });
    }
  });

  for (const [slug, entrada] of porSlug.entries()) {
    if (!slugsListados.has(slug)) {
      const arquivo = entrada.filePath ?? `livros/${livroId}/${slug}/index.mdx`;
      throw new Error(
        `Capítulo órfão encontrado em ${arquivo}: não está listado em ${caminhoYaml}.`,
      );
    }
  }

  for (let i = 0; i < visiveisOrdenados.length; i++) {
    const atual = visiveisOrdenados[i];
    const ant = i > 0 ? visiveisOrdenados[i - 1] : null;
    const prox = i < visiveisOrdenados.length - 1 ? visiveisOrdenados[i + 1] : null;

    atual.anterior = ant ? { slug: ant.slug, titulo: ant.titulo, numero: ant.numero } : null;
    atual.proximo = prox ? { slug: prox.slug, titulo: prox.titulo, numero: prox.numero } : null;
  }

  return {
    id: livroId,
    caminhoYaml,
    titulo: yaml.titulo,
    resumo: yaml.resumo,
    cores: yaml.cores,
    partes: partesVisiveis,
    capitulos: visiveisOrdenados,
  };
}
