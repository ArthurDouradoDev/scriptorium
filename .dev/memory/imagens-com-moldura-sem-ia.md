---
track: conhecimento
type: decisao
module: imagens
summary: Imagem recebe moldura e tratamento por CSS; nunca é redesenhada por IA; diagrama de terceiros vira figura do kit
tags: [imagens, visual, ia]
applies_when: [inserir foto ou captura de tela, criar o componente Imagem, pedir imagem a uma IA]
created: 2026-11-12
---

# Imagens: moldura, tratamento por CSS e nada de IA

| Tipo | Tratamento |
|---|---|
| Foto (antena, equipamento, site) | `tratamento="tinta"`: tons de cinza tingidos com a cor da tinta, por filtro CSS |
| Captura de tela ou gráfico de ferramenta | fiel ao original; se a página mostrar em cinza, o original abre com um clique |
| Diagrama de outra fonte | redesenhar como figura do kit caneta, em vez de colar a imagem |
| Mapa de cobertura colorido | original, porque a cor é a informação |

## Por que sem IA

Um filtro que redesenha a imagem pode alterar detalhe técnico, inventar rótulos e mudar valores. Numa captura de medição isso é inaceitável, e enfraquece a transparência entre artesanal e IA. O tratamento por CSS é determinístico, reversível e não altera o arquivo.

## Moldura

Linha fina na cor da tinta, com o mesmo tremor do kit, e margem interna, como algo colado num caderno. Sem sombra e sem canto arredondado. No tema escuro a imagem ganha leve redução de brilho, para uma captura de fundo branco não ofuscar.

## Campos obrigatórios

`alt` sempre; `credito` quando `origem="terceiros"`. Antes de publicar imagem de terceiros, conferir se a licença permite.
