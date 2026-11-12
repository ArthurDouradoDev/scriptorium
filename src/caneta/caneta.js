// @ts-check
/* Kit caneta: desenho com aparência de caneta Bic para ilustrações e simulações.
   Fonte única do traço do projeto. A documentação de uso está em
   .claude/skills/ilustracao-caneta/referencia-api.md; mudou a API, atualize lá.

   Este arquivo não tem import e não toca o DOM ao ser carregado, porque
   também roda no Node (scripts/conferir.mjs das skills, com um DOM falso). */

const NS = 'http://www.w3.org/2000/svg';
const ID_FILTRO = 'caneta-tremor';
const ALTURA_LINHA = 24;
/** Largura média de um caractere da fonte manuscrita a 22 px. */
export const LARGURA_LETRA = 8.8;
let proximoId = 0;

/* ---------- matemática e formatação: o parâmetro `m` das figuras ---------- */

export const m = Object.freeze({
  /** Razão linear para decibéis. */
  db: (x) => 10 * Math.log10(x),
  /** Decibéis para razão linear. */
  lin: (x) => Math.pow(10, x / 10),
  /** Prende x entre a e b. */
  limitar: (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)),
  /** Leva x do intervalo [a, b] para o intervalo [c, d]. */
  mapear: (x, a, b, c, d) => c + ((x - a) / (b - a)) * (d - c),
  /** Número no padrão brasileiro: vírgula decimal e sinal de menos tipográfico. */
  fmt(v, casas = 1) {
    if (!Number.isFinite(v)) return '—';
    const s = v.toFixed(casas);
    return (Number(s) === 0 ? (0).toFixed(casas) : s).replace('.', ',').replace('-', '−');
  },
  /** Fração (0 a 1) como porcentagem. */
  pct(x, casas = 0) {
    return m.fmt(x * 100, casas) + '%';
  },
});

/* ---------- a caneta ---------- */

/**
 * Cria a caneta que desenha dentro de um <svg>.
 * @param {any} svg elemento <svg>
 * @param {{semente?: number, animar?: boolean, movimento?: boolean, largura?: number, altura?: number, doc?: any}} [opcoes]
 */
export function criarCaneta(svg, opcoes = {}) {
  const estado = {
    semente: opcoes.semente ?? 11,
    relogio: 0,
    quadros: /** @type {((t: number) => void)[]} */ ([]),
    movimento: opcoes.movimento !== false,
    largura: opcoes.largura ?? 800,
    altura: opcoes.altura ?? 400,
    doc: opcoes.doc || svg.ownerDocument,
  };
  return novaCamada(svg, estado, opcoes.animar !== false);
}

