---
track: conhecimento
type: decisao
module: editorial
summary: Artesanal e IA são separados por etapa (commits) e por artefato (origem), nunca por frase
tags: [editorial, historico, ia, git]
applies_when: [revisar texto com IA, criar figura ou imagem, mexer no histórico da página]
created: 2026-11-12
---

# Autoria por etapa e por artefato

O leitor vê como cada página foi feita. Depois que a IA revisa um parágrafo, a autoria de cada frase fica misturada, então marcação por frase seria ficção. O que se sustenta:

## Por etapa

- Campo `etapa` no frontmatter: `anotacao` → `rascunho` → `revisao-ia` → `aprovado`.
- `anotacao` é privada e nunca é publicada. O histórico público começa no `rascunho`.
- **O texto escrito à mão é commitado antes de a IA tocar nele.** Sem esse commit não existe diff honesto entre o rascunho e a revisão. `npm run registrar` faz o commit na raiz de conteúdo certa.
- Commit feito com IA carrega o trailer `Co-Authored-By` do modelo. O histórico marca "com IA" por esse trailer e "à mão" na ausência dele.
- A aprovação final é sempre um commit humano que muda `etapa` para `aprovado`.

## Por artefato

- Figura: campo `origem` no arquivo, com `autoria` (`ia`, `humano` ou `misto`), `pedido` (o que foi pedido, em uma frase) e `validacao` (como os números e o desenho foram conferidos).
- Imagem: `origem` (`propria`, `terceiros` ou `ia`) e `credito`.

## Onde aparece

- `src/conteudo/historico.ts` lê `git log --follow` da raiz de conteúdo no build.
- O editor não controla a mensagem do commit; por isso a etapa é um campo da página e não um marcador no commit.
- A skill `revisao-editorial` segue esta regra.
