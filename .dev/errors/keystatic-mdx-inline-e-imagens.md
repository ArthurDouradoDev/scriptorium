---
track: erros
type: erro
module: editor
summary: Keystatic só abre componente com conteúdo escrito em linhas próprias, não aceita HTML cru e guarda os arquivos do campo de texto numa pasta com o nome do campo
tags: [editor, keystatic, mdx, imagens]
applies_when: [configurar o editor, escrever página com componentes, usar Imagem no Keystatic, criar componente novo]
created: 2026-11-13
---

# Keystatic: página que não abre e imagem que some

Achado no teste da fase `f6` do plano `v1-motor` (`@keystatic/core` 0.6.9, `@keystatic/astro` 6.0.0).

## Sintomas

1. A aula `rsrp-e-rsrq` não abria: `mdxJsxTextElement has unexpected children` (4 vezes) e `Missing component definition for p` (2 vezes).
2. Ao salvar `onda-e-espectro`, o `<Imagem>` perdia o atributo `arquivo`.

## Causas

1. **Não era o `<Termo>`.** Declarado como `mark`, ele abre bem. Os erros vinham dos 4 `<Caso titulo="...">texto</Caso>` escritos numa linha só (o MDX lê como elemento inline com texto, e um bloco do Keystatic exige parágrafos dentro) e dos 2 `<p class="pequeno">` (HTML cru não tem bloco correspondente).
2. O Keystatic procura e grava os arquivos do campo de texto numa subpasta com o **nome do campo**. Com o campo chamado `conteudo`, ele procurava `conteudo/antena.png`, não achava e apagava o atributo.

## Correção

- Componente com conteúdo fica com a abertura, o conteúdo e o fechamento em linhas próprias.
- `<p class="pequeno">` virou o componente `<Pequeno>`.
- O campo de texto se chama `imagens` em `keystatic.config.ts`: assim o editor lê e grava em `imagens/`, a pasta que o site já usa.
- Globo de pasta com dois níveis (`livros/*/*/`) não funciona: há uma coleção por livro (`livros/<livro>/*/`).
- O editor reescreve o arquivo no formato dele (listas com `*`, tabelas alinhadas, atributos numa linha, YAML do js-yaml). O conteúdo de exemplo foi normalizado nesse formato, e `tests/editor.test.ts` confere que toda página abre e que as de exemplo voltam idênticas.

O TinaCMS não precisou ser avaliado.
