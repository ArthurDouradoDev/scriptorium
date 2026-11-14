import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import YAML from 'yaml';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const EXPORT_DIR = path.join(ROOT_DIR, 'dist-export');
const CONTEUDO_DIR = path.join(ROOT_DIR, 'conteudo');

const MIME_POR_EXT = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizarRota(rota) {
  return rota.replace(/^\/+|\/+$/g, '');
}

export function nomeArquivoSaida(rota) {
  const limpa = normalizarRota(rota);
  if (!limpa) return 'index.html';
  const partes = limpa.split('/');
  if (partes[0] === 'livros' && partes.length === 3) {
    return `${partes[1]}-${partes[2]}.html`;
  }
  if (partes[0] === 'blog' && partes.length === 2) {
    return `blog-${partes[1]}.html`;
  }
  return `${partes.join('-')}.html`;
}

function lerEtapaFrontmatter(caminhoMdx) {
  if (!fs.existsSync(caminhoMdx)) return null;
  const texto = fs.readFileSync(caminhoMdx, 'utf8');
  const match = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    const dados = YAML.parse(match[1]);
    return typeof dados?.etapa === 'string' ? dados.etapa : null;
  } catch {
    return null;
  }
}

function localizarArquivoPagina(rotaLimpa) {
  for (const raiz of ['privado', 'publico', 'exemplo']) {
    const candidato = path.join(CONTEUDO_DIR, raiz, rotaLimpa, 'index.mdx');
    if (fs.existsSync(candidato)) {
      return { raiz, caminho: candidato };
    }
  }
  return null;
}

export function rotaEhPrivada(rota) {
  const limpa = normalizarRota(rota);
  const partes = limpa.split('/');

  if (partes[0] === 'livros' && partes[2] === 'completo') {
    const livroId = partes[1];
    if (fs.existsSync(path.join(CONTEUDO_DIR, 'privado', 'livros', livroId))) {
      return true;
    }
    for (const raiz of ['publico', 'exemplo']) {
      const dirLivro = path.join(CONTEUDO_DIR, raiz, 'livros', livroId);
      if (!fs.existsSync(dirLivro)) continue;
      for (const entrada of fs.readdirSync(dirLivro, { withFileTypes: true })) {
        if (!entrada.isDirectory()) continue;
        const etapa = lerEtapaFrontmatter(path.join(dirLivro, entrada.name, 'index.mdx'));
        if (etapa === 'anotacao') return true;
      }
    }
    return false;
  }

  const encontrada = localizarArquivoPagina(limpa);
  if (!encontrada) return false;
  if (encontrada.raiz === 'privado') return true;
  return lerEtapaFrontmatter(encontrada.caminho) === 'anotacao';
}

function filtrarFontesCss(css) {
  return css.replace(/@font-face\s*\{[^}]*\}/g, (bloco) => {
    if (/(?:cyrillic|vietnamese)/i.test(bloco)) {
      return '';
    }
    return bloco.replace(
      /(url\([^)]+\.woff2[^)]*\)\s*format\(["']woff2["']\))\s*,\s*url\([^)]+\.woff[^)]*\)\s*format\(["']woff["']\)/gi,
      '$1',
    );
  });
}

