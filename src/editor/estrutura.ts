/* Raízes e livros que o editor local mostra. O astro.config.mjs lê o disco ao
   iniciar o `npm run dev` e injeta a lista em __CONTEUDO_EDITOR__; o editor roda
   também no navegador, onde não há acesso ao disco. Livro novo: reinicie o dev. */

export interface LivroNoEditor {
  id: string;
  titulo: string;
}

export interface RaizNoEditor {
  raiz: string;
  livros: LivroNoEditor[];
}

declare const __CONTEUDO_EDITOR__: RaizNoEditor[] | undefined;

export const ROTULOS_RAIZ: Record<string, string> = {
  exemplo: 'Exemplo',
  publico: 'Público',
  privado: 'Privado',
};

export function conteudoDoEditor(): RaizNoEditor[] {
  return typeof __CONTEUDO_EDITOR__ !== 'undefined' ? __CONTEUDO_EDITOR__ : [];
}

export const chaveDoLivro = (raiz: string, livro: string) => `${raiz}-${livro}`;
export const chaveDoSumario = (raiz: string, livro: string) => `${raiz}-${livro}-sumario`;
export const chaveDoBlog = (raiz: string) => `${raiz}-blog`;

/** Pasta (a partir da raiz do repositório) das páginas de cada coleção. */
export function pastasDasColecoes(): Record<string, string> {
  const pastas: Record<string, string> = {};
  for (const { raiz, livros } of conteudoDoEditor()) {
    for (const livro of livros) pastas[chaveDoLivro(raiz, livro.id)] = `/conteudo/${raiz}/livros/${livro.id}`;
    pastas[chaveDoBlog(raiz)] = `/conteudo/${raiz}/blog`;
  }
  return pastas;
}

/** Pasta da página aberta no editor, lida do endereço `/keystatic/collection/<coleção>/item/<pasta>`. */
export function pastaDaPaginaAberta(): string | null {
  if (typeof location === 'undefined') return null;
  const achado = location.pathname.match(/\/collection\/([^/]+)\/item\/([^/]+)/);
  if (!achado) return null;
  const pasta = pastasDasColecoes()[decodeURIComponent(achado[1])];
  return pasta ? `${pasta}/${decodeURIComponent(achado[2])}` : null;
}