function novaCamada(svg, estado, animar) {
  const doc = estado.doc;
  const no = (nome, attrs, pai) => {
    const e = doc.createElementNS(NS, nome);
    for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    pai.appendChild(e);
    return e;
  };
  const raiz = no('g', { class: 'camada' }, svg);
  const tracos = no('g', { filter: `url(#${ID_FILTRO})` }, raiz);
  const textos = no('g', {}, raiz);

  const rnd = () => (estado.semente = (estado.semente * 16807) % 2147483647) / 2147483647;
  const j = (a) => (rnd() - 0.5) * 2 * a;
  const f = (n) => (+n).toFixed(1);

  const classeDe = (o, base = 't') =>
    base +
    (o.peso === 'fino' ? ' fino' : o.peso === 'forte' ? ' forte' : '') +
    (o.cor ? ' cor-' + o.cor : '') +
    (o.tracejado ? ' tracejado' : '');

  /* modo: 'riscar' desenha o traço do começo ao fim; 'surgir' faz aparecer */
  function por(d, o, modo, livre) {
    const animado = animar && o.atraso != null;
    const m2 = modo === 'surgir' || o.tracejado ? 'surgir' : 'riscar';
    const p = no('path', { d, class: classeDe(o) + (animado ? ' ' + m2 : '') }, tracos);
    if (animado) {
      if (m2 === 'riscar') p.setAttribute('pathLength', '1');
      p.style.setProperty('--d', o.atraso + 's');
    }
    if (livre) p.setAttribute('data-livre', '');
    return p;
  }

  const traco = (x1, y1, x2, y2, w) =>
    `M${f(x1 + j(w))} ${f(y1 + j(w))} Q${f((x1 + x2) / 2 + j(w * 1.5))} ${f((y1 + y2) / 2 + j(w * 1.5))} ${f(x2 + j(w))} ${f(y2 + j(w))}`;

  /* curva que passa por todos os pontos (Catmull-Rom convertida em Bézier) */
  function suave(p) {
    let d = `M${f(p[0][0])} ${f(p[0][1])}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }

  const c = {
    /** Largura e altura da área de desenho. */
    largura: estado.largura,
    altura: estado.altura,

    /** Linha reta riscada duas vezes, como quem reforça o traço. */
    linha(x1, y1, x2, y2, o = {}) {
      const w = o.tremor ?? 1.4;
      por(traco(x1, y1, x2, y2, w), o, 'riscar');
      if (!o.simples && !o.tracejado) {
        por(traco(x1, y1, x2, y2, w), o.atraso != null ? { ...o, atraso: o.atraso + 0.08 } : o, 'riscar');
      }
      return c;
    },

    /** Retângulo. `preencher: true` cobre o que está atrás com a cor do papel. */
    caixa(x, y, w, h, o = {}) {
      if (o.preencher) no('path', { d: `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`, class: 'papel' }, tracos);
      const q = { tremor: 1, ...o };
      c.linha(x, y, x + w, y, q);
      c.linha(x + w, y, x + w, y + h, q);
      c.linha(x + w, y + h, x, y + h, q);
      c.linha(x, y + h, x, y, q);
      return c;
    },

    /** Elipse desenhada à mão: a volta passa um pouco do ponto de partida. */
    elipse(cx, cy, rx, ry, o = {}) {
      const w = o.tremor ?? Math.min(1.6, 0.6 + Math.min(rx, ry) * 0.03);
      const voltas = o.simples ? 1 : 2;
      for (let k = 0; k < voltas; k++) {
        const a0 = rnd() * Math.PI * 2, n = 10, pts = [];
        for (let i = 0; i <= n; i++) {
          const a = a0 + (i / n) * Math.PI * 2 * 1.04;
          pts.push([cx + (rx + j(w)) * Math.cos(a), cy + (ry + j(w)) * Math.sin(a)]);
        }
        if (o.preencher && k === 0) no('path', { d: suave(pts) + 'Z', class: 'papel' }, tracos);
        por(suave(pts), o.atraso != null ? { ...o, atraso: o.atraso + k * 0.08 } : o, 'riscar');
      }
      return c;
    },

    circulo(cx, cy, r, o = {}) {
      return c.elipse(cx, cy, r, r, o);
    },

    /** Curva suave por uma lista de pontos [[x, y], ...]. `reta: true` liga com segmentos. */
    curva(pontos, o = {}) {
      const w = o.tremor ?? 0.5;
      const pts = pontos.map(([x, y]) => [x + j(w), y + j(w)]);
      const d = o.reta ? 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') : suave(pts);
      por(d, o, 'riscar');
      return c;
    },

    /** Hachura diagonal dentro de um retângulo. `cruzada: true` risca nos dois sentidos. */
    hachura(x, y, w, h, o = {}) {
      const gap = o.espaco ?? 4;
      let d = '';
      for (let k = gap; k < w + h; k += gap) {
        const xa = Math.min(k, w), ya = k - xa, yb = Math.min(k, h), xb = k - yb;
        d += `M${f(x + xa + j(0.5))} ${f(y + ya + j(0.5))}L${f(x + xb + j(0.5))} ${f(y + yb + j(0.5))}`;
        if (o.cruzada) d += `M${f(x + w - xa + j(0.5))} ${f(y + ya + j(0.5))}L${f(x + w - xb + j(0.5))} ${f(y + yb + j(0.5))}`;
      }
      if (d) por(d, { peso: 'fino', ...o }, 'surgir');
      return c;
    },

    /** Seta de (x1, y1) até (x2, y2). `curva` em pixels entorta o caminho; `dupla` põe ponta nos dois lados. */
    seta(x1, y1, x2, y2, o = {}) {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, k = o.curva || 0;
      const qx = (x1 + x2) / 2 - (dy / len) * k + j(k ? 3 : 1), qy = (y1 + y2) / 2 + (dx / len) * k + j(k ? 3 : 1);
      por(`M${f(x1)} ${f(y1)} Q${f(qx)} ${f(qy)} ${f(x2)} ${f(y2)}`, o, 'riscar');
      const t = o.ponta ?? 11;
      const ponta = (px, py, ang) =>
        `M${f(px)} ${f(py)}L${f(px - t * Math.cos(ang + 0.45))} ${f(py - t * Math.sin(ang + 0.45))}M${f(px)} ${f(py)}L${f(px - t * Math.cos(ang - 0.45))} ${f(py - t * Math.sin(ang - 0.45))}`;
      const depois = o.atraso != null ? { ...o, atraso: o.atraso + 0.25, tracejado: false } : { ...o, tracejado: false };
      por(ponta(x2, y2, Math.atan2(y2 - qy, x2 - qx)), depois, 'riscar');
      if (o.dupla) por(ponta(x1, y1, Math.atan2(y1 - qy, x1 - qx)), depois, 'riscar');
      return c;
    },

    /** Texto manuscrito. Aceita uma string, com \n, ou uma lista de linhas. */
    texto(x, y, conteudo, o = {}) {
      const linhas = Array.isArray(conteudo) ? conteudo : String(conteudo).split('\n');
      const animado = animar && o.atraso != null;
      linhas.forEach((s, i) => {
        const ty = y + i * ALTURA_LINHA;
        const attrs = {
          x: f(x), y: f(ty), 'text-anchor': o.ancora || 'start',
          class: [animado ? 'surgir' : '', o.forte ? 'forte' : '', o.tamanho || '', o.cor ? 'cor-' + o.cor : ''].filter(Boolean).join(' '),
        };
        if (o.girar) attrs.transform = `rotate(${o.girar} ${f(x)} ${f(ty)})`;
        const e = no('text', attrs, textos);
        if (animado) e.style.setProperty('--d', o.atraso + 's');
        e.textContent = s;
      });
      return c;
    },

    /** Texto com uma seta curva até o ponto que ele explica. */
    anotacao(x, y, conteudo, alvo, o = {}) {
      const linhas = Array.isArray(conteudo) ? conteudo : String(conteudo).split('\n');
      const w = Math.max(...linhas.map((s) => s.length)) * LARGURA_LETRA;
      const topo = y - 18, base = y + (linhas.length - 1) * ALTURA_LINHA + 6, meio = (topo + base) / 2;
      const [ax, ay] = alvo;
      let sx, sy;
      if (ax < x - 4) { sx = x - 8; sy = meio; }
      else if (ax > x + w + 4) { sx = x + w + 8; sy = meio; }
      else if (ay < topo) { sx = x + w / 2; sy = topo - 6; }
      else { sx = x + w / 2; sy = base + 6; }
      c.texto(x, y, linhas, o);
      c.seta(sx, sy, ax, ay, { curva: 18, ...o, atraso: o.atraso != null ? o.atraso + 0.1 : undefined });
      return c;
    },

    /**
     * Par de eixos com marcas. Devolve a escala para converter valores em pixels.
     * @param {{x:number,y:number,largura:number,altura:number,dominioX:[number,number],dominioY:[number,number],
     *   marcasX?:any[],marcasY?:any[],rotuloX?:string,rotuloY?:string,atraso?:number,casas?:number}} o
     */
    eixos(o) {
      const { x, y, largura: w, altura: h, dominioX: [x0, x1], dominioY: [y0, y1] } = o;
      const px = (v) => x + ((v - x0) / (x1 - x0)) * w;
      const py = (v) => y + h - ((v - y0) / (y1 - y0)) * h;
      const a = o.atraso, mais = (d) => (a != null ? a + d : undefined);
      c.seta(x, y + h, x + w + 14, y + h, { atraso: a, ponta: 8 });
      c.seta(x, y + h, x, y - 14, { atraso: mais(0.15), ponta: 8 });
      const marca = (mk) => (typeof mk === 'number' ? { v: mk, texto: m.fmt(mk, o.casas ?? 0) } : mk);
      (o.marcasX || []).map(marca).forEach((mk) => {
        c.linha(px(mk.v), y + h, px(mk.v), y + h + 6, { simples: true, peso: 'fino', tremor: 0.4, atraso: mais(0.3) });
        c.texto(px(mk.v), y + h + 24, mk.texto, { ancora: 'middle', tamanho: 'pequeno', atraso: mais(0.35) });
      });
      (o.marcasY || []).map(marca).forEach((mk) => {
        c.linha(x - 6, py(mk.v), x, py(mk.v), { simples: true, peso: 'fino', tremor: 0.4, atraso: mais(0.3) });
        c.texto(x - 10, py(mk.v) + 6, mk.texto, { ancora: 'end', tamanho: 'pequeno', atraso: mais(0.35) });
      });
      if (o.rotuloX) c.texto(x + w + 14, y + h + 46, o.rotuloX, { ancora: 'end', atraso: mais(0.4) });
      if (o.rotuloY) c.texto(x - 6, y - 24, o.rotuloY, { atraso: mais(0.4) });
      return {
        x: px,
        y: py,
        ponto: (vx, vy) => [px(vx), py(vy)],
        /** Amostra fn(x) em n pontos do domínio; pronto para passar a c.curva(). */
        amostrar: (fn, n = 40) =>
          Array.from({ length: n + 1 }, (_, i) => {
            const vx = x0 + ((x1 - x0) * i) / n;
            return [px(vx), py(Math.max(Math.min(fn(vx), Math.max(y0, y1)), Math.min(y0, y1)))];
          }),
      };
    },

    /** Caminho SVG escrito à mão. Último recurso: o conferir.mjs não confere os limites dele. */
    caminho(d, o = {}) {
      return por(d, o, o.surgir ? 'surgir' : 'riscar', true), c;
    },

    /** Um envelope ou um ponto que percorre o caminho `d` sem parar. Some no impresso. */
    viajar(d, o = {}) {
      if (!estado.movimento) return c;
      const g = no('g', { 'data-livre': '' }, textos);
      if (animar) {
        /* só aparece depois do que já foi desenhado, para não viajar no papel em branco */
        g.setAttribute('class', 'surgir');
        g.style.setProperty('--d', (o.atraso ?? estado.relogio + 0.4) + 's');
      }
      no('path', {
        d: o.forma === 'ponto' ? 'M-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0' : 'M-12 -8h24v16h-24zM-12 -8l12 9l12 -9',
        class: classeDe(o) + ' papel',
      }, g);
      no('animateMotion', {
        dur: (o.duracao ?? 3.4) + 's', repeatCount: 'indefinite', path: d,
        begin: typeof o.inicio === 'number' ? o.inicio + 's' : o.inicio || '0s',
      }, g);
      return c;
    },

    /** Anéis que se expandem a partir de um ponto, como ondas de rádio. */
    ondas(cx, cy, o = {}) {
      const n = o.n ?? 3, r0 = o.raioMin ?? 14, r1 = o.raioMax ?? 250, periodo = o.periodo ?? 3800;
      const forca = o.intensidade || (() => 1);
      let pai = tracos;
      if (o.recorte) {
        const id = 'caneta-recorte-' + ++proximoId, [rx, ry, rw, rh] = o.recorte;
        no('rect', { x: rx, y: ry, width: rw, height: rh }, no('clipPath', { id }, tracos));
        pai = no('g', { 'clip-path': `url(#${id})` }, tracos);
      }
      const aneis = Array.from({ length: n }, () =>
        no('circle', { cx: f(cx), cy: f(cy), class: classeDe({ peso: 'fino', ...o }), 'data-livre': '' }, pai));
      estado.quadros.push((t) => {
        const k = forca();
        aneis.forEach((e, i) => {
          const fase = estado.movimento ? (t / periodo + i / n) % 1 : (i + 1) / (n + 0.2);
          e.setAttribute('r', f(r0 + fase * (r1 - r0)));
          e.style.opacity = ((1 - fase) * (0.25 + 0.75 * k)).toFixed(2);
        });
      });
      return c;
    },

    /** Registra uma função chamada a cada quadro com o tempo em milissegundos. */
    aCadaQuadro(fn) {
      estado.quadros.push(fn);
      return c;
    },

    /** Avança o relógio da animação e devolve o novo instante, em segundos. Use em `atraso`. */
    depois(dt = 0.1) {
      return (estado.relogio = +(estado.relogio + dt).toFixed(3));
    },

    /** Instante atual do relógio da animação, sem avançar. */
    agora() {
      return estado.relogio;
    },

    /** Troca a semente do tremor. A mesma semente dá sempre o mesmo desenho. */
    semente(n) {
      estado.semente = n;
      return c;
    },

    /** Nova camada por cima desta. Serve para a parte que é redesenhada (não anima a entrada). */
    camada() {
      return novaCamada(svg, estado, false);
    },

    /** Apaga tudo o que esta camada desenhou. */
    limpar() {
      tracos.textContent = '';
      textos.textContent = '';
      return c;
    },

    /** Uso interno de montar() e do conferir.mjs: as funções registradas por quadro. */
    _quadros: () => estado.quadros,
  };
  return c;
}

