---
name: simulacao-caneta
description: Cria ou altera uma simulação interativa com aparência de desenho à caneta Bic, em que o leitor mexe em controles e vê o desenho e os números mudarem. Use quando pedirem simulação, experimento, "mexa e veja" ou figura interativa para uma página. Para figura sem controles, use ilustracao-caneta.
---

# Simulação à caneta

Você vai escrever **um arquivo** `figuras/<nome>.js` com quatro partes: os controles, o modelo (as contas), o cenário (o que não muda) e a atualização (o que muda). O kit monta os controles deslizantes, as leituras, a legenda e o veredito.

Antes de começar, leia nesta ordem:

1. `exemplos/duas-torres.js` desta skill, inteiro. É o modelo a copiar.
2. `.claude/skills/ilustracao-caneta/SKILL.md`, seções 2 e 4 (planejamento e regras de traço, cor e texto). Valem aqui.
3. `.claude/skills/ilustracao-caneta/referencia-api.md` (métodos da caneta).

## 1. Defina a pergunta

Uma simulação responde a uma pergunta do tipo "o que acontece com Y quando eu mudo X?". Escreva:

- **A pergunta**, em uma frase.
- **Três descobertas** que o leitor deve fazer mexendo nos controles. Exemplo: "com paredes, o RSRP cai e o RSRQ quase não muda". Elas viram a lista "três coisas para tentar" no texto da página e os testes do modelo.

Se não conseguir escrever três descobertas, uma ilustração resolve melhor.

## 2. Escreva o modelo primeiro, sem desenhar nada

```js
modelo(v, m) {
  // v: valores dos controles, { id: número }
  // m: m.db, m.lin, m.limitar, m.mapear, m.fmt, m.pct
  return {
    rsrp: { valor: -86.8, nota: 'bom' },   // leitura com classificação
    rssi: -61.1,                            // leitura só com número
    veredito: 'Frase que interpreta os números para o leitor.',
    partes: { ... },                        // qualquer outro dado que o desenho precise
  };
}
```

Regras do modelo:

- **Função pura:** mesma entrada, mesma saída. Não guarda nada entre chamadas, não usa acaso nem relógio.
- **Constantes físicas no topo do arquivo, com a fonte no comentário** (norma, livro, fórmula conhecida).
- **Nunca devolve `NaN` ou `Infinity`.** Cuide de logaritmo de zero e divisão por zero nos extremos dos controles.
- **`veredito` em todos os casos:** uma frase simples que diz o que está acontecendo, como um professor ao lado. Cubra todas as combinações com uma cadeia de condições, da mais específica para a mais geral.
- **Simplificações declaradas.** O que o modelo ignora vai em `origem.validacao` e numa frase pequena sob a simulação, na página.

## 3. Escreva os testes do modelo

Pelo menos dois, de preferência um por descoberta do passo 1. Cada teste é um fato conhecido que a conta precisa reproduzir:

```js
testes: [
  { nome: 'célula cheia e sem vizinha dá RSRQ de −10,8 dB',
    valores: { pos: 0.05, cargaA: 100, cargaB: 0 },      // os demais ficam no valor inicial
    espera: (r) => Math.abs(r.rsrq.valor - -10.79) < 0.05 },
  { nome: 'o RSRP não muda com a carga',
    valores: { cargaA: 100 },
    espera: (r, m, calc) => r.rsrp.valor === calc({ cargaA: 0 }).rsrp.valor },   // calc roda o modelo com outros valores
],
```

Bons testes: valor-limite teórico, simetria, conservação (as partes somam 100%), "isto não depende daquilo". Teste que só repete a fórmula do modelo não vale.

## 4. Declare controles, leituras e legenda

```js
controles: [
  { id: 'pos', rotulo: 'Posição do celular', min: 0.05, max: 1.95, passo: 0.01, valor: 0.6,
    formato: (v, m) => m.fmt(v, 2) + ' km de A' },
  { id: 'banda', rotulo: 'Largura de banda', valor: 10,
    opcoes: [{ valor: 5, rotulo: '5 MHz' }, { valor: 10, rotulo: '10 MHz' }] },   // botões em vez de deslizante
],
leituras: [
  { id: 'rsrp', rotulo: 'RSRP da torre A', unidade: 'dBm', min: -140, max: -44 },  // min e max desenham o medidor
],
legenda: [
  { rotulo: 'torre B', amostra: 'cruzada', cor: 'vermelha', valor: (r, m) => m.pct(r.partes.vizinha, 1) },
],
```

