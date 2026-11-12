---
track: conhecimento
type: decisao
module: visual
summary: Página em duas cores; vermelho, verde e âmbar só dentro de figuras, sempre com traço ou rótulo próprio
tags: [paleta, temas, figuras, acessibilidade]
applies_when: [criar ou revisar figura, criar componente, mexer em tokens.css]
created: 2026-11-12
---

# Paleta de figuras

A página é monocromática: `--bg` e `--ink` (branco com azul escuro no tema claro, preto com branco no escuro). Texto, títulos, navegação e molduras usam só essas duas.

Dentro de ilustrações e simulações existem mais três cores, definidas em `src/estilos/tokens.css` com um valor por tema:

- `--caneta-vermelha`
- `--caneta-verde`
- `--caneta-ambar`

Na API do kit elas são `cor: 'vermelha' | 'verde' | 'ambar'`. Nenhum arquivo de figura escreve cor em hexadecimal, `rgb()` ou nome CSS; o `conferir.mjs` das skills acusa.

## Regras de uso

- A tinta é o padrão. A paleta entra a partir da terceira categoria na mesma figura.
- Cor nunca é o único sinal: toda série colorida também tem traço próprio (contínuo, tracejado, hachura) ou rótulo direto. Vale para daltônicos, impressão em cinza e PDF.
- Cor vai em linha, hachura e texto. Não há área chapada colorida.
- O significado de cada cor é fixo dentro de um livro e fica em `cores` do `livro.yaml`. No Guia de RF: tinta é a célula servidora, vermelha é interferência, âmbar é ruído.
- As variáveis têm nome de cor, não de significado, para o motor não carregar vocabulário de RF.

## Limites

- Dado contínuo (mapa de calor) não usa a paleta: entra como imagem original com moldura.
- Os valores em `tokens.css` são provisórios até a validação visual da fase f1 do plano `v1-motor` (contraste mínimo de 4,5:1 com o fundo nos dois temas e distinção em simulação de daltonismo).
