---
track: conhecimento
type: padrao
module: figuras
summary: Toda ilustração e simulação é um arquivo figuras/<nome>.js desenhado pela API de src/caneta/caneta.js
tags: [figuras, caneta, simulacao, skills]
applies_when: [criar ou alterar figura, mudar a API do kit, criar o componente Figura]
created: 2026-11-12
---

# Kit caneta

`src/caneta/caneta.js` e `src/caneta/caneta.css` são a fonte única do traço à caneta Bic: linha riscada duas vezes, tremor lento, hachura, texto manuscrito, desenho progressivo ao entrar na tela.

## O contrato de uma figura

Um arquivo `figuras/<nome>.js`, sem `import`, com `export default { ... }`:

- comum: `tipo` (`'ilustracao'` ou `'simulacao'`), `largura`, `altura`, `alt`, `origem`;
- ilustração: `desenhar(c)`;
- simulação: `controles`, `leituras`, `modelo(v, m)`, `cenario(c)`, `atualizar(c, v, r, m)` e `testes`.

O modelo da simulação é uma função pura, separada do desenho. É isso que permite testar os números sem navegador.

## Ferramentas

- `node .claude/skills/ilustracao-caneta/scripts/conferir.mjs <arquivo ou pasta>`: roda a figura contra um DOM falso e acusa cor fora da paleta, `import`, `Math.random`, traço ou texto fora da área, textos sobrepostos, leitura não finita e teste de modelo que falha.
- `node .claude/skills/ilustracao-caneta/scripts/previa.mjs`: abre a figura nos temas claro e escuro e no estado impresso, lado a lado.

## Regras

- Nada de SVG escrito à mão nem de desenho fora da API: a identidade visual é garantida por construção.
- O kit fica em JavaScript com JSDoc, não TypeScript, porque a prévia e o `conferir.mjs` o carregam sem build.
- Mudou a API do kit: atualizar `.claude/skills/ilustracao-caneta/referencia-api.md` no mesmo commit.
- A aleatoriedade do traço vem de uma semente fixa por figura. O desenho sai igual a cada carregamento.

As skills `ilustracao-caneta` e `simulacao-caneta` ensinam o processo completo, com exemplos em `exemplos/`.