function resolverNoDist(caminhoUrl, distDir) {
  const limpo = caminhoUrl.split(/[?#]/)[0].replace(/^\/+/, '');
  return path.join(distDir, limpo);
}

function embutirUrlsNoCss(css, distDir) {
  const cssFiltrado = filtrarFontesCss(css);
  return cssFiltrado.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, (match, _aspas, url) => {
    if (url.startsWith('data:') || url.startsWith('#') || /^https?:\/\//i.test(url)) {
      return match;
    }
    const arquivo = resolverNoDist(url, distDir);
    if (!fs.existsSync(arquivo)) {
      throw new Error(`Recurso referenciado no CSS não encontrado em dist/: ${url}`);
    }
    const ext = path.extname(arquivo).toLowerCase();
    const mime = MIME_POR_EXT[ext] ?? 'application/octet-stream';
    const b64 = fs.readFileSync(arquivo).toString('base64');
    return `url("data:${mime};base64,${b64}")`;
  });
}

async function embutirImagem(caminhoUrl, distDir) {
  const arquivo = resolverNoDist(caminhoUrl, distDir);
  if (!fs.existsSync(arquivo)) {
    throw new Error(`Imagem não encontrada em dist/: ${caminhoUrl}`);
  }
  const ext = path.extname(arquivo).toLowerCase();
  if (ext === '.svg') {
    const b64 = fs.readFileSync(arquivo).toString('base64');
    return `data:image/svg+xml;base64,${b64}`;
  }
  const buffer = await sharp(arquivo)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

function extrairChavesFiguras(html) {
  const chaves = new Set();
  const regex = /data-caneta-chave=(["'])([^"']+)\1/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    chaves.add(match[2]);
  }
  return [...chaves];
}

function gerarScriptCanetaInline(chavesFiguras) {
  const canetaPath = path.join(ROOT_DIR, 'src', 'caneta', 'caneta.js');
  const canetaCodigo = fs
    .readFileSync(canetaPath, 'utf8')
    .replace(/\bexport\s+(?=(?:async\s+)?function\b|const\b|let\b|var\b|class\b)/g, '');

  const entradasFiguras = chavesFiguras.map((chave) => {
    const caminhoFig = path.join(ROOT_DIR, chave.replace(/^\/+/, ''));
    if (!fs.existsSync(caminhoFig)) {
      throw new Error(`Figura "${chave}" não encontrada no disco (${caminhoFig}).`);
    }
    const codigoFig = fs.readFileSync(caminhoFig, 'utf8').replace(/^\s*export\s+default\b/m, 'return');
    return `${JSON.stringify(chave)}: (() => {\n${codigoFig}\n})()`;
  });

  return `<script type="module">
(() => {
  const __caneta = (() => {
${canetaCodigo}
    return { montar };
  })();
  const __figuras = {
${entradasFiguras.join(',\n')}
  };
  function ativarFigura(el) {
    const chave = el.dataset.canetaChave;
    if (!chave || el.dataset.canetaMontada === '1') return;
    const fig = __figuras[chave];
    if (!fig) return;
    el.dataset.canetaMontada = '1';
    el.removeAttribute('data-estado');
    __caneta.montar(el, fig);
  }
  const alvos = document.querySelectorAll('[data-caneta-chave]');
  if (alvos.length > 0) {
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entradas) => {
          for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue;
            const alvo = entrada.target;
            obs.unobserve(alvo);
            ativarFigura(alvo);
          }
        },
        { rootMargin: '120px 0px', threshold: 0.01 },
      );
      alvos.forEach((alvo) => obs.observe(alvo));
    } else {
      alvos.forEach((alvo) => ativarFigura(alvo));
    }
  }
})();
</script>`;
}

function extrairAtributo(tag, nome) {
  const regex = new RegExp(`\\b${nome}=(["'])([^"']*)\\1`, 'i');
  const match = tag.match(regex);
  return match ? match[2] : null;
}

function reescreverLinksLivro(html, livroId, distDir) {
  let resultado = html;
  const sumarioRe = new RegExp(`href=(["'])/livros/${livroId}/?\\1`, 'g');
  resultado = resultado.replace(sumarioRe, 'href="#sumario"');

  const capRe = new RegExp(`href=(["'])/livros/${livroId}/([^/"'#]+)(?:/(?:#[^"']*)?|#[^"']*)?\\1`, 'g');
  resultado = resultado.replace(capRe, (_m, _q, slug) => {
    if (slug === 'completo') return 'href="#sumario"';
    return `href="#cap-${slug}"`;
  });

  resultado = resultado.replace(/href=(["'])(\/flashcards\/[^"']+\.txt)\1/g, (match, _q, href) => {
    const arquivo = resolverNoDist(href, distDir);
    if (!fs.existsSync(arquivo)) return match;
    const conteudo = fs.readFileSync(arquivo, 'utf8');
    return `href="data:text/plain;charset=utf-8,${encodeURIComponent(conteudo)}"`;
  });

  return resultado;
}

function reescreverFlashcardsPagina(html, distDir) {
  return html.replace(/href=(["'])(\/flashcards\/[^"']+\.txt)\1/g, (match, _q, href) => {
    const arquivo = resolverNoDist(href, distDir);
    if (!fs.existsSync(arquivo)) return match;
    const conteudo = fs.readFileSync(arquivo, 'utf8');
    return `href="data:text/plain;charset=utf-8,${encodeURIComponent(conteudo)}"`;
  });
}

export async function transformarParaArquivoUnico(htmlOriginal, rota, distDir = DIST_DIR) {
  let html = htmlOriginal;
  const chavesFiguras = extrairChavesFiguras(html);

  /* 1. Embute folhas de estilo externas e resolve url() com base64. */
  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    const rel = extrairAtributo(tag, 'rel');
    if (rel !== 'stylesheet') return tag;
    const href = extrairAtributo(tag, 'href');
    if (!href || /^https?:\/\//i.test(href) || href.startsWith('data:')) return tag;
    const caminhoCss = resolverNoDist(href, distDir);
    if (!fs.existsSync(caminhoCss)) {
      throw new Error(`Folha de estilo não encontrada em dist/: ${href}`);
    }
    const css = embutirUrlsNoCss(fs.readFileSync(caminhoCss, 'utf8'), distDir);
    return `<style>${css}</style>`;
  });

  /* Resolve url() dentro de <style> já embutidos. */
  html = html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_m, attrs, css) => {
    return `<style${attrs}>${embutirUrlsNoCss(css, distDir)}</style>`;
  });

  /* 2. Embute imagens redimensionadas (<= 1600 px) e comprimidas em base64. */
  const tagsImg = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of new Set(tagsImg)) {
    const src = extrairAtributo(tag, 'src');
    if (!src || src.startsWith('data:') || /^https?:\/\//i.test(src)) continue;
    const dataUri = await embutirImagem(src, distDir);
    let novaTag = tag.replace(/\bsrc=(["'])[^"']*\1/i, `src="${dataUri}"`);
    novaTag = novaTag.replace(/\s+\bsrcset=(["'])[^"']*\1/i, '');
    html = html.split(tag).join(novaTag);
  }

  /* 3. Embute scripts externos (incluindo o kit caneta e apenas as figuras usadas na página). */
  let canetaJaEmbutida = false;
  html = html.replace(/<script\b([^>]*)src=(["'])([^"']+)\2([^>]*)>\s*<\/script>/gi, (match, antes, _q, src, depois) => {
    if (src.startsWith('data:') || /^https?:\/\//i.test(src)) return match;
    const caminhoJs = resolverNoDist(src, distDir);
    if (!fs.existsSync(caminhoJs)) {
      throw new Error(`Script não encontrado em dist/: ${src}`);
    }
    const conteudoJs = fs.readFileSync(caminhoJs, 'utf8');
    if (conteudoJs.includes('data-caneta-chave') || /Figura\.astro/.test(src)) {
      if (canetaJaEmbutida) return '';
      canetaJaEmbutida = true;
      return chavesFiguras.length > 0 ? gerarScriptCanetaInline(chavesFiguras) : '';
    }
    const ehModulo = /\btype=(["'])module\1/i.test(`${antes} ${depois}`);
    return `<script${ehModulo ? ' type="module"' : ''}>${conteudoJs}</script>`;
  });

  /* 4. Reescreve links internos entre capítulos e links de download de flashcards. */
  const limpa = normalizarRota(rota);
  const partes = limpa.split('/');
  if (partes[0] === 'livros' && partes[2] === 'completo') {
    html = reescreverLinksLivro(html, partes[1], distDir);
  } else {
    html = reescreverFlashcardsPagina(html, distDir);
  }

  return html;
}

export function listarRotasExportaveis(distDir = DIST_DIR) {
  const rotas = [];

  const dirLivros = path.join(distDir, 'livros');
  if (fs.existsSync(dirLivros)) {
    for (const livro of fs.readdirSync(dirLivros, { withFileTypes: true })) {
      if (!livro.isDirectory()) continue;
      const dirLivro = path.join(dirLivros, livro.name);
      for (const item of fs.readdirSync(dirLivro, { withFileTypes: true })) {
        if (!item.isDirectory()) continue;
        if (fs.existsSync(path.join(dirLivro, item.name, 'index.html'))) {
          rotas.push(`livros/${livro.name}/${item.name}`);
        }
      }
    }
  }

  const dirBlog = path.join(distDir, 'blog');
  if (fs.existsSync(dirBlog)) {
    for (const post of fs.readdirSync(dirBlog, { withFileTypes: true })) {
      if (!post.isDirectory()) continue;
      if (fs.existsSync(path.join(dirBlog, post.name, 'index.html'))) {
        rotas.push(`blog/${post.name}`);
      }
    }
  }

  return rotas.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export async function exportarRota(rota, opcoes = {}) {
  const distDir = opcoes.distDir ?? DIST_DIR;
  const exportDir = opcoes.exportDir ?? EXPORT_DIR;
  const env = opcoes.env ?? process.env;
  const limpa = normalizarRota(rota);

  const privada = rotaEhPrivada(limpa);
  if (privada && env.CONTEUDO_PRIVADO !== '1') {
    throw new Error(
      `A rota "/${limpa}" contém conteúdo privado. Defina CONTEUDO_PRIVADO=1 para exportar.`,
    );
  }

  const arquivoHtml = path.join(distDir, limpa, 'index.html');
  if (!fs.existsSync(arquivoHtml)) {
    throw new Error(`Página não encontrada em dist/: ${arquivoHtml}. Execute "npm run build" antes.`);
  }

  const htmlOriginal = fs.readFileSync(arquivoHtml, 'utf8');
  const htmlExportado = await transformarParaArquivoUnico(htmlOriginal, limpa, distDir);

  fs.mkdirSync(exportDir, { recursive: true });
  const nomeSaida = nomeArquivoSaida(limpa);
  const caminhoSaida = path.join(exportDir, nomeSaida);
  fs.writeFileSync(caminhoSaida, htmlExportado, 'utf8');

  const tamanho = fs.statSync(caminhoSaida).size;
  return {
    rota: `/${limpa}`,
    arquivo: nomeSaida,
    caminhoSaida,
    tamanho,
    privada,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const tudo = args.includes('--tudo');
  const rotasArgs = args.filter((a) => !a.startsWith('-'));

  if (!tudo && rotasArgs.length === 0) {
    console.error('Uso: npm run exportar:html -- <rota> | --tudo');
    process.exit(1);
  }

  if (!fs.existsSync(DIST_DIR)) {
    console.error('Diretório dist/ não encontrado. Execute "npm run build" antes de exportar.');
    process.exit(1);
  }

  const rotas = tudo ? listarRotasExportaveis(DIST_DIR) : rotasArgs;
  if (rotas.length === 0) {
    console.log('Nenhuma página encontrada em dist/ para exportar.');
    return;
  }

  fs.rmSync(EXPORT_DIR, { recursive: true, force: true });
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  console.log(`Exportando ${rotas.length} página(s) para dist-export/:`);
  for (const rota of rotas) {
    const res = await exportarRota(rota);
    const avisoPrivado = res.privada ? ' [AVISO: contém conteúdo privado]' : '';
    console.log(`  - ${res.arquivo} (${formatarTamanho(res.tamanho)})${avisoPrivado}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((erro) => {
    console.error(erro instanceof Error ? erro.message : String(erro));
    process.exit(1);
  });
}
