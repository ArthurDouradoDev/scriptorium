---
name: pagina-de-estudo
description: Transforma anotações de aula, um texto cru ou um rascunho numa página MDX no estilo do projeto (capítulo de livro ou post do blog), com os componentes certos e as seções fixas sobre software, prompt e validação de IA. Use quando pedirem para transformar anotações em página, criar capítulo, criar post ou estruturar um texto no estilo do guia.
---

# Página de estudo

Você recebe um material do autor (anotações, texto cru, rascunho) e entrega um arquivo `index.mdx` pronto para o site. O modelo completo, com todos os componentes, está em [modelo-pagina.mdx](modelo-pagina.mdx): **abra e copie a estrutura dele**.

## Antes de escrever: de quem é o texto

Esta skill muda o que aparece no histórico da página, então decida primeiro em qual dos dois casos você está:

- **O autor já escreveu a prosa** (um rascunho com frases dele). Seu trabalho é **estruturar**: dividir em seções, aplicar componentes, apontar lacunas. Não reescreva as frases. Melhorar a redação é trabalho da skill `revisao-editorial`, num commit separado.
- **O autor entregou só anotações soltas** (tópicos, fragmentos, fotos de caderno). Você **redige** a prosa. Nesse caso a página nasce com IA, e isso fica registrado: avise o autor na resposta final.

Na dúvida, pergunte ao autor antes de redigir.

## 1. Onde o arquivo vai

| Destino | Caminho |
|---|---|
| Capítulo de livro | `conteudo/<raiz>/livros/<livro>/<capitulo>/index.mdx` |
| Post do blog | `conteudo/<raiz>/blog/<slug>/index.mdx` |

- `<raiz>` é `publico`, `privado` ou `exemplo`. **Material do trabalho que cita sistemas, clientes, nomes de pessoas ou dados internos vai em `privado`.** Se não souber, pergunte.
- Pasta em minúsculas com hífen, sem acento: `rsrp-e-rsrq`.
- Capítulo novo também entra na lista de `livros/<livro>/livro.yaml`, na parte e na posição certas.

## 2. Frontmatter

```yaml
---
titulo: RSRP e RSRQ
chamada: aula 3                # opcional: linha manuscrita acima do título
resumo: Duas medidas que o celular faz o tempo todo. Uma diz quão forte a célula chega. A outra diz quão limpo esse sinal está.
etapa: rascunho                # anotacao | rascunho | revisao-ia | aprovado
data: 2026-11-12               # só em posts
tags: [lte, medidas]           # opcional
---
```

- `etapa: anotacao` para material que ainda é só anotação (fica privado em qualquer raiz).
- `etapa: rascunho` para página estruturada que ainda não passou por revisão.
- Nunca grave `revisao-ia` nem `aprovado` nesta skill.

## 3. Estrutura da página

Nesta ordem. O título de cada seção é um `##`; os números são postos pelo site, não escreva.

1. **Abertura** (sem título): uma situação do dia a dia que o leitor já conhece e que tem a mesma forma do assunto. Depois, dois ou três parágrafos que dizem o que a página ensina e por que importa.
2. **Seções de conteúdo** (de 3 a 6): cada uma responde a uma pergunta. Uma ideia nova por seção.
3. **Experimente** (se houver simulação): a `<Figura>` da simulação e a lista "três coisas para tentar".
4. **Lendo junto / na prática**: como usar o que foi aprendido para decidir algo.
5. **Na prática do software** (`<NoSoftware>`).
6. **Como pedir a uma IA** (`<NoPrompt>`).
7. **Como conferir o que a IA fez** (`<ComoValidar>`).
8. **Em resumo** (`<Resumo>`): de 4 a 6 frases, uma por ideia.
9. **Confira se entendeu** (`<Confira>`): de 3 a 5 perguntas que exigem raciocínio, não memória.
10. **Flashcards** (`<Flashcards>`): deixe para a skill `flashcards`.

As seções 5, 6 e 7 são a marca do projeto. Não as omita sem o autor pedir. Se o assunto não tiver relação honesta com uma delas, diga isso ao autor em vez de inventar.

## 4. Como escrever

O tom é o de `prototipos/aula-rsrp-rsrq.html`: leia o texto dele uma vez antes da primeira página.

- **Frases curtas e diretas.** Uma ideia por frase. Sujeito, verbo, complemento.
- **Do conhecido para o novo.** Primeiro a situação concreta, depois o nome técnico.
- **Termo novo:** em `<Termo>` na primeira vez, com a definição na mesma frase. Sigla com o nome por extenso em itálico na primeira vez.
- **Número sempre com unidade** e, quando ajudar, com a faixa: "fica entre −140 e −44 dBm".
- **Vírgula decimal e sinal de menos `−`** (não hífen): `−10,8 dB`.
- **Regra prática é regra prática.** Faixas de "bom" e "ruim" levam a ressalva de que variam por operadora, fabricante ou projeto.
- **Explique o porquê do número.** Não só "o RSRQ nunca passa de −3 dB", mas a conta que leva a isso.
- **Sem enfeite:** nada de "é importante notar que", "vale ressaltar", "como veremos". Sem ponto de exclamação. Sem emoji.
- **Negrito** só para a palavra que o leitor não pode perder numa frase. No máximo um por parágrafo.