/* ---------- valores e leituras ---------- */

/** Valores iniciais dos controles de uma figura: { id: valor }. */
export function valoresIniciais(figura) {
  const v = {};
  for (const k of figura.controles || []) v[k.id] = k.valor;
  return v;
}

/** Normaliza o resultado do modelo para uma leitura: número ou { valor, nota }. */
export function lerLeitura(r, id) {
  const bruto = r ? r[id] : undefined;
  return bruto != null && typeof bruto === 'object' ? bruto : { valor: bruto };
}

/* ---------- montagem no navegador ---------- */

function garantirFiltro(doc, movimento) {
  let turb = doc.getElementById(ID_FILTRO + '-ruido');
  if (!turb) {
    const svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML =
      `<filter id="${ID_FILTRO}" x="-5%" y="-5%" width="110%" height="110%">` +
      `<feTurbulence id="${ID_FILTRO}-ruido" type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1" result="n"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>`;
    doc.body.appendChild(svg);
    turb = doc.getElementById(ID_FILTRO + '-ruido');
  }
  /* o traço "treme" devagar, como animação feita à mão; um relógio só por página */
  if (movimento && !doc.__canetaTremor) {
    let s = 1;
    doc.__canetaTremor = doc.defaultView.setInterval(() => turb.setAttribute('seed', String((s = (s % 6) + 1))), 190);
  }
}

