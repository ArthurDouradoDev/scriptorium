---
track: conhecimento
type: decisao
module: flashcards
summary: Flashcards moram no MDX da página e saem em arquivo de importação do Anki; não há revisão no site
tags: [flashcards, anki, exportacao]
applies_when: [gerar flashcards, criar o componente Flashcard, mexer na exportação]
created: 2026-11-12
---

# Flashcards: só exportação

- Os cards ficam num bloco `<Flashcards>` no fim do MDX da página, um `<Flashcard frente="..." verso="..." />` por card. Assim são versionados junto com o texto e aparecem no histórico editorial.
- O build gera um arquivo de texto por página e um por livro, no formato de importação do Anki, com baralho `<Livro>::<Capítulo>`.
- Cada card tem identificador estável (hash de página e frente). Reimportar atualiza o card em vez de duplicar. Mudar a frente cria um card novo.
- No site, o bloco aparece recolhido, com a contagem e o link do arquivo. Não há modo de revisão: isso é papel do Anki.

## Geração

A skill `flashcards` do projeto gera os cards a partir da página inteira ou de um trecho escolhido, e grava no bloco. Para avaliar a qualidade pedagógica ou mandar direto para o Anki conectado, existe a skill `anki-flashcards` do usuário.

"Selecionar um trecho e virar card" é feito no Claude Code, apontando o trecho; no site publicado exigiria backend.