## 5. Componentes

Nenhum `import`. Use os componentes direto. Atributos e exemplos completos em [modelo-pagina.mdx](modelo-pagina.mdx).

| Quando | Componente |
|---|---|
| Definir um termo | `<Termo>RSRP</Termo>` |
| Frase de efeito, lembrete de caderno | `<Nota>` |
| Fórmula | `<Formula>` com `descricao` (a fórmula lida em voz alta) |
| Faixas de valores, comparação | tabela Markdown |
| Quatro casos (dois eixos, bom e ruim) | `<Quadro>` com quatro `<Caso>` |
| Figura ou simulação | `<Figura nome="..." legenda="..." />` |
| Foto, captura de tela | `<Imagem arquivo="..." alt="..." legenda="..." origem="..." />` |
| Resumo final | `<Resumo>` com lista |
| Pergunta com resposta escondida | `<Confira>` com `<Pergunta>` |

**Figuras:** não desenhe aqui. Para cada ponto em que um desenho ensina melhor que o texto, deixe um comentário no MDX e liste na resposta final:

```mdx
{/* FIGURA: grade de um bloco de recursos, destacando os 4 elementos de referência. Tipo: esquema. */}
```

Depois o autor pede cada figura com as skills `ilustracao-caneta` e `simulacao-caneta`. Uma página boa tem de 1 a 3 figuras; simulação, no máximo uma.

**Imagens:** `alt` sempre; `credito` quando for de terceiros; `tratamento="tinta"` para foto, `"original"` para captura de tela e mapa colorido. Nunca peça a uma IA para redesenhar uma imagem.

## 6. As três seções fixas

### `<NoSoftware>`: onde isto aparece no código

Responda a uma destas, com um caso concreto:

- Onde este conceito aparece num sistema real (um campo de banco, um parâmetro de API, um limiar num alerta, uma coluna de relatório)?
- Que erro de software acontece quando alguém não entende o conceito (somar dB como se fosse linear, comparar medidas de bandas diferentes)?
- Por que isto importa para quem automatiza ou analisa dados da área?

Dois ou três parágrafos. Se houver código, um trecho curto, de até 10 linhas.

### `<NoPrompt>`: como pedir a uma IA

Três partes, sempre:

- `contexto`: o que a IA precisa saber e normalmente não sabe (unidade, tecnologia, de onde vêm os dados, convenção da empresa).
- o **pedido**, num bloco de código, pronto para copiar e adaptar. Específico: diz a entrada, a saída esperada e as regras do domínio.
- `porque`: por que o pedido foi escrito assim, e o que dá errado no pedido vago.

### `<ComoValidar>`: como conferir o que a IA fez

De 3 a 5 conferências. Cada `<Conferir>` tem:

- `verificar`: uma ação concreta que o leitor executa (um caso de teste com resposta conhecida, um limite teórico, uma conta de cabeça, uma simetria).
- `erro`: o sinal de que a IA errou e o erro típico por trás dele.

Use os fatos da própria página. Se a página tem simulação, os `testes` do arquivo da figura são a melhor fonte: são fatos conhecidos que qualquer resposta certa reproduz.

## 7. Confira antes de entregar

- [ ] Nenhuma linha com `import`.
- [ ] Frontmatter completo, `etapa` certa.
- [ ] Todo fato técnico veio do material do autor ou de uma fonte que você cita na resposta. **Fato que você acrescentou e não pôde conferir fica marcado** com `{/* CONFERIR: ... */}` e listado na resposta.
- [ ] Nada do material privado foi parar em raiz pública.
- [ ] Todo `<Termo>` tem definição na mesma frase.
- [ ] As três seções fixas existem e têm conteúdo específico deste assunto.
- [ ] Se o projeto já tem `package.json`: `npm run build` passa.

## 8. Entregue

Não commite. Responda com:

1. O caminho do arquivo e a `etapa`.
2. Se a prosa é do autor (você só estruturou) ou foi redigida por você.
3. As figuras sugeridas, uma por linha, com o tipo.
4. Os pontos marcados com `CONFERIR`.
5. O que do material do autor ficou de fora, e por quê.

## Estado do projeto

Os componentes desta skill são criados nas fases f3 e f4 do plano `.dev/plans/v1-motor.md`, seguindo o `modelo-pagina.mdx`. Antes disso a página não renderiza no site; escreva o MDX no formato do modelo mesmo assim.
