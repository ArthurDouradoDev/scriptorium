/* Exemplo completo de simulação: RSRP, RSRQ e RSSI entre duas torres.
   Mostra: modelo puro separado do desenho, cenário desenhado uma vez,
   parte redesenhada a cada mudança, ondas contínuas, legenda com valores,
   veredito em linguagem simples e testes do modelo. */

const CHAO = 250, XA = 80, XB = 720, TOPO = 96;   // geometria da cena
const BARRA = { x: 6, y: 322, w: 788, h: 34 };    // barra de composição do RSSI

const POT_REF = 33;   // dBm por elemento de referência: 18 dBm + 15 dBi de antena
const perda = (km) => 128.1 + 37.6 * Math.log10(km);   // propagação urbana em 2 GHz (3GPP TR 36.814)

export default {
  tipo: 'simulacao',
  titulo: 'Duas torres, um celular',
  largura: 800,
  altura: 362,
  semente: 5,
  alt: 'Duas torres de celular, A à esquerda e B à direita, com um celular entre elas. Abaixo, uma barra mostra do que é feito o RSSI: referência de A, dados de A, torre B e ruído.',
  origem: {
    autoria: 'ia',
    pedido: 'Simulação para ver como distância, paredes e carga das células mudam o RSRP e o RSRQ.',
    validacao: 'Modelo conferido contra os limites teóricos: −3 dB com célula vazia e −10,8 dB com célula cheia, sem interferência.',
  },

  controles: [
    { id: 'pos', rotulo: 'Posição do celular', min: 0.05, max: 1.95, passo: 0.01, valor: 0.6, formato: (v, m) => m.fmt(v, 2) + ' km de A' },
    { id: 'parede', rotulo: 'Paredes no caminho', min: 0, max: 40, passo: 1, valor: 0, formato: (v) => (v ? '−' + v + ' dB' : 'nenhuma') },
    { id: 'cargaA', rotulo: 'Carga da torre A', min: 0, max: 100, passo: 1, valor: 50, formato: (v) => v + '%' },
    { id: 'cargaB', rotulo: 'Carga da torre B', min: 0, max: 100, passo: 1, valor: 50, formato: (v) => v + '%' },
  ],

  leituras: [
    { id: 'rsrp', rotulo: 'RSRP da torre A', unidade: 'dBm', min: -140, max: -44 },
    { id: 'rsrq', rotulo: 'RSRQ', unidade: 'dB', min: -19.5, max: -3 },
    { id: 'rssi', rotulo: 'RSSI em 10 MHz (N = 50)', unidade: 'dBm', min: -110, max: -20 },
  ],

  legenda: [
    { rotulo: 'referência de A', amostra: 'densa', valor: (r, m) => m.pct(r.partes.ref, 1) },
    { rotulo: 'dados de A', amostra: 'leve', valor: (r, m) => m.pct(r.partes.dados, 1) },
    { rotulo: 'torre B', amostra: 'cruzada', cor: 'vermelha', valor: (r, m) => m.pct(r.partes.vizinha, 1) },
    { rotulo: 'ruído', amostra: 'vazia', valor: (r, m) => m.pct(r.partes.ruido, 1) },
  ],

  /* O modelo: só contas. Recebe os valores dos controles e devolve os resultados.
     Não desenha nada e não guarda estado. */
  modelo(v, m) {
    const cargaA = v.cargaA / 100, cargaB = v.cargaB / 100;
    const sinalA = POT_REF - perda(v.pos) - v.parede;        // RSRP de A, em dBm
    const sinalB = POT_REF - perda(2 - v.pos) - v.parede;    // RSRP de B, em dBm
    const S = m.lin(sinalA), I = m.lin(sinalB);
    const ruidoRE = m.lin(-174 + m.db(15000) + 7);           // ruído térmico em 15 kHz, figura de ruído de 7 dB

    // Potência num bloco de recursos (12 elementos) durante um símbolo com referência:
    const ref = 2 * S;                    // 2 elementos de referência
    const dados = 10 * cargaA * S;        // 10 elementos de dados, conforme a carga
    const vizinha = I * (2 + 10 * cargaB);
    const ruido = 12 * ruidoRE;
    const bloco = ref + dados + vizinha + ruido;

    const rsrq = m.db(S / bloco);
    const rssi = m.db(bloco * 50);        // 50 blocos em 10 MHz
    const forte = sinalA >= -100, limpo = rsrq >= -12;

    return {
      rsrp: { valor: sinalA, nota: sinalA >= -80 ? 'excelente' : sinalA >= -90 ? 'bom' : sinalA >= -100 ? 'regular' : 'fraco' },
      rsrq: { valor: rsrq, nota: rsrq < -19.5 ? 'abaixo da faixa reportada' : rsrq >= -10 ? 'excelente' : rsrq >= -15 ? 'bom a regular' : 'ruim' },
      rssi,
      sinalB,
      partes: { ref: ref / bloco, dados: dados / bloco, vizinha: vizinha / bloco, ruido: ruido / bloco },
      veredito:
        sinalB > sinalA + 3 ? 'A torre B já chega mais forte que a A. Numa rede real, o celular já teria feito handover para a B.' :
        forte && limpo ? 'Sinal forte e limpo: quase tudo o que chega é da torre A.' :
        forte ? 'Sinal forte, mas sujo. A potência extra vem da carga de A e da torre B, não da referência.' :
        limpo ? 'Sinal fraco, porém limpo. É um problema de cobertura, não de interferência.' :
        'Sinal fraco e sujo. A referência disputa espaço com a vizinha e com o ruído.',
    };
  },

  /* Testes do modelo: fatos conhecidos que a conta precisa reproduzir.
     `calc(valores)` roda o modelo com outros valores, para comparar dois estados. */
  testes: [
    { nome: 'célula vazia e sem vizinha por perto dá RSRQ de −3 dB',
      valores: { pos: 0.05, cargaA: 0, cargaB: 0 },
      espera: (r) => Math.abs(r.rsrq.valor - -3.01) < 0.05 },
    { nome: 'célula cheia e sem vizinha por perto dá RSRQ de −10,8 dB',
      valores: { pos: 0.05, cargaA: 100, cargaB: 0 },
      espera: (r) => Math.abs(r.rsrq.valor - -10.79) < 0.05 },
    { nome: 'parede de 20 dB tira exatamente 20 dB do RSRP',
      valores: { parede: 20 },
      espera: (r, m, calc) => Math.abs(calc({ parede: 0 }).rsrp.valor - r.rsrp.valor - 20) < 1e-9 },
    { nome: 'o RSRP não muda com a carga',
      valores: { cargaA: 100, cargaB: 100 },
      espera: (r, m, calc) => r.rsrp.valor === calc({ cargaA: 0, cargaB: 0 }).rsrp.valor },
    { nome: 'no meio do caminho as duas torres chegam iguais',
      valores: { pos: 1 },
      espera: (r) => Math.abs(r.rsrp.valor - r.sinalB) < 1e-9 },
    { nome: 'as partes do RSSI somam 100%',
      valores: {},
      espera: (r) => Math.abs(r.partes.ref + r.partes.dados + r.partes.vizinha + r.partes.ruido - 1) < 1e-9 },
  ],

  /* O cenário: o que não muda. Desenhado uma vez. `vivo()` devolve { v, r } atuais,
     para as ondas acompanharem a carga sem redesenhar a cena. */
  cenario(c, vivo) {
    c.ondas(XA, TOPO - 10, { recorte: [-20, -40, 840, 290], intensidade: () => vivo().v.cargaA / 100 });
    c.ondas(XB, TOPO - 10, { recorte: [-20, -40, 840, 290], intensidade: () => vivo().v.cargaB / 100, cor: 'vermelha' });

    c.linha(10, CHAO, 790, CHAO, { tremor: 2.2 });
    for (const x of [XA, XB]) {
      c.linha(x - 20, CHAO, x, TOPO).linha(x + 20, CHAO, x, TOPO);
      for (let i = 0; i < 4; i++) {            // treliça: quatro "X" que afinam com a altura
        const y1 = CHAO - 12 - i * 34, y2 = y1 - 30;
        const w1 = 20 * (CHAO - y1) / (CHAO - TOPO), w2 = 20 * (CHAO - y2) / (CHAO - TOPO);
        c.linha(x - 20 + w1, y1, x + 20 - w2, y2, { simples: true, peso: 'fino' });
        c.linha(x + 20 - w1, y1, x - 20 + w2, y2, { simples: true, peso: 'fino' });
      }
      c.linha(x, TOPO, x, TOPO - 22);
      c.caixa(x - 11, TOPO - 20, 6, 22, { tremor: 0.8 }).caixa(x + 5, TOPO - 20, 6, 22, { tremor: 0.8 });
    }
    c.texto(XA, 288, 'A · servidora', { ancora: 'middle' });
    c.texto(XB, 288, 'B · vizinha', { ancora: 'middle', cor: 'vermelha' });
    c.texto(BARRA.x, 314, 'do que é feito o RSSI neste ponto', { tamanho: 'pequeno', cor: 'apagada' });
  },

  /* A parte que muda. A camada chega limpa a cada chamada: desenhe tudo de novo. */
  atualizar(c, v, r, m) {
    c.texto(400, 30, m.fmt(v.pos, 2) + ' km de A · ' + m.fmt(2 - v.pos, 2) + ' km de B', { ancora: 'middle' });

    // celular, com barrinhas de sinal conforme o RSRP
    const px = XA + 34 + (v.pos - 0.05) / 1.9 * (XB - XA - 68);
    c.caixa(px - 9, CHAO - 40, 18, 34, { tremor: 0.8 });
    c.linha(px - 4, CHAO - 11, px + 4, CHAO - 11, { simples: true, peso: 'fino', tremor: 0.4 });
    const s = r.rsrp.valor;
    const barras = s >= -80 ? 4 : s >= -90 ? 3 : s >= -100 ? 2 : s >= -115 ? 1 : 0;
    for (let i = 0; i < 4; i++) {
      const bx = px - 13 + i * 8, bh = 6 + i * 5;
      if (i < barras) c.hachura(bx, CHAO - 50 - bh, 5, bh, { espaco: 2.2 });
      c.caixa(bx, CHAO - 50 - bh, 5, bh, { tremor: 0.4, simples: true, peso: 'fino' });
    }
    c.curva([[XA + 6, TOPO - 12], [(XA + px) / 2, TOPO - 34], [px, CHAO - 78]], { tracejado: true, peso: 'fino', tremor: 0 });

    // barra de composição do RSSI: cada parte com a sua hachura
    const partes = [
      [r.partes.ref, { espaco: 3.2 }],
      [r.partes.dados, { espaco: 7 }],
      [r.partes.vizinha, { espaco: 7, cruzada: true, cor: 'vermelha' }],
      [r.partes.ruido, null],
    ];
    let x = BARRA.x;
    partes.forEach(([fracao, hachura], i) => {
      const w = BARRA.w * fracao;
      if (hachura && w > 2) c.hachura(x, BARRA.y, w, BARRA.h, hachura);
      x += w;
      if (i < 3 && w > 1.5 && x < BARRA.x + BARRA.w - 1.5) c.linha(x, BARRA.y, x, BARRA.y + BARRA.h, { simples: true, tremor: 0.6 });
    });
    c.caixa(BARRA.x, BARRA.y, BARRA.w, BARRA.h);
  },
};
