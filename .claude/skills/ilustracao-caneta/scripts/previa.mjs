#!/usr/bin/env node
/* Prévia de figuras do kit caneta: tema claro, tema escuro, impresso e celular, na mesma tela.

   uso: node .claude/skills/ilustracao-caneta/scripts/previa.mjs [--porta 4400]

   Abra http://localhost:4400/ para a lista de figuras, ou
   http://localhost:4400/previa?f=<caminho/da/figura.js> para uma delas.
   A página recarrega sozinha quando o arquivo da figura ou o kit muda.
   Sem dependências: serve só esta máquina (127.0.0.1) e só arquivos do projeto. */

import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, extname, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
function acharRaiz() {
  let d = AQUI;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(d, 'src', 'caneta', 'caneta.js'))) return d;
    d = dirname(d);
  }
  throw new Error('não achei src/caneta/caneta.js acima de ' + AQUI);
}
const RAIZ = acharRaiz();
const iPorta = process.argv.indexOf('--porta');
const PORTA = iPorta > 0 ? +process.argv[iPorta + 1] : +(process.env.PORT || 4400);
const TIPOS = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

function figuras() {
  const achados = [];
  const andar = (dir) => {
    for (const nome of readdirSync(dir)) {
      if (['node_modules', '.git', 'dist', '.dev'].includes(nome)) continue;
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) andar(p);
      else if (nome.endsWith('.js') && ['figuras', 'exemplos'].includes(basename(dir))) achados.push(relative(RAIZ, p).split(sep).join('/'));
    }
  };
  andar(RAIZ);
  return achados.sort();
}

