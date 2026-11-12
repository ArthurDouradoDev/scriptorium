/* Exemplo completo de fluxo: um computador conversa com um servidor.
   Mostra: funções locais para objetos repetidos, caixas com detalhes finos,
   setas com rótulo, envelopes que viajam sem parar (c.viajar) e a ordem de
   entrada que conta a história: quem são, o pedido, a resposta. */

/* Um computador de 140 × 112: monitor, tela com três linhas de texto e pé. */
function computador(c, x, y, atraso) {
  c.caixa(x, y, 140, 92, { atraso });
  c.caixa(x + 9, y + 9, 122, 74, { atraso: atraso + 0.1, simples: true, peso: 'fino', tremor: 0.6 });
  for (const [x1, dy, x2] of [[20, 26, 78], [20, 42, 104], [20, 58, 62]]) {
    c.linha(x + x1, y + dy, x + x2, y + dy, { atraso: atraso + 0.3, simples: true, peso: 'fino', tremor: 0.5 });
  }
  c.linha(x + 70, y + 92, x + 70, y + 108, { atraso: atraso + 0.2 });
  c.linha(x + 38, y + 110, x + 102, y + 110, { atraso: atraso + 0.2 });
}

/* Um servidor: gabinete com n gavetas, cada uma com uma luz e uma fenda. */
function servidor(c, x, y, w, h, n, atraso) {
  c.caixa(x, y, w, h, { atraso });
  const gaveta = (h - 16) / n;
  for (let i = 0; i < n; i++) {
    const gy = y + 12 + i * gaveta, meio = gy + (gaveta - 8) / 2;
    c.caixa(x + 10, gy, w - 20, gaveta - 8, { atraso: atraso + 0.15 + i * 0.06, simples: true, peso: 'fino', tremor: 0.6 });
    c.circulo(x + 23, meio, 3, { atraso: atraso + 0.4, simples: true, peso: 'fino' });
    c.linha(x + 38, meio, x + w - 22, meio, { atraso: atraso + 0.3, simples: true, peso: 'fino', tremor: 0.5 });
  }
}

export default {
  tipo: 'ilustracao',
  largura: 900,
  altura: 300,
  semente: 91,
  alt: 'Um computador com navegador à esquerda e um servidor à direita. Uma seta leva o pedido do computador ao servidor e outra traz a resposta de volta.',
  origem: {
    autoria: 'ia',
    pedido: 'Mostrar que toda página da web é uma conversa de pedido e resposta entre o navegador e um servidor.',
    validacao: 'Desenho conceitual, sem números. Conferido que as setas apontam no sentido certo e que os rótulos correspondem a cada seta.',
  },

  desenhar(c) {
    // 1. Quem participa.
    computador(c, 60, 86, c.depois(0));
    servidor(c, 730, 50, 104, 190, 4, c.depois(0.3));
    c.texto(130, 226, 'seu computador', { ancora: 'middle', forte: true, atraso: c.depois(0.2) });
    c.texto(130, 250, 'navegador', { ancora: 'middle', atraso: c.agora() });
    c.texto(782, 268, 'servidor', { ancora: 'middle', forte: true, atraso: c.depois(0.2) });

    // 2. O pedido vai.
    const ida = c.depois(0.3);
    c.seta(222, 112, 712, 112, { atraso: ida });
    c.texto(467, 92, 'pedido: «quero o relatório de ontem»', { ancora: 'middle', atraso: ida + 0.1 });

    // 3. A resposta volta.
    const volta = c.depois(0.6);
    c.seta(712, 178, 222, 178, { atraso: volta });
    c.texto(467, 208, 'resposta: a página ou o arquivo', { ancora: 'middle', atraso: volta + 0.1 });

    // 4. Movimento contínuo: um envelope em cada sentido, defasados em meio ciclo.
    c.viajar('M236 112H698');
    c.viajar('M698 178H236', { inicio: -1.7 });
  },
};
