---
name: flashcards
description: Gera flashcards a partir de uma página do livro ou do blog, ou de um trecho escolhido, e grava no bloco Flashcards do MDX para exportação ao Anki. Use quando pedirem flashcards de um capítulo, cards de um trecho, "transforme isto em card" ou para completar os cards de uma página.
---

# Flashcards da página

Os cards moram dentro da própria página, num bloco `<Flashcards>` no fim do `index.mdx`. O build exporta esse bloco para um arquivo que o Anki importa. Não há revisão no site.

Há dois modos. Descubra qual foi pedido:

- **Página inteira:** "gere os flashcards do capítulo X". Siga todos os passos.
- **Trecho:** o autor aponta uma frase, um parágrafo ou uma seção ("faça um card disto"). Faça de 1 a 3 cards só daquele trecho e vá direto ao passo 3.

## 1. Leia a página e liste o que merece card

Leia o `index.mdx` inteiro, incluindo os cards que já existem. Fontes, da melhor para a pior:

1. `<Resumo>`: cada item costuma ser um card.
2. `<Termo>`: uma definição por termo.
3. `<Nota>` e as frases com números-chave (limites, faixas, constantes).
4. `<Confira>`: as perguntas viram cards de raciocínio.
5. `<ComoValidar>`: cada conferência vira um card "como saber se ... está errado?".
6. A lista "três coisas para tentar" de uma simulação: causa e efeito.
7. `testes` do arquivo de figura de uma simulação: fatos já validados.

Quantidade: de 8 a 15 cards para um capítulo, de 4 a 8 para um post. Menos cards bons valem mais que muitos fracos.

## 2. Escreva cada card

Formato:

```mdx
<Flashcards>
  <Flashcard frente="O que o RSRP mede, e em que unidade?" verso="A potência média recebida em um elemento de recurso que leva sinal de referência, em dBm." />
  <Flashcard frente="Por que o RSRQ de uma célula isolada e cheia vale −10,8 dB?">
    Os 12 elementos do bloco têm potência, então o RSSI do bloco vale 12 × RSRP. A razão é 1/12, que em dB dá −10,8.
  </Flashcard>
</Flashcards>
```

Use a forma curta (`verso="..."`) para resposta de uma frase, e a forma com conteúdo para resposta com mais de uma frase, lista ou fórmula.

Regras de um bom card:

- **Uma ideia por card.** Se o verso tem "e também", são dois cards.
- **A frente é uma pergunta completa,** que faz sentido sozinha, daqui a seis meses, fora da página. Inclua o contexto: "No LTE, ...".
- **Uma resposta certa só.** Nada de "fale sobre o RSRQ". Pergunte "o que", "por que", "quanto", "o que acontece com X quando Y".
- **Verso curto:** até 25 palavras na forma curta, até 3 frases na longa.
- **Prefira o porquê ao decoreba.** Para cada número importante, um card com o valor e outro com a razão do valor.
- **Misture os tipos:** definição, valor e unidade, causa e efeito, comparação ("diferença entre RSRP e RSSI"), diagnóstico ("RSRP bom e RSRQ ruim indica o quê?"), validação.
- **Sem lista para decorar.** Uma lista de 5 itens vira 5 cards, ou um card sobre o critério que une a lista.
- **Sem pegadinha e sem negativa dupla.**
- **Só o que está na página.** Não acrescente fato novo. Se a página deixa uma lacuna, avise o autor em vez de preencher.
- Mesmas convenções do texto: vírgula decimal, sinal `−`, unidade sempre.
- Aspas duplas dentro de `frente` ou `verso` quebram o atributo: use «aspas angulares» ou a forma com conteúdo.

## 3. Grave no bloco

- O bloco `<Flashcards>` é o último elemento do arquivo. Se não existe, crie. Se existe, acrescente dentro dele.
- **Não mude a `frente` de um card existente.** O identificador do card no Anki vem da página e da frente: mudar a frente cria um card novo e deixa o antigo órfão no baralho do autor. Para corrigir uma frente, avise o autor desse efeito.
- Mudar o `verso` é seguro: o card é atualizado na próxima importação.
- Não repita card que já existe, nem com outras palavras.
- Ordem: a mesma em que os assuntos aparecem na página.

## 4. Confira

Releia cada card fazendo três perguntas:

1. Lendo só a frente, eu sei exatamente o que está sendo perguntado?
2. O verso está na página, com esses mesmos números?
3. Dá para errar este card? (Se a resposta é óbvia pela própria pergunta, apague.)

Se o projeto já tem `package.json`, rode `npm run build`. Se o script existir, rode `npm run flashcards` e confira que o arquivo da página foi gerado em `dist-flashcards/` com o número certo de cards. (O componente e o script nascem na fase f8 do plano `v1-motor`; antes disso, só grave o bloco.)

## 5. Entregue

Não commite. Responda com:

- quantos cards foram criados e a lista das frentes;
- os cards que você decidiu **não** fazer e por quê (lacuna na página, fato não conferido);
- o lembrete: cards gerados por IA entram no histórico da página como mudança "com IA" quando forem commitados.

## Relação com a skill `anki-flashcards`

Esta skill grava os cards **na página**, para versionar com o texto e exportar por arquivo. Se o autor pedir para mandar cards direto para o Anki aberto, avaliar a qualidade de um baralho ou fundir cards duplicados, use a skill `anki-flashcards`, se estiver disponível.
