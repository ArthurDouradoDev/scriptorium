/* Tipos do kit caneta para o código TypeScript e .astro do motor.
   O caneta.js fica em JavaScript porque a prévia das skills o carrega sem build;
   com este arquivo ao lado, o TypeScript usa estes tipos e não confere o .js.
   Mudou a API em caneta.js, atualize aqui e em referencia-api.md da skill ilustracao-caneta. */

export type Cor = 'vermelha' | 'verde' | 'ambar' | 'apagada';

export interface Opcoes {
  atraso?: number;
  peso?: 'fino' | 'forte';
  cor?: Cor;
  tracejado?: boolean;
  simples?: boolean;
  tremor?: number;
  [outra: string]: unknown;
}

export interface Escala {
  x(v: number): number;
  y(v: number): number;
  ponto(vx: number, vy: number): [number, number];
  amostrar(fn: (x: number) => number, n?: number): [number, number][];
}

export interface Caneta {
  readonly largura: number;
  readonly altura: number;
  linha(x1: number, y1: number, x2: number, y2: number, o?: Opcoes): Caneta;
  caixa(x: number, y: number, w: number, h: number, o?: Opcoes & { preencher?: boolean }): Caneta;
  elipse(cx: number, cy: number, rx: number, ry: number, o?: Opcoes & { preencher?: boolean }): Caneta;
  circulo(cx: number, cy: number, r: number, o?: Opcoes & { preencher?: boolean }): Caneta;
  curva(pontos: [number, number][], o?: Opcoes & { reta?: boolean }): Caneta;
  hachura(x: number, y: number, w: number, h: number, o?: Opcoes & { espaco?: number; cruzada?: boolean }): Caneta;
  seta(x1: number, y1: number, x2: number, y2: number, o?: Opcoes & { curva?: number; dupla?: boolean; ponta?: number }): Caneta;
  texto(
    x: number,
    y: number,
    conteudo: string | string[],
    o?: Opcoes & { ancora?: 'start' | 'middle' | 'end'; forte?: boolean; tamanho?: 'pequeno' | 'grande'; girar?: number },
  ): Caneta;
  anotacao(x: number, y: number, conteudo: string | string[], alvo: [number, number], o?: Opcoes & { curva?: number }): Caneta;
  eixos(o: {
    x: number;
    y: number;
    largura: number;
    altura: number;
    dominioX: [number, number];
    dominioY: [number, number];
    marcasX?: (number | { v: number; texto: string })[];
    marcasY?: (number | { v: number; texto: string })[];
    rotuloX?: string;
    rotuloY?: string;
    atraso?: number;
    casas?: number;
  }): Escala;
  caminho(d: string, o?: Opcoes & { surgir?: boolean }): Caneta;
  viajar(d: string, o?: Opcoes & { forma?: 'ponto'; duracao?: number; inicio?: number | string }): Caneta;
  ondas(
    cx: number,
    cy: number,
    o?: Opcoes & { n?: number; raioMin?: number; raioMax?: number; periodo?: number; recorte?: [number, number, number, number]; intensidade?: () => number },
  ): Caneta;
  aCadaQuadro(fn: (t: number) => void): Caneta;
  depois(dt?: number): number;
  agora(): number;
  semente(n: number): Caneta;
  camada(): Caneta;
  limpar(): Caneta;
}

export interface Matematica {
  db(x: number): number;
  lin(x: number): number;
  limitar(x: number, a?: number, b?: number): number;
  mapear(x: number, a: number, b: number, c: number, d: number): number;
  fmt(v: number, casas?: number): string;
  pct(x: number, casas?: number): string;
}

export interface OrigemFigura {
  autoria: 'ia' | 'humano' | 'misto' | string;
  pedido?: string;
  validacao?: string;
}

/** Objeto exportado por um arquivo de figura. A forma completa está na skill ilustracao-caneta. */
export interface Figura {
  tipo: 'ilustracao' | 'simulacao';
  largura: number;
  altura: number;
  alt: string;
  semente?: number;
  origem?: OrigemFigura;
  [campo: string]: unknown;
}

export interface FiguraMontada {
  atualizar(): void;
  definir(novos: Record<string, number | string>): void;
  valores(): Record<string, number | string>;
  resultado(): Record<string, unknown>;
  destruir(): void;
}

export const LARGURA_LETRA: number;
export const m: Readonly<Matematica>;
export function criarCaneta(
  svg: SVGSVGElement,
  opcoes?: { semente?: number; animar?: boolean; movimento?: boolean; largura?: number; altura?: number; doc?: Document },
): Caneta;
export function valoresIniciais(figura: Figura): Record<string, number | string>;
export function lerLeitura(r: Record<string, unknown> | undefined, id: string): { valor?: number; nota?: string };
export function montar(alvo: HTMLElement, figura: Figura, opcoes?: { estado?: 'impresso' }): FiguraMontada;
