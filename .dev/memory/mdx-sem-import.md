---
track: conhecimento
type: convencao
module: conteudo
summary: Arquivos de conteúdo (MDX e figuras) não têm import; o motor injeta componentes e a API de desenho
tags: [conteudo, mdx, figuras]
applies_when: [escrever página MDX, criar figura, criar componente novo]
created: 2026-11-12
---

# Conteúdo sem `import`

Nenhum arquivo dentro de `conteudo/` tem a palavra `import`.

- **MDX:** usa `<Figura>`, `<Nota>`, `<Flashcard>` etc. direto. O motor passa o mapa de componentes de `src/componentes/mdx.ts` ao renderizar.
- **Figura (`figuras/<nome>.js`):** exporta um objeto com `export default`. A API de desenho chega como o parâmetro `c`; as funções de matemática e formatação chegam como o parâmetro `m`.

## Por quê

- O conteúdo mora em outro repositório. Um caminho de `import` quebraria a cada mudança de pasta no motor.
- O editor (Keystatic) grava MDX limpo e não sabe manter linhas de `import`.
- O script `conferir.mjs` das skills carrega a figura no Node sem resolver módulos.
- Um modelo simples erra menos quando o arquivo tem uma forma só.

Componente novo: criar em `src/componentes/`, registrar em `mdx.ts` e declarar no `keystatic.config.ts`.
