# Conteúdo de exemplo

Esta pasta mostra o formato esperado em qualquer raiz de conteúdo (`exemplo`, `publico` ou `privado`).

## Estrutura

```text
<raiz>/
  livros/
    <livro>/
      livro.yaml
      <capitulo>/
        index.mdx
        figuras/      # arquivos .js desenhados com src/caneta/caneta.js
        imagens/      # fotos e capturas de tela usadas por <Imagem />
  blog/
    <slug>/
      index.mdx
      figuras/
      imagens/
```

- **`livro.yaml`:** define `titulo`, `resumo`, `partes` (cada uma com `titulo` e a lista ordenada de pastas em `capitulos`) e, opcionalmente, `cores` (significado de `vermelho`, `verde` e `ambar` nas figuras deste livro).
- **Todo capítulo existente precisa estar listado no `livro.yaml`** (e todo capítulo listado precisa existir). A ordem no `livro.yaml` define a numeração dos capítulos, o sumário e a navegação anterior/próximo.
- **Páginas sem `import`:** os arquivos `index.mdx` não importam componentes; o motor injeta todos os componentes automaticamente.

## Como promover um post do blog a capítulo de livro

1. Mova a pasta do post de `blog/<slug>/` para `livros/<livro>/<slug>/` (levando junto `index.mdx`, `figuras/` e `imagens/`).
2. Se quiser, remova o campo `data` do frontmatter de `index.mdx` (capítulos não exigem `data`).
3. Adicione `<slug>` na lista `capitulos` da parte desejada em `livros/<livro>/livro.yaml`.
