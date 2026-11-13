/* Exemplo completo de ilustração: a grade de um bloco de recursos do LTE.
   Mostra: grade com linhas finas e bordas reforçadas, hachura para destacar,
   texto girado, anotação com seta e a ordem de entrada (estrutura, destaque, explicação). */

const X = 120, Y = 36;          // canto de cima à esquerda da grade
const CW = 48, CH = 26;         // largura e altura de um quadradinho
const COLUNAS = 7, LINHAS = 12; // 7 símbolos por 12 subportadoras

export default {
  tipo: 'ilustracao',
  largura: 780,
  altura: 400,
  semente: 11,
  alt: 'Grade de um bloco de recursos com 12 subportadoras e 7 símbolos. Quatro elementos estão hachurados: são os sinais de referência.',
  origem: {
    autoria: 'ia',
    pedido: 'Mostrar onde ficam os sinais de referência dentro de um bloco de recursos do LTE.',
    validacao: 'Posições conferidas com a 3GPP TS 36.211 para uma porta de antena: símbolos 0 e 4, subportadoras 0 e 6, 3 e 9.',
  },

  desenhar(c) {
    // 1. Estrutura: a grade. Bordas com traço normal e duplo; linhas internas finas e simples.
    for (let k = 0; k <= COLUNAS; k++) {
      const borda = k === 0 || k === COLUNAS;
      c.linha(X + k * CW, Y, X + k * CW, Y + LINHAS * CH, { atraso: c.depois(0.05), peso: borda ? undefined : 'fino', simples: !borda });
    }
    for (let k = 0; k <= LINHAS; k++) {
      const borda = k === 0 || k === LINHAS;
      c.linha(X, Y + k * CH, X + COLUNAS * CW, Y + k * CH, { atraso: c.depois(0.05), peso: borda ? undefined : 'fino', simples: !borda });
    }

    // 2. Destaque: os quatro elementos de referência, hachurados e contornados.
    const referencias = [[0, 0], [0, 6], [4, 3], [4, 9]]; // [símbolo, subportadora]
    referencias.forEach(([simbolo, sub]) => {
      const x = X + simbolo * CW, y = Y + (LINHAS - 1 - sub) * CH; // subportadora 0 fica embaixo
      const t = c.depois(0.12);
      c.hachura(x + 2, y + 2, CW - 4, CH - 4, { atraso: t });
      c.caixa(x, y, CW, CH, { atraso: t });
    });

    // 3. Explicação: medidas dos eixos e as duas anotações, por último.
    const t = c.depois(0.4);
    c.texto(X, 388, '7 símbolos = 0,5 ms', { atraso: t });
    c.texto(60, 300, '12 subportadoras = 180 kHz', { girar: -90, atraso: t });
    c.anotacao(500, 92, ['sinal de referência:', 'potência fixa e conhecida'], [366, 118], { atraso: c.depois(0.5) });
    c.anotacao(500, 262, ['o resto: dados e controle,', 'varia com o tráfego'], [436, 240], { atraso: c.depois(0.4), curva: -14 });
  },
};