/**
 * Monta uma figura dentro de um elemento da página.
 * @param {HTMLElement} alvo
 * @param {any} figura objeto exportado por um arquivo de figura
 * @param {{estado?: 'impresso'}} [opcoes]
 */
export function montar(alvo, figura, opcoes = {}) {
  const doc = alvo.ownerDocument, win = doc.defaultView;
  const impresso = opcoes.estado === 'impresso';
  const movimento = !impresso && !win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sim = figura.tipo === 'simulacao';
  const h = (tag, attrs = {}, texto, pai = alvo) => {
    const e = doc.createElement(tag);
    for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    if (texto != null) e.textContent = texto;
    pai.appendChild(e);
    return e;
  };

  alvo.textContent = '';
  alvo.classList.add('caneta');
  alvo.classList.toggle('caneta-sim', sim);
  if (impresso) alvo.setAttribute('data-estado', 'impresso');
  garantirFiltro(doc, movimento);

  if (sim && figura.titulo) h('p', { class: 'sim-titulo' }, figura.titulo);
  const svg = doc.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${figura.largura} ${figura.altura}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', figura.alt || '');
  alvo.appendChild(svg);

  const semente = figura.semente ?? 11;
  const c = criarCaneta(svg, { semente, animar: !impresso, movimento, largura: figura.largura, altura: figura.altura });
  const valores = valoresIniciais(figura);
  let resultado = {};
  const vivo = () => ({ v: valores, r: resultado });

  /* controles */
  const saidas = {}, entradas = {};
  if (figura.controles && figura.controles.length) {
    const caixa = h('div', { class: 'controles' });
    for (const k of figura.controles) {
      if (k.opcoes) {
        const grupo = h('div', { role: 'group', 'aria-label': k.rotulo }, null, caixa);
        h('div', {}, k.rotulo, grupo);
        const linha = h('div', { class: 'opcoes' }, null, grupo);
        const botoes = k.opcoes.map((op) => {
          const b = h('button', { type: 'button', 'aria-pressed': String(op.valor === k.valor) }, op.rotulo, linha);
          b.addEventListener('click', () => {
            valores[k.id] = op.valor;
            botoes.forEach((x, i) => x.setAttribute('aria-pressed', String(k.opcoes[i].valor === op.valor)));
            atualizar();
          });
          return b;
        });
      } else {
        const rot = h('label', {}, k.rotulo + ' ', caixa);
        saidas[k.id] = h('output', {}, '', rot);
        const inp = h('input', { type: 'range', min: k.min, max: k.max, step: k.passo ?? 1, value: k.valor }, null, rot);
        inp.addEventListener('input', () => { valores[k.id] = +inp.value; atualizar(); });
        entradas[k.id] = inp;
      }
    }
  }

  /* leituras */
  const leit = {};
  if (figura.leituras && figura.leituras.length) {
    const caixa = h('div', { class: 'leituras' });
    for (const l of figura.leituras) {
      const d = h('div', { class: 'leitura' }, null, caixa);
      h('div', { class: 'rot' }, l.rotulo, d);
      const val = h('div', { class: 'val' }, null, d);
      const num = h('span', {}, '', val);
      if (l.unidade) { val.appendChild(doc.createTextNode(' ')); h('small', {}, l.unidade, val); }
      let agulha = null;
      if (l.min != null && l.max != null) {
        agulha = h('i', {}, null, h('div', { class: 'medidor' }, null, d));
        const pontas = h('div', { class: 'pontas' }, null, d);
        h('span', {}, m.fmt(l.min, l.casas ?? 1).replace(/,0+$/, ''), pontas);
        h('span', {}, m.fmt(l.max, l.casas ?? 1).replace(/,0+$/, ''), pontas);
      }
      leit[l.id] = { num, agulha, nota: h('div', { class: 'cls' }, ' ', d), def: l };
    }
  }

  /* legenda e veredito */
  const itensLegenda = [];
  if (figura.legenda && figura.legenda.length) {
    const caixa = h('div', { class: 'legenda' });
    for (const it of figura.legenda) {
      const s = h('span', {}, null, caixa);
      const tipo = it.amostra === 'tracejada' ? 'linha tracejada' : it.amostra || 'vazia';
      h('i', { class: `amostra ${tipo}${it.cor ? ' cor-' + it.cor : ''}` }, null, s);
      s.appendChild(doc.createTextNode(it.rotulo + ' '));
      itensLegenda.push({ it, b: h('b', {}, '', s) });
    }
  }
  const veredito = sim ? h('p', { class: 'veredito', 'aria-live': 'polite' }) : null;

  /* desenho */
  let dinamica = null;
  if (sim) {
    if (figura.cenario) figura.cenario(c, vivo, m);
    dinamica = c.camada();
  } else if (figura.desenhar) {
    figura.desenhar(c, m);
  }

  function atualizar() {
    resultado = figura.modelo ? figura.modelo(valores, m) || {} : {};
    for (const k of figura.controles || []) {
      if (saidas[k.id]) saidas[k.id].textContent = k.formato ? k.formato(valores[k.id], m) : m.fmt(valores[k.id], 0);
    }
    for (const id in leit) {
      const { num, agulha, nota, def } = leit[id], l = lerLeitura(resultado, id);
      num.textContent = m.fmt(l.valor, def.casas ?? 1);
      nota.textContent = l.nota || ' ';
      if (agulha) agulha.style.left = m.limitar((l.valor - def.min) / (def.max - def.min)) * 100 + '%';
    }
    for (const { it, b } of itensLegenda) b.textContent = it.valor ? it.valor(resultado, m) : '';
    if (veredito) veredito.textContent = resultado.veredito || '';
    if (dinamica) {
      dinamica.limpar().semente(semente + 7);
      if (figura.atualizar) figura.atualizar(dinamica, valores, resultado, m);
    }
  }
  atualizar();

  /* tinta ao entrar na tela e quadros só enquanto visível */
  let visivel = false, quadro = 0, vivoNaPagina = true;
  const rodarQuadros = (t) => { for (const fn of c._quadros()) fn(t); };
  const temQuadros = () => c._quadros().length > 0;
  const laco = (t) => {
    if (!vivoNaPagina || !visivel) return (quadro = 0);
    rodarQuadros(t);
    quadro = win.requestAnimationFrame(laco);
  };

  if (impresso || !('IntersectionObserver' in win)) {
    alvo.classList.add('tinta');
    rodarQuadros(0);
  } else {
    rodarQuadros(0);
    const obs = new win.IntersectionObserver((es) => es.forEach((e) => {
      visivel = e.isIntersecting;
      if (visivel) alvo.classList.add('tinta');
      if (visivel && movimento && temQuadros() && !quadro) quadro = win.requestAnimationFrame(laco);
    }), { threshold: 0.25 });
    obs.observe(alvo);
    alvo.__canetaObs = obs;
  }

  return {
    /** Recalcula e redesenha com os valores atuais. */
    atualizar,
    /** Muda valores de controles por código: definir({ pos: 1.2 }). */
    definir(novos) {
      Object.assign(valores, novos);
      for (const id in novos) if (entradas[id]) entradas[id].value = String(novos[id]);
      atualizar();
    },
    valores: () => ({ ...valores }),
    resultado: () => resultado,
    destruir() {
      vivoNaPagina = false;
      if (quadro) win.cancelAnimationFrame(quadro);
      if (alvo.__canetaObs) alvo.__canetaObs.disconnect();
    },
  };
}