/* caminho pedido → arquivo dentro do projeto, ou null */
function dentro(rel) {
  const p = resolve(RAIZ, '.' + sep + decodeURIComponent(rel).replace(/^[/\\]+/, ''));
  return p === RAIZ || p.startsWith(RAIZ + sep) ? p : null;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const CABECA = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Newsreader:opsz,wght@6..72,400;6..72,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/src/estilos/tokens.css"><link rel="stylesheet" href="/src/caneta/caneta.css">
<style>
body{margin:0;font-family:var(--serif);font-size:17px;background:#8a8f98;color:#111}
header{background:#111;color:#fff;padding:10px 16px;font:14px/1.4 system-ui,sans-serif;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
header a{color:#fff} header button{font:inherit;padding:3px 10px;cursor:pointer}
.painel{background:var(--bg);color:var(--ink);margin:16px auto;padding:20px 16px 26px;max-width:932px;box-sizing:border-box}
.painel.celular{max-width:392px}
.painel>h2{font:600 12px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin:0 0 14px;color:var(--muted)}
.painel figure{margin:0}
#dados{max-width:900px;margin:16px auto;background:#fff;padding:14px 16px;font:14px/1.5 system-ui,sans-serif}
#dados dt{font-weight:600;margin-top:6px} #dados dd{margin:0}
#falha{white-space:pre-wrap;background:#fff;color:#a00;font:14px/1.5 ui-monospace,monospace;padding:14px 16px;max-width:900px;margin:16px auto}
ul{background:#fff;max-width:900px;margin:16px auto;padding:16px 16px 16px 36px;font:15px/1.9 system-ui,sans-serif}
</style>`;

function paginaLista() {
  const itens = figuras().map((f) => `<li><a href="/previa?f=${encodeURIComponent(f)}">${esc(f)}</a></li>`).join('');
  return `${CABECA}<title>Figuras</title></head><body><header><b>Prévia de figuras</b></header>
<ul>${itens || '<li>Nenhuma figura encontrada em pastas <code>figuras/</code> ou <code>exemplos/</code>.</li>'}</ul></body></html>`;
}

function paginaPrevia(f) {
  return `${CABECA}<title>${esc(basename(f))} · prévia</title></head><body>
<header><a href="/">← figuras</a><b>${esc(f)}</b><button id="de-novo" type="button">desenhar de novo</button></header>
<pre id="falha" hidden></pre>
<section class="painel" data-theme="light"><h2>tema claro</h2><figure data-alvo></figure></section>
<section class="painel" data-theme="dark"><h2>tema escuro</h2><figure data-alvo></figure></section>
<section class="painel" data-theme="light"><h2>impresso (PDF e sem JavaScript)</h2><figure data-alvo data-impresso></figure></section>
<section class="painel celular" data-theme="light"><h2>celular (360 px)</h2><figure data-alvo></figure></section>
<dl id="dados"></dl>
<script type="module">
const arquivo = ${JSON.stringify('/' + f)};
const falha = document.getElementById('falha');
const mostrarFalha = (e) => { falha.hidden = false; falha.textContent += (e && e.stack || e) + '\\n'; };
addEventListener('error', (e) => mostrarFalha(e.error || e.message));
addEventListener('unhandledrejection', (e) => mostrarFalha(e.reason));
try {
  const { montar } = await import('/src/caneta/caneta.js?t=' + Date.now());
  const figura = (await import(arquivo + '?t=' + Date.now())).default;
  const montarTudo = () => document.querySelectorAll('[data-alvo]').forEach((alvo) => {
    alvo.className = '';
    montar(alvo, figura, alvo.hasAttribute('data-impresso') ? { estado: 'impresso' } : {});
  });
  montarTudo();
  document.getElementById('de-novo').addEventListener('click', montarTudo);
  const o = figura.origem || {};
  const linhas = [['tipo', figura.tipo], ['área', figura.largura + ' × ' + figura.altura], ['alt', figura.alt],
    ['autoria', o.autoria], ['pedido', o.pedido], ['validação', o.validacao]];
  const dl = document.getElementById('dados');
  for (const [k, v] of linhas) {
    dl.appendChild(Object.assign(document.createElement('dt'), { textContent: k }));
    dl.appendChild(Object.assign(document.createElement('dd'), { textContent: v ?? '(faltando)' }));
  }
} catch (e) { mostrarFalha(e); }
/* recarrega quando a figura ou o kit muda */
let marca = null;
setInterval(async () => {
  try {
    const m = await (await fetch('/mudou?f=' + encodeURIComponent(arquivo.slice(1)))).text();
    if (marca && m !== marca) location.reload();
    marca = m;
  } catch {}
}, 1000);
</script></body></html>`;
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const enviar = (codigo, tipo, corpo) => {
    res.writeHead(codigo, { 'content-type': tipo + (tipo.startsWith('text/') ? '; charset=utf-8' : ''), 'cache-control': 'no-store' });
    res.end(corpo);
  };
  try {
    if (url.pathname === '/') return enviar(200, 'text/html', paginaLista());
    if (url.pathname === '/previa' || url.pathname === '/mudou') {
      const f = url.searchParams.get('f') || '';
      const p = dentro(f);
      if (!p || !existsSync(p) || extname(p) !== '.js') return enviar(404, 'text/plain', 'figura não encontrada: ' + f);
      if (url.pathname === '/previa') return enviar(200, 'text/html', paginaPrevia(relative(RAIZ, p).split(sep).join('/')));
      const marcas = [p, join(RAIZ, 'src/caneta/caneta.js'), join(RAIZ, 'src/caneta/caneta.css'), join(RAIZ, 'src/estilos/tokens.css')];
      return enviar(200, 'text/plain', marcas.map((x) => statSync(x).mtimeMs).join('-'));
    }
    const p = dentro(url.pathname);
    const tipo = p && TIPOS[extname(p)];
    if (!p || !tipo || !existsSync(p) || !statSync(p).isFile()) return enviar(404, 'text/plain', 'não encontrado');
    enviar(200, tipo, readFileSync(p));
  } catch (e) {
    enviar(500, 'text/plain', String(e && e.stack || e));
  }
}).listen(PORTA, '127.0.0.1', () => {
  console.log(`prévia de figuras em http://localhost:${PORTA}/`);
});
