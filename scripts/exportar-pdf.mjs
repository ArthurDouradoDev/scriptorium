import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import {
  listarRotasExportaveis,
  nomeArquivoSaida,
  rotaEhPrivada,
  transformarParaArquivoUnico,
} from './exportar-html.mjs';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const EXPORT_DIR = path.join(ROOT_DIR, 'dist-export');

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function normalizarRota(rota) {
  return rota.replace(/^\/+|\/+$/g, '');
}

export function nomeArquivoPdf(rota) {
  return nomeArquivoSaida(rota).replace(/\.html$/i, '.pdf');
}

export function prepararHtmlParaPdf(html) {
  return html.replace(/data-caneta-chave=/g, 'data-caneta-montada="1" data-caneta-chave=');
}

const HEADER_TEMPLATE =
  '<div style="width:100%;font-family:Georgia,serif;font-size:8.5pt;color:#5c658a;text-align:right;padding:0 18mm;"><span class="title"></span></div>';

const FOOTER_TEMPLATE =
  '<div style="width:100%;font-family:Georgia,serif;font-size:8.5pt;color:#5c658a;text-align:center;padding:0 18mm;"><span class="pageNumber"></span></div>';

export async function renderizarPdfNoNavegador(browser, html, caminhoSaida) {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    colorScheme: 'light',
  });

  try {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('tema', 'claro');
      } catch {
        /* ignore */
      }
      document.documentElement.dataset.theme = 'light';
    });

    await page.emulateMedia({ colorScheme: 'light', media: 'print' });
    await page.setContent(prepararHtmlParaPdf(html), { waitUntil: 'load' });

    await page.evaluate(async () => {
      document.documentElement.dataset.theme = 'light';
      document.querySelectorAll('[data-caneta-chave]').forEach((el) => {
        el.setAttribute('data-estado', 'impresso');
        el.dataset.canetaMontada = '1';
      });
      await document.fonts.ready;
    });

    await page.pdf({
      path: caminhoSaida,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: HEADER_TEMPLATE,
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: '22mm', right: '18mm', bottom: '22mm', left: '18mm' },
    });
  } finally {
    await page.close();
  }
}

export async function exportarPdfRota(rota, opcoes = {}) {
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
  const htmlUnico = await transformarParaArquivoUnico(htmlOriginal, limpa, distDir);

  fs.mkdirSync(exportDir, { recursive: true });
  const nomeSaida = nomeArquivoPdf(limpa);
  const caminhoSaida = path.join(exportDir, nomeSaida);

  const browser = opcoes.browser ?? (await chromium.launch());
  const fechouAqui = !opcoes.browser;
  try {
    await renderizarPdfNoNavegador(browser, htmlUnico, caminhoSaida);
  } finally {
    if (fechouAqui) {
      await browser.close();
    }
  }

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
    console.error('Uso: npm run exportar:pdf -- <rota> | --tudo');
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

  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  console.log(`Exportando ${rotas.length} PDF(s) para dist-export/:`);
  const browser = await chromium.launch();
  try {
    for (const rota of rotas) {
      const res = await exportarPdfRota(rota, { browser });
      const avisoPrivado = res.privada ? ' [AVISO: contém conteúdo privado]' : '';
      console.log(`  - ${res.arquivo} (${formatarTamanho(res.tamanho)})${avisoPrivado}`);
    }
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((erro) => {
    console.error(erro instanceof Error ? erro.message : String(erro));
    process.exit(1);
  });
}
