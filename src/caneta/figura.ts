import { montar, type Figura } from './caneta.js';
import { raizesAtivas, type Raiz } from '../conteudo/raizes';

const CHAVE_CONTADOR = Symbol.for('scriptorium.contadorFigura');
const CHAVE_CAPITULO = Symbol.for('scriptorium.numeroCapitulo');

/** Extrai o caminho relativo da página (ex.: `livros/guia-de-rf/introducao`) a partir da URL. */
export function caminhoDaPaginaPorUrl(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, '');
}

/** Define o número do capítulo atual no contexto de renderização da página e reinicia a contagem de figuras. */
export function definirNumeroCapitulo(contexto: Record<string | symbol, unknown>, numero: number): void {
  contexto[CHAVE_CAPITULO] = numero;
  contexto[CHAVE_CONTADOR] = 0;
}

/** Retorna o número sequencial da próxima figura na página atual (1, 2, 3...). */
export function proximoNumeroFigura(contexto: Record<string | symbol, unknown>): number {
  const atual = typeof contexto[CHAVE_CONTADOR] === 'number' ? (contexto[CHAVE_CONTADOR] as number) : 0;
  const proximo = atual + 1;
  contexto[CHAVE_CONTADOR] = proximo;
  return proximo;
}

/** Retorna o rótulo da próxima figura: `C.N` dentro de um capítulo ou `N` em páginas avulsas. */
export function rotuloFigura(contexto: Record<string | symbol, unknown>): string {
  const numero = proximoNumeroFigura(contexto);
  const capitulo = contexto[CHAVE_CAPITULO];
  return typeof capitulo === 'number' ? `${capitulo}.${numero}` : String(numero);
}

export interface OpcoesResolverArquivo<T> {
  tipo: 'figuras' | 'imagens';
  arquivo: string;
  pagina: string;
  mapa: Record<string, T>;
  raizes?: Raiz[];
}

/** Resolve um arquivo (`figuras/<nome>.js` ou `imagens/<arquivo>`) na pasta da página. */
export function resolverArquivoPagina<T>(opcoes: OpcoesResolverArquivo<T>): { chave: string; valor: T } {
  const { tipo, arquivo, pagina, mapa } = opcoes;
  const raizes = opcoes.raizes ?? raizesAtivas();
  const paginaLimpa = pagina.replace(/^\/+|\/+$/g, '');

  for (const raiz of raizes) {
    const chave = `/conteudo/${raiz.nome}/${paginaLimpa}/${tipo}/${arquivo}`;
    if (Object.prototype.hasOwnProperty.call(mapa, chave)) {
      return { chave, valor: mapa[chave] };
    }
  }

  const raizPadrao = raizes[0]?.nome ?? 'exemplo';
  const caminhoEsperado = `conteudo/${raizPadrao}/${paginaLimpa}/${tipo}/${arquivo}`;
  const rotulo = tipo === 'figuras' ? 'Figura' : 'Imagem';
  throw new Error(`${rotulo} "${arquivo}" não encontrada: esperado em ${caminhoEsperado}`);
}

/* ---------- DOM mínimo para pré-renderizar o estado impresso no servidor ---------- */

const TAGS_VAZIAS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escaparAttr(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

class NoVirtual {
  tag: string;
  attrs: Record<string, string> = {};
  filhos: (NoVirtual | string)[] = [];
  estilo: Record<string, string> = {};
  ownerDocument: DocVirtual;
  classList: {
    add: (...nomes: string[]) => void;
    remove: (...nomes: string[]) => void;
    toggle: (nome: string, forca?: boolean) => void;
  };
  style: Record<string, string> & { setProperty: (k: string, v: string) => void };

  constructor(tag: string, doc: DocVirtual) {
    this.tag = tag;
    this.ownerDocument = doc;
    const self = this;

    const classes = () => (self.attrs.class ? self.attrs.class.split(/\s+/).filter(Boolean) : []);
    const salvarClasses = (lista: string[]) => {
      if (lista.length > 0) self.attrs.class = lista.join(' ');
      else delete self.attrs.class;
    };

    this.classList = {
      add(...nomes: string[]) {
        const set = new Set(classes());
        for (const n of nomes) if (n) set.add(n);
        salvarClasses([...set]);
      },
      remove(...nomes: string[]) {
        const remover = new Set(nomes);
        salvarClasses(classes().filter((c) => !remover.has(c)));
      },
      toggle(nome: string, forca?: boolean) {
        const set = new Set(classes());
        const incluir = forca !== undefined ? forca : !set.has(nome);
        if (incluir) set.add(nome);
        else set.delete(nome);
        salvarClasses([...set]);
      },
    };

    this.style = new Proxy(
      {
        setProperty(k: string, v: string) {
          self.estilo[k] = String(v);
        },
      } as Record<string, string> & { setProperty: (k: string, v: string) => void },
      {
        set(_, k: string, v: string) {
          self.estilo[k] = String(v);
          return true;
        },
        get(target, k: string) {
          if (k in target) return target[k as keyof typeof target];
          return self.estilo[k];
        },
      },
    );
  }

  setAttribute(k: string, v: string): void {
    this.attrs[k] = String(v);
  }

  getAttribute(k: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null;
  }

  addEventListener(): void {}

  appendChild<T extends NoVirtual | string>(filho: T): T {
    this.filhos.push(filho);
    return filho;
  }

  set textContent(v: string) {
    this.filhos = v === '' ? [] : [String(v)];
  }

  get textContent(): string {
    return this.filhos.map((f) => (typeof f === 'string' ? f : f.textContent)).join('');
  }

  serializar(): string {
    const attrs = { ...this.attrs };
    const paresEstilo = Object.entries(this.estilo);
    if (paresEstilo.length > 0) {
      const css = paresEstilo.map(([k, v]) => `${k}:${v}`).join(';');
      attrs.style = attrs.style ? `${attrs.style};${css}` : css;
    }

    const attrsStr = Object.entries(attrs)
      .map(([k, v]) => ` ${k}="${escaparAttr(v)}"`)
      .join('');

    if (TAGS_VAZIAS.has(this.tag) && this.filhos.length === 0) {
      return `<${this.tag}${attrsStr} />`;
    }

    const conteudo = this.filhos.map((f) => (typeof f === 'string' ? escaparHtml(f) : f.serializar())).join('');
    return `<${this.tag}${attrsStr}>${conteudo}</${this.tag}>`;
  }
}

class DocVirtual {
  body: NoVirtual;
  defaultView = {
    matchMedia: () => ({ matches: false }),
    setInterval: () => 0,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
  };

  constructor() {
    this.body = new NoVirtual('body', this);
  }

  getElementById(): null {
    return null;
  }

  createElement(tag: string): NoVirtual {
    return new NoVirtual(tag, this);
  }

  createElementNS(_ns: string, tag: string): NoVirtual {
    return new NoVirtual(tag, this);
  }

  createTextNode(texto: string): string {
    return String(texto);
  }
}

export interface ResultadoRenderImpresso {
  classes: string;
  htmlInterno: string;
}

/** Gera o HTML estático do estado impresso de uma figura (usado no build sem depender de JS). */
export function renderizarFiguraImpressa(figura: Figura): ResultadoRenderImpresso {
  const doc = new DocVirtual();
  const alvo = doc.createElement('div');
  montar(alvo as unknown as HTMLElement, figura, { estado: 'impresso' });

  const classes = alvo.attrs.class ?? 'caneta';
  const htmlInterno = alvo.filhos.map((f) => (typeof f === 'string' ? escaparHtml(f) : f.serializar())).join('');
  return { classes, htmlInterno };
}
