#!/usr/bin/env node
/* Confere arquivos de figura do kit caneta sem abrir o navegador.

   uso: node .claude/skills/ilustracao-caneta/scripts/conferir.mjs <arquivo.js | pasta> [...]

   Roda cada figura contra um DOM falso e acusa:
   - forma errada do arquivo (campos que faltam, import, cor escrita à mão, acesso ao DOM);
   - traço ou texto fora da área de desenho, e textos sobrepostos;
   - simulação com leitura não finita, erro ao redesenhar ou teste de modelo que falha.

   Sai com código 1 se houver erro. Avisos não reprovam, mas devem ser lidos. */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const MARGEM = 3;          // quanto o tremor pode passar da borda, em px
const MAX_ANIMACAO = 7;    // segundos até o último traço começar

function acharRaiz() {
  let d = AQUI;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(d, 'src', 'caneta', 'caneta.js'))) return d;
    d = dirname(d);
  }
  throw new Error('não achei src/caneta/caneta.js acima de ' + AQUI);
}
const RAIZ = acharRaiz();
const importarTexto = (src) => import('data:text/javascript;base64,' + Buffer.from(src, 'utf8').toString('base64'));
const kit = await importarTexto(readFileSync(join(RAIZ, 'src', 'caneta', 'caneta.js'), 'utf8'));

