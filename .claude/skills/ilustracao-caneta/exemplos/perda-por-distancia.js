/* Exemplo completo de gráfico: perda de propagação conforme a distância.
   Mostra: eixos com marcas, duas curvas amostradas de uma fórmula, cor da paleta
   sempre junto com um segundo sinal (aqui, o tracejado) e rótulo direto na curva
   em vez de legenda separada. */

const espacoLivre = (km) => 32.4 + 20 * Math.log10(2000) + 20 * Math.log10(km);  // Friis, 2 GHz
const urbano = (km) => 128.1 + 37.6 * Math.log10(km);                             // 3GPP TR 36.814, macro urbano

export default {
  tipo: 'ilustracao',
  largura: 780,
  altura: 420,
  semente: 23,
  alt: 'Gráfico da perda de propagação, de 70 a 150 dB, em função da distância, de 0,1 a 2 km. A curva da cidade fica sempre acima da curva do espaço livre e sobe mais depressa: a 2 km a diferença passa de 30 dB.',
  origem: {
    autoria: 'ia',
    pedido: 'Comparar a perda no espaço livre com a perda numa cidade, em 2 GHz.',
    validacao: 'Valores conferidos à mão em 1 km: 98,4 dB no espaço livre (Friis) e 128,1 dB no modelo urbano.',
  },

  desenhar(c) {
    // 1. Estrutura: os eixos. A escala devolvida converte valores em pixels.
    const e = c.eixos({
      x: 90, y: 50, largura: 560, altura: 290,
      dominioX: [0.1, 2], dominioY: [70, 150],
      marcasX: [{ v: 0.1, texto: '0,1' }, { v: 0.5, texto: '0,5' }, 1, { v: 1.5, texto: '1,5' }, 2],
      marcasY: [70, 90, 110, 130, 150],
      rotuloX: 'distância (km)', rotuloY: 'perda (dB)',
      atraso: c.depois(0),
    });

    // 2. As duas curvas. A da cidade é a principal: tinta e traço contínuo.
    //    A do espaço livre é a referência: cor e tracejado, os dois sinais juntos.
    c.curva(e.amostrar(urbano), { peso: 'forte', atraso: c.depois(0.9) });
    c.curva(e.amostrar(espacoLivre), { cor: 'verde', tracejado: true, atraso: c.depois(0.5) });

    // 3. Rótulos direto nas curvas, e a anotação que diz o que olhar.
    const t = c.depois(0.4);
    c.texto(e.x(1.2), e.y(urbano(1.2)) - 14, 'cidade', { ancora: 'end', forte: true, atraso: t });
    c.texto(e.x(1.45), e.y(espacoLivre(1.45)) + 30, 'espaço livre', { cor: 'verde', atraso: t });

    // a diferença entre as duas a 2 km, marcada com uma seta dupla
    const x2 = e.x(2) + 22;
    c.seta(x2, e.y(urbano(2)) + 4, x2, e.y(espacoLivre(2)) - 4, { dupla: true, ponta: 8, atraso: c.depois(0.5) });
    c.texto(x2 + 12, e.y((urbano(2) + espacoLivre(2)) / 2) - 6, ['35 dB', 'a mais'], { atraso: c.depois(0.2) });
  },
};
