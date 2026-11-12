---
name: revisao-editorial
description: Revisa uma página do livro ou do blog com IA, preservando a voz do autor e registrando a revisão como uma etapa separada no histórico (rascunho, revisão com IA, aprovado). Use quando pedirem para revisar, melhorar, corrigir ou checar um capítulo ou post já escrito.
---

# Revisão editorial

O leitor do site vê como cada página foi feita: o que o autor escreveu à mão e o que mudou na revisão com IA. Isso só funciona se a revisão for **um commit separado**, feito **depois** de o texto do autor estar commitado. A ordem dos passos abaixo existe por causa disso. Não a troque.

## 1. Garanta que o texto do autor está commitado

A página fica numa raiz de conteúdo (`conteudo/publico`, `conteudo/privado` ou `conteudo/exemplo`). `publico` e `privado` são repositórios git próprios; `exemplo` pertence ao repositório do motor. Rode o git dentro da raiz certa:

```
git -C conteudo/<raiz> status --short -- <caminho/da/pasta-da-pagina>
```

- **Saída vazia:** o texto está commitado. Siga para o passo 2.
- **Há mudanças:** pare e peça ao autor para commitar o rascunho antes. Ofereça o comando, e só rode se ele confirmar:

  ```
  npm run registrar -- <pasta-da-pagina> "rascunho"
  ```

  Se o script ainda não existir (ele nasce na fase f7 do plano `v1-motor`), o equivalente é `git -C conteudo/<raiz> add <pasta>` e `git -C conteudo/<raiz> commit -m "conteudo(<slug>): rascunho"`, **sem** trailer de coautoria, porque este commit é só do autor.
- **A raiz não é um repositório git:** avise que a página não terá histórico e pergunte se o autor quer seguir assim.

Nunca revise por cima de texto não commitado: o rascunho original se perde e o histórico passa a mentir.

## 2. Leia tudo antes de mudar qualquer coisa

Leia a página inteira e os arquivos de `figuras/`. Anote, sem editar ainda:

- **Erros de fato:** número, unidade, fórmula, sigla, sentido de uma relação ("sobe" onde deveria ser "cai").
- **Lacunas:** passo de raciocínio que falta, termo usado antes de ser definido.
- **Clareza:** frase longa, ambígua ou com duas ideias.
- **Estrutura:** seção fora de ordem, seção fixa ausente (`NoSoftware`, `NoPrompt`, `ComoValidar`, `Resumo`, `Confira`).
- **Coerência:** texto que contradiz uma figura, uma tabela ou o resumo.

## 3. O que você pode mudar sozinho e o que precisa perguntar

| Tipo de mudança | O que fazer |
|---|---|
| Ortografia, acento, concordância, pontuação | corrija |
| Vírgula decimal, sinal `−`, unidade faltando, sigla sem extenso | corrija |
| Frase longa ou confusa | reescreva **só a frase**, mantendo o vocabulário e o tom do autor |
| Termo usado antes da definição | mova ou acrescente a definição, com as palavras do autor quando existirem |
| Erro de fato com fonte clara | corrija e registre na lista de mudanças, com a fonte |
| Erro de fato sem certeza | **não mude**. Marque `{/* CONFERIR: ... */}` e leve ao autor |
| Opinião, exemplo, analogia ou escolha de ordem do autor | **não mude**. Sugira na resposta |
| Parágrafo novo, seção nova, corte de trecho | **pergunte antes** |

Regras de voz:

- A voz é a do autor. Você tira ruído; não reescreve do seu jeito.
- Não troque palavra simples por palavra "melhor". Não acrescente adjetivo, advérbio ou frase de transição.
- Não aumente o texto. Uma revisão boa costuma deixar a página do mesmo tamanho ou menor.
- Mantenha o padrão do projeto: frases curtas, sem ponto de exclamação, sem emoji, sem "é importante notar que".
- Se mais de um terço das frases de um parágrafo mudaria, pare: isso é reescrita. Mostre a proposta ao autor antes.

## 4. Confira os fatos

Para cada número, fórmula e afirmação técnica:

1. Refaça a conta quando for conta.
2. Compare com a figura ou simulação da página. Se a página tem simulação, os `testes` do arquivo em `figuras/` são fatos já validados: o texto precisa concordar com eles.
3. Sem fonte e sem como recalcular: marque `CONFERIR`. Não "corrija" de memória.

Confira também as figuras:

```
node .claude/skills/ilustracao-caneta/scripts/conferir.mjs <pasta-da-pagina>
```

## 5. Aplique e marque a etapa

1. Faça as mudanças permitidas do passo 3.
2. No frontmatter, mude `etapa` para `revisao-ia`.
3. Se o projeto já tem `package.json`, rode `npm run build` e confirme que passa.

Nunca grave `etapa: aprovado`. A aprovação é sempre um commit do autor, feito à mão.

## 6. Mostre ao autor antes de commitar

Responda com:

1. **Mudanças feitas**, agrupadas: correções de fato (com a fonte), clareza, forma. Para cada correção de fato, o antes e o depois.
2. **Pontos para o autor decidir:** os `CONFERIR` e as sugestões que você não aplicou.
3. O comando para ver tudo: `git -C conteudo/<raiz> diff -- <pasta-da-pagina>`

Espere a confirmação.

## 7. Commite a revisão

Depois do "pode commitar", um commit só, na raiz de conteúdo, com o trailer de coautoria. É esse trailer que faz o site marcar a etapa como "com IA":

```
git -C conteudo/<raiz> add <pasta-da-pagina>
git -C conteudo/<raiz> commit -m "conteudo(<slug>): revisão com IA" -m "<uma linha por tipo de mudança>" -m "Co-Authored-By: <nome do modelo> <noreply@anthropic.com>"
```

Use no trailer o nome do modelo que fez a revisão. Não faça `push`.

Diga ao autor o próximo passo: ler o diff, ajustar o que quiser e, quando estiver satisfeito, mudar `etapa` para `aprovado` e commitar ele mesmo.

## O que nunca fazer

- Revisar texto que não está commitado.
- Juntar no mesmo commit a revisão e qualquer outra coisa (figura nova, flashcards, outra página).
- Commitar revisão sem o trailer de coautoria, ou commit do autor com ele.
- Marcar `aprovado`.
- Mover conteúdo de `privado` para `publico`.
- Corrigir fato de memória, sem fonte.