- **Controles: de 2 a 4.** Cada um muda uma coisa só e tem nome do mundo real ("paredes no caminho", não "atenuação adicional").
- **Valor inicial:** uma situação comum e sem nada extremo, de onde qualquer movimento mostra algo.
- **`formato` sempre**, com unidade.
- **Leituras: até 3.** O `id` é a chave do resultado do modelo.
- **Amostras da legenda:** `'densa'`, `'leve'`, `'cruzada'`, `'vazia'`, `'linha'`, `'tracejada'`. Devem repetir a hachura ou o traço usado no desenho.

## 5. Desenhe em duas partes

```js
cenario(c, vivo) {
  // Desenhado UMA vez: chão, torres, eixos, rótulos fixos.
  // c.ondas e c.aCadaQuadro só podem aparecer aqui.
  // vivo() devolve { v, r } atuais, para a animação acompanhar os controles:
  c.ondas(80, 86, { intensidade: () => vivo().v.cargaA / 100 });
},
atualizar(c, v, r, m) {
  // Chamado a cada mudança de controle. A camada chega limpa: desenhe de novo
  // tudo o que depende de v ou r. Sem `atraso` aqui.
},
```

- **O desenho responde a todos os controles.** Para cada controle, algo visível muda no desenho, não só nos números.
- **Mostre a causa, não só o resultado:** além da leitura, desenhe de onde ela vem (no exemplo, a barra que mostra do que é feito o RSSI).
- **Nada sai da área em nenhum extremo.** Calcule as posições com os controles no mínimo e no máximo. Use `m.limitar` e `m.mapear`.
- **Leve:** até cerca de 300 traços por atualização. Hachura em área grande com `espaco` de 3 ou mais.

Campos do topo (`tipo: 'simulacao'`, `titulo`, `largura`, `altura`, `semente`, `alt`, `origem`) seguem o exemplo. O `alt` descreve a cena e diz o que os controles mudam.

## 6. Confira (obrigatório)

```
node .claude/skills/ilustracao-caneta/scripts/conferir.mjs <caminho/da/figura.js>
```

O script roda o modelo e o desenho com cada controle no mínimo e no máximo, e roda os testes. Corrija até `0 erros`. Sobre os avisos de "fora da escala do medidor": aceite só se o extremo for mesmo uma situação fora da faixa real, e então cubra o caso na `nota` da leitura (no exemplo, "abaixo da faixa reportada").

Depois abra a prévia (`node .claude/skills/ilustracao-caneta/scripts/previa.mjs`, endereço `http://localhost:4400/previa?f=<caminho>`) e:

1. Arraste cada controle de ponta a ponta. O desenho acompanha sem tranco e nada sai da área.
2. Reproduza as três descobertas do passo 1.
3. Leia o veredito em cada situação: ele descreve o que se vê?
4. Confira tema escuro, impresso (sem controles, com leituras) e celular.

Se você não tem como ver a tela, diga isso na resposta e peça ao autor para abrir o endereço.

## 7. Entregue

- Na página MDX: `<Figura nome="<nome>" largura="larga" />`, seguida da frase sobre as simplificações do modelo e da lista "três coisas para tentar". (O componente nasce na fase f3 do plano `v1-motor`; antes disso, só a prévia mostra a simulação.)
- Responda com: o caminho do arquivo, a pergunta, as três descobertas, o resultado do `conferir.mjs`, as simplificações do modelo e o que não pôde ser verificado.

## O que nunca fazer

- Misturar conta e desenho: `atualizar` não calcula física, `modelo` não desenha.
- Inventar constante ou fórmula sem fonte. Não sabe o valor? Pergunte ao autor.
- Pôr `c.ondas` ou `c.aCadaQuadro` dentro de `atualizar`.
- Usar `import`, `Math.random`, `document`, cor fora da paleta ou SVG à mão.
- Entregar com teste falhando ou sem testes.
