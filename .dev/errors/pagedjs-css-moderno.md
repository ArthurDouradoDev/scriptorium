---
track: erros
type: erro
module: exportacao
summary: Paged.js 0.4.3 falha ao processar o CSS moderno do projeto (@container, color-mix, :has) e apaga o conteúdo da página; exportação PDF usa Chromium nativo sem números no sumário
tags: [exportacao, pdf, pagedjs, css]
applies_when: [mexer na exportação PDF, alterar impressao.css, tentar numerar o sumário do PDF]
created: 2026-11-14
---

# Paged.js: falha ao processar CSS moderno na exportação PDF

Achado na implementação da fase `f10` do plano `v1-motor` (`pagedjs` 0.4.3 + Playwright Chromium).

## Sintoma

Ao injetar `paged.polyfill.js` sobre o HTML de arquivo único da fase `f9`, o Paged.js lança:

`TypeError: Cannot read properties of undefined (reading 'includes') at PrintMedia.onAtMedia`

e limpa o `<body>` durante a paginação, resultando em 0 páginas e 0 `<svg>` renderizados.

## Causa

O parser CSS embutido no Paged.js 0.4.3 não reconhece regras modernas usadas pelo motor e pelo kit caneta (`@container` em `src/caneta/caneta.css`, `:has(...)` e `color-mix(in srgb, ...)` em `src/estilos/tokens.css`). Ao encontrar at-rules não suportadas no bloco de mídia, `getMediaName(node)` retorna `undefined`.

## Decisão

Conforme previsto no plano `v1-motor` (fase `f10`), a exportação PDF usa o `page.pdf()` nativo do Chromium sem Paged.js:

- O sumário do PDF sai **sem números de página** nos links internos (os links continuam navegáveis como âncoras no PDF).
- Cabeçalho (título da página/livro) e rodapé (número da página) são renderizados via `displayHeaderFooter` do Chromium.
- Figuras vetoriais (`<svg>`), estado impresso (`data-estado="impresso"`), quebras de página por capítulo e regras de `impressao.css` funcionam integralmente.