/* ---------- DOM falso: só o que a caneta usa ---------- */
class No {
  constructor(nome) {
    this.nome = nome; this.attrs = {}; this.filhos = []; this._texto = '';
    this.estilo = {};
    const estilo = this.estilo;
    this.style = new Proxy({ setProperty: (k, v) => { estilo[k] = v; } }, { set: (_, k, v) => ((estilo[k] = v), true) });
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  appendChild(e) { this.filhos.push(e); return e; }
  set textContent(v) { this.filhos = []; this._texto = String(v); }
  get textContent() { return this._texto; }
}
const doc = { createElementNS: (_, nome) => new No(nome) };
/* se fn devolve false, não desce nos filhos daquele nó */
const percorrer = (no, fn) => { if (fn(no) !== false) no.filhos.forEach((f) => percorrer(f, fn)); };

/* ---------- geometria ---------- */
function caixaDoCaminho(d) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, cmd = '', par = [];
  const ponto = (x, y) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
  let ux = 0, uy = 0;
  for (const t of d.matchAll(/([A-Za-z])|(-?\d*\.?\d+(?:e-?\d+)?)/g)) {
    if (t[1]) { cmd = t[1]; par = []; continue; }
    const n = +t[2];
    if (cmd === 'H') { ux = n; ponto(ux, uy); }
    else if (cmd === 'V') { uy = n; ponto(ux, uy); }
    else { par.push(n); if (par.length === 2) { [ux, uy] = par; ponto(ux, uy); par = []; } }
  }
  return minX === Infinity ? null : { x0: minX, y0: minY, x1: maxX, y1: maxY };
}
function caixaDoTexto(no) {
  const x = +no.attrs.x, y = +no.attrs.y, cls = no.attrs.class || '';
  const escala = cls.includes('pequeno') ? 18 / 22 : cls.includes('grande') ? 28 / 22 : 1;
  const w = no.textContent.length * kit.LARGURA_LETRA * escala, sobe = 18 * escala, desce = 6 * escala;
  const anc = no.attrs['text-anchor'] || 'start';
  const esq = anc === 'middle' ? -w / 2 : anc === 'end' ? -w : 0;
  const giro = /rotate\((-?\d+(?:\.\d+)?)/.exec(no.attrs.transform || '');
  if (giro) {
    const g = ((+giro[1] % 360) + 360) % 360;
    if (g === 270) return { x0: x - sobe, x1: x + desce, y0: y - esq - w, y1: y - esq };
    if (g === 90) return { x0: x - desce, x1: x + sobe, y0: y + esq, y1: y + esq + w };
    return null; // outros ângulos: não confere
  }
  return { x0: x + esq, x1: x + esq + w, y0: y - sobe, y1: y + desce };
}

function examinar(svg, fig, onde, P) {
  const W = fig.largura, H = fig.altura, textos = [];
  let nos = 0, maiorAtraso = 0, comAtraso = 0;
  percorrer(svg, (no) => {
    nos++;
    const atraso = parseFloat(no.estilo['--d']);
    if (Number.isFinite(atraso)) { comAtraso++; maiorAtraso = Math.max(maiorAtraso, atraso); }
    if ('data-livre' in no.attrs) return false;
    let cx = null, rotulo = '';
    if (no.nome === 'path' && no.attrs.d) { cx = caixaDoCaminho(no.attrs.d); rotulo = 'traço'; }
    if (no.nome === 'text') { cx = caixaDoTexto(no); rotulo = `texto "${no.textContent}"`; if (cx) textos.push({ cx, s: no.textContent }); }
    if (!cx) return;
    const fora = [];
    if (cx.x0 < -MARGEM) fora.push(`${Math.round(-cx.x0)} px à esquerda`);
    if (cx.x1 > W + MARGEM) fora.push(`${Math.round(cx.x1 - W)} px à direita`);
    if (cx.y0 < -MARGEM) fora.push(`${Math.round(-cx.y0)} px acima`);
    if (cx.y1 > H + MARGEM) fora.push(`${Math.round(cx.y1 - H)} px abaixo`);
    if (fora.length) P.erro(`${onde}: ${rotulo} sai da área de ${W}×${H} (${fora.join(', ')}). Mova para dentro ou aumente largura/altura.`);
  });
  for (let i = 0; i < textos.length; i++) for (let k = i + 1; k < textos.length; k++) {
    const a = textos[i].cx, b = textos[k].cx;
    const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    if (ix <= 0 || iy <= 0) continue;
    const menor = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
    if (ix * iy > 0.25 * menor) P.erro(`${onde}: os textos "${textos[i].s}" e "${textos[k].s}" ficam um em cima do outro. Afaste um deles.`);
  }
  if (textos.length > 16) P.aviso(`${onde}: ${textos.length} textos na figura. Acima de 16 fica poluído; corte ou divida em duas figuras.`);
  if (nos > 2500) P.aviso(`${onde}: ${nos} elementos no SVG. Acima de 2500 a animação pode engasgar no celular.`);
  return { maiorAtraso, comAtraso };
}

/* ---------- regras do arquivo ---------- */
const PROIBIDO = [
  [/^\s*import\s|\bimport\s*\(|\brequire\s*\(/m, 'arquivo de figura não tem import nem require: use os parâmetros `c` (desenho) e `m` (matemática)'],
  [/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?\b|\brgba?\s*\(|\bhsla?\s*\(/, 'cor escrita à mão: use só `cor: \'vermelha\' | \'verde\' | \'ambar\' | \'apagada\'` ou nenhuma (tinta)'],
  [/Math\.random/, 'Math.random deixa o desenho diferente a cada carregamento: o tremor já vem da caneta; para variar use c.semente(n)'],
  [/\bdocument\b|\bwindow\b|innerHTML|querySelector|createElement/, 'a figura não toca a página: desenhe só pela caneta `c`'],
  [/<svg|<path|<circle|<text/, 'SVG escrito à mão: use os métodos da caneta'],
  [/setTimeout|setInterval|requestAnimationFrame/, 'sem relógios próprios: use `atraso`, c.ondas, c.viajar ou c.aCadaQuadro'],
];

async function conferir(arquivo) {
  const erros = [], avisos = [];
  const P = { erro: (s) => erros.push(s), aviso: (s) => avisos.push(s) };
  const fonte = readFileSync(arquivo, 'utf8');
  const semComentarios = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  for (const [re, msg] of PROIBIDO) if (re.test(semComentarios)) P.erro(msg);

  let fig;
  try { fig = (await importarTexto(fonte)).default; }
  catch (e) { P.erro('o arquivo não carrega: ' + e.message); return { erros, avisos }; }
  if (!fig || typeof fig !== 'object') { P.erro('falta `export default { ... }` com a definição da figura'); return { erros, avisos }; }

  const sim = fig.tipo === 'simulacao';
  if (fig.tipo !== 'ilustracao' && !sim) P.erro("`tipo` deve ser 'ilustracao' ou 'simulacao'");
  for (const k of ['largura', 'altura']) if (!(fig[k] > 0)) P.erro(`\`${k}\` deve ser um número positivo`);
  if (fig.largura < 600 || fig.largura > 900) P.aviso(`largura ${fig.largura}: o usual é entre 680 (coluna do texto) e 900 (figura larga)`);
  if (typeof fig.alt !== 'string' || fig.alt.trim().length < 40) P.erro('`alt` descreve a figura para quem não a vê: escreva pelo menos uma frase completa (40 caracteres ou mais)');
  const o = fig.origem || {};
  if (!['ia', 'humano', 'misto'].includes(o.autoria)) P.erro("`origem.autoria` deve ser 'ia', 'humano' ou 'misto'");
  for (const k of ['pedido', 'validacao']) if (typeof o[k] !== 'string' || o[k].trim().length < 15) P.erro(`\`origem.${k}\` está vazio ou curto demais`);
  if (erros.length && !(fig.largura > 0 && fig.altura > 0)) return { erros, avisos };

  const nova = () => {
    const svg = new No('svg');
    return { svg, c: kit.criarCaneta(svg, { doc, semente: fig.semente ?? 11, largura: fig.largura, altura: fig.altura }) };
  };

  if (!sim) {
    if (typeof fig.desenhar !== 'function') { P.erro('ilustração precisa de `desenhar(c)`'); return { erros, avisos }; }
    const { svg, c } = nova();
    try { fig.desenhar(c, kit.m); } catch (e) { P.erro('desenhar() falhou: ' + e.message); return { erros, avisos }; }
    const { maiorAtraso, comAtraso } = examinar(svg, fig, 'desenho', P);
    if (!comAtraso) P.aviso('nenhum traço tem `atraso`: a figura aparece de uma vez, sem se desenhar. Use `atraso: c.depois(...)`.');
    if (maiorAtraso > MAX_ANIMACAO) P.aviso(`o último traço começa aos ${maiorAtraso.toFixed(1)} s. Acima de ${MAX_ANIMACAO} s o leitor desiste; diminua os passos de c.depois().`);
    return { erros, avisos };
  }

  /* simulação */
  const controles = fig.controles || [];
  if (!controles.length) P.erro('simulação precisa de pelo menos um item em `controles`');
  if (controles.length > 5) P.aviso(`${controles.length} controles. Acima de 4 o leitor se perde; corte os que não mudam a conclusão.`);
  const ids = new Set();
  for (const k of controles) {
    if (!k.id || ids.has(k.id)) P.erro(`controle sem \`id\` ou com id repetido: ${k.id}`);
    ids.add(k.id);
    if (!k.rotulo) P.erro(`controle ${k.id}: falta \`rotulo\``);
    if (k.opcoes) {
      if (!k.opcoes.some((op) => op.valor === k.valor)) P.erro(`controle ${k.id}: \`valor\` inicial não está entre as \`opcoes\``);
    } else {
      if (!(k.min < k.max)) P.erro(`controle ${k.id}: \`min\` deve ser menor que \`max\``);
      if (!(k.valor >= k.min && k.valor <= k.max)) P.erro(`controle ${k.id}: \`valor\` inicial fora de [min, max]`);
      if (typeof k.formato !== 'function') P.aviso(`controle ${k.id}: sem \`formato\`, o valor aparece sem unidade`);
    }
  }
  if (typeof fig.modelo !== 'function') P.erro('simulação precisa de `modelo(v, m)`');
  if (typeof fig.atualizar !== 'function') P.erro('simulação precisa de `atualizar(c, v, r, m)`');
  if (!(fig.leituras || []).length) P.erro('simulação precisa de pelo menos uma leitura em `leituras`');
  if (!Array.isArray(fig.testes) || fig.testes.length < 2) P.erro('simulação precisa de pelo menos 2 itens em `testes`, com fatos conhecidos que o modelo reproduz');
  /* só para aqui se faltar o que é preciso para rodar; os outros erros aparecem todos de uma vez */
  if (typeof fig.modelo !== 'function' || typeof fig.atualizar !== 'function' || !controles.length || !(fig.leituras || []).length) return { erros, avisos };
  if (!Array.isArray(fig.testes)) fig = { ...fig, testes: [] };

  const base = kit.valoresIniciais(fig);
  const estados = [['valores iniciais', base]];
  for (const k of controles) {
    const pontas = k.opcoes ? k.opcoes.map((op) => op.valor) : [k.min, k.max];
    for (const p of pontas) if (p !== k.valor) estados.push([`${k.id} = ${p}`, { ...base, [k.id]: p }]);
  }
  const extremo = (lado) => Object.fromEntries(controles.map((k) => [k.id, k.opcoes ? k.opcoes.at(lado === 'min' ? 0 : -1).valor : k[lado]]));
  estados.push(['todos no mínimo', extremo('min')], ['todos no máximo', extremo('max')]);

  const { svg, c } = nova();
  let atual = { v: base, r: {} };
  try { if (fig.cenario) fig.cenario(c, () => atual, kit.m); }
  catch (e) { P.erro('cenario() falhou: ' + e.message); return { erros, avisos }; }
  const dinamica = c.camada();
  const quadrosDoCenario = c._quadros().length;
  let semVeredito = 0;

  for (const [nome, v] of estados) {
    let r;
    try { r = fig.modelo({ ...v }, kit.m) || {}; }
    catch (e) { P.erro(`modelo() falhou com ${nome}: ${e.message}`); continue; }
    if (JSON.stringify(r) !== JSON.stringify(fig.modelo({ ...v }, kit.m))) P.erro(`modelo() devolve resultados diferentes para os mesmos valores (${nome}): ele não pode guardar estado nem usar acaso`);
    for (const l of fig.leituras) {
      const { valor } = kit.lerLeitura(r, l.id);
      if (!Number.isFinite(valor)) P.erro(`leitura "${l.id}" não é um número com ${nome} (veio ${valor}). Trate divisão por zero e logaritmo de zero no modelo.`);
      else if (l.min != null && (valor < l.min || valor > l.max)) P.aviso(`leitura "${l.id}" vale ${kit.m.fmt(valor)} com ${nome}, fora da escala [${l.min}, ${l.max}] do medidor`);
    }
    if (typeof r.veredito !== 'string' || !r.veredito.trim()) semVeredito++;
    atual = { v, r };
    dinamica.limpar().semente((fig.semente ?? 11) + 7);
    try { fig.atualizar(dinamica, { ...v }, r, kit.m); }
    catch (e) { P.erro(`atualizar() falhou com ${nome}: ${e.message}`); continue; }
    try { for (const fn of c._quadros()) fn(0); }
    catch (e) { P.erro(`animação falhou com ${nome}: ${e.message}`); }
    examinar(svg, fig, nome, P);
  }
  if (c._quadros().length !== quadrosDoCenario) P.erro('atualizar() registra animação (c.ondas ou c.aCadaQuadro) a cada mudança e vai acumulando. Mova para cenario().');
  if (semVeredito) P.aviso(`o modelo não devolve \`veredito\` em ${semVeredito} de ${estados.length} estados: o leitor fica sem a frase que interpreta os números`);

  const calc = (parcial) => fig.modelo({ ...base, ...parcial }, kit.m);
  for (const t of fig.testes) {
    try {
      if (!t.espera(calc(t.valores || {}), kit.m, calc)) P.erro(`teste falhou: ${t.nome}`);
    } catch (e) { P.erro(`teste "${t.nome}" lançou erro: ${e.message}`); }
  }
  return { erros, avisos };
}

/* ---------- entrada ---------- */
function acharFiguras(caminho) {
  if (statSync(caminho).isFile()) return [caminho];
  const achados = [];
  const andar = (dir) => {
    for (const nome of readdirSync(dir)) {
      if (nome === 'node_modules' || nome === '.git' || nome === 'dist') continue;
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) andar(p);
      else if (nome.endsWith('.js') && ['figuras', 'exemplos'].includes(basename(dir))) achados.push(p);
    }
  };
  andar(caminho);
  return achados.sort();
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('uso: node conferir.mjs <arquivo.js | pasta> [...]');
  process.exit(2);
}
let totalErros = 0, totalAvisos = 0, total = 0;
for (const arg of args) {
  const alvo = resolve(arg);
  if (!existsSync(alvo)) { console.error(`não existe: ${arg}`); totalErros++; continue; }
  for (const arquivo of acharFiguras(alvo)) {
    total++;
    const { erros, avisos } = await conferir(arquivo);
    totalErros += erros.length; totalAvisos += avisos.length;
    console.log(`\n${relative(process.cwd(), arquivo)}  ${erros.length ? 'REPROVADA' : 'ok'}`);
    for (const e of erros) console.log('  erro   ' + e);
    for (const a of avisos) console.log('  aviso  ' + a);
  }
}
console.log(`\n${total} ${total === 1 ? 'figura' : 'figuras'}, ${totalErros} ${totalErros === 1 ? 'erro' : 'erros'}, ${totalAvisos} ${totalAvisos === 1 ? 'aviso' : 'avisos'}`);
process.exit(totalErros ? 1 : 0);
