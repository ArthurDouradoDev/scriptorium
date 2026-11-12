---
track: conhecimento
type: decisao
module: exportacao
summary: Exporta HTML de arquivo único e PDF; todo componente precisa de um estado impresso estático
tags: [exportacao, pdf, html, impressao]
applies_when: [criar componente, criar figura, mexer nas fontes ou nas imagens]
created: 2026-11-12
---

# Exportação: HTML de arquivo único e PDF

Uma página ou um livro inteiro sai em dois formatos:

- **HTML de arquivo único:** CSS, scripts, fontes e imagens embutidos. Abre sem internet e sem servidor, e mantém tema, animações e simulações.
- **PDF:** o mesmo HTML impresso pelo Chromium do Playwright, com CSS de impressão.

É por aqui que o conteúdo privado é compartilhado no trabalho sem ser publicado.

## O que isso exige do resto do código

- **Estado impresso em todo componente.** Animação e simulação não existem no papel. Figura: desenho completo. Simulação: valores iniciais com as leituras, sem controles. O kit caneta já faz isso com `data-estado="impresso"` e `@media print`.
- **Fontes como pacote do projeto,** não por link do Google Fonts, para poderem ser embutidas.
- **Imagens comprimidas** antes de embutir, porque em base64 elas incham o arquivo.
- **Livro inteiro:** a rota `/livros/<livro>/completo` concatena os capítulos e alimenta as duas exportações. O `livro.yaml` é a fonte única da ordem para o site, o HTML e o PDF.

## Limite conhecido

O Chromium não preenche número de página em links internos por CSS. O sumário com número de página no PDF depende do Paged.js, a validar na fase f10 do plano `v1-motor`.

## Alternativa descartada

Quarto gera site, livro e PDF nativamente, mas o visual sob medida e as simulações interativas dariam mais trabalho nele. Só valeria se o PDF fosse o produto principal.
