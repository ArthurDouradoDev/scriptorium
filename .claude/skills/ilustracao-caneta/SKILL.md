---
name: ilustracao-caneta
description: Cria ou altera uma ilustração animada com aparência de desenho à caneta Bic (esquema, gráfico ou fluxo) como arquivo de figura do kit caneta. Use quando pedirem ilustração, desenho, diagrama, gráfico ou figura para uma página do livro ou do blog. Para figura com controles que o leitor mexe, use simulacao-caneta.
---

# Ilustração à caneta

Você vai escrever **um arquivo** `figuras/<nome>.js` que desenha uma figura usando a caneta `c`. O kit cuida do traço tremido, das cores dos temas, da animação de entrada e da versão impressa. Você cuida de **o que desenhar, onde e em que ordem**.

Siga os seis passos na ordem. Não pule o passo 5.

## 1. Entenda o que a figura precisa ensinar

Escreva, em uma frase, o que o leitor deve entender ao olhar a figura. Se não couber em uma frase, são duas figuras.

Escolha o tipo e abra o exemplo correspondente em `exemplos/` antes de escrever:

| Tipo | Quando | Exemplo para copiar |
|---|---|---|
| Esquema | mostrar partes de uma coisa e destacar algumas | `exemplos/grade-rb.js` |
| Gráfico | mostrar como um valor muda com outro | `exemplos/perda-por-distancia.js` |
| Fluxo | mostrar quem fala com quem e em que ordem | `exemplos/pedido-e-resposta.js` |

**Copie o exemplo mais próximo e adapte.** Não comece do zero.

## 2. Planeje no papel antes do código

Decida e anote como comentário no topo do arquivo:

- **Área:** `largura` 780 (padrão) ou 900 (figura larga); `altura` entre 260 e 440.
- **Margem:** nada a menos de 24 px das bordas.
- **Zonas:** onde fica o desenho principal e onde ficam os textos. Reserve um lado inteiro para as anotações (no exemplo da grade, o desenho ocupa x de 120 a 456 e os textos começam em x = 500).
- **Largura de texto:** cada caractere ocupa cerca de 9 px. Uma linha de 26 caracteres mede 230 px. Quebre o texto em linhas de até 28 caracteres.
- **Ordem de entrada:** 1º a estrutura, 2º o destaque, 3º a explicação.

## 3. Escreva o arquivo

Forma obrigatória (sem `import`, sem nada fora disto além de constantes e funções auxiliares):

```js
const X = 120, Y = 36;   // constantes de posição no topo, com comentário

export default {
  tipo: 'ilustracao',
  largura: 780,
  altura: 400,
  semente: 11,           // mude o número se o tremor ficar feio em algum traço
  alt: 'Frase completa que descreve a figura para quem não a vê.',
  origem: {
    autoria: 'ia',       // 'ia' quando você desenhou; 'misto' se o autor ajustou depois
    pedido: 'O que foi pedido, em uma frase.',
    validacao: 'Como os números e as posições foram conferidos, e contra qual fonte.',
  },
  desenhar(c) {
    // use só os métodos de c; veja referencia-api.md
  },
};
```

Onde gravar: na pasta `figuras/` ao lado do `index.mdx` da página (por exemplo `conteudo/exemplo/livros/guia-de-rf/rsrp-e-rsrq/figuras/grade-rb.js`). Nome em minúsculas com hífen.

A lista completa de métodos está em [referencia-api.md](referencia-api.md). Leia antes de usar um método pela primeira vez.

## 4. Regras que fazem a figura ficar boa

**Traço**
- Contorno e elemento principal: traço normal (duplo, o padrão).
- Detalhe interno, grade, textura: `{ peso: 'fino', simples: true }`.
- No máximo um elemento com `peso: 'forte'` por figura: o que o leitor deve olhar primeiro.
- Destaque área com `c.hachura`, nunca com preenchimento colorido.

**Cor**
- Sem `cor`, o traço sai na tinta do tema. Esse é o padrão: use em quase tudo.
- `cor: 'vermelha' | 'verde' | 'ambar'` só a partir da terceira categoria, ou para separar a referência do principal.
- Toda vez que usar cor, mude também o traço (`tracejado: true`, hachura diferente) ou ponha um rótulo direto. Cor nunca é o único sinal.
- Se o livro define o significado das cores no `livro.yaml`, siga. No Guia de RF: tinta é a célula servidora, vermelha é interferência, âmbar é ruído.
- Nunca escreva cor em hexadecimal, `rgb()` ou nome CSS.

**Texto**
- Português, minúsculas, frases curtas, como anotação de caderno.
- Rótulo direto no objeto ou `c.anotacao` com seta. Evite legenda separada.
- No máximo 12 textos. Passou disso, a figura está tentando ensinar coisas demais.
- Número com vírgula decimal e unidade: `'0,5 ms'`, `'180 kHz'`, `'−3 dB'` (sinal de menos `−`, não hífen).

**Animação**
- Todo traço e todo texto recebe `atraso`. Use `c.depois(passo)`, que avança o relógio e devolve o instante.
- Passos: 0,05 s entre linhas repetidas (grade), 0,1 a 0,3 s entre objetos, 0,4 a 0,6 s antes de cada bloco novo de ideia.
- O último traço começa antes de 6 s.
- Um objeto e o rótulo dele entram juntos (mesmo `atraso`, ou o texto 0,1 s depois).
- Movimento contínuo (`c.viajar`, `c.ondas`) só quando o assunto é movimento: sinal se propagando, mensagem viajando. No máximo dois por figura.

**Composição**
- Alinhe: objetos da mesma família na mesma linha de base ou na mesma coluna.
- Deixe espaço em branco. A figura deve respirar: pelo menos 30% da área vazia.
- Objeto repetido vira função auxiliar no topo do arquivo (veja `computador()` e `servidor()` no exemplo de fluxo).

## 5. Confira (obrigatório)

Rode e leia a saída inteira:

```
node .claude/skills/ilustracao-caneta/scripts/conferir.mjs <caminho/da/figura.js>
```

- `erro`: corrija e rode de novo, até dar `0 erros`. As mensagens dizem o que mover e quanto.
- `aviso`: corrija, a menos que haja motivo claro.

Depois veja a figura. Se a prévia não estiver rodando, inicie em segundo plano:

```
node .claude/skills/ilustracao-caneta/scripts/previa.mjs
```

Abra `http://localhost:4400/previa?f=<caminho/da/figura.js>`. A página mostra tema claro, tema escuro, impresso e celular, e recarrega sozinha a cada gravação. Confira nos quatro:

1. Nenhum texto encosta em traço ou em outro texto.
2. As setas das anotações apontam para o lugar certo. Se a curva passar por cima do desenho, troque o sinal de `curva`.
3. A ordem de entrada conta a história (botão "desenhar de novo").
4. No celular os textos continuam legíveis e não se sobrepõem (lá a letra fica 27% maior).
5. No impresso a figura está completa.

Se você não tem como ver a tela, diga isso na resposta final e peça ao autor para abrir o endereço.

## 6. Entregue

- Confira os fatos: toda posição, valor e rótulo que representa algo real precisa bater com uma fonte. Escreva a fonte em `origem.validacao`. Se não conferiu, escreva "não conferido" e avise o autor.
- Na página MDX, a figura entra com `<Figura nome="<nome>" legenda="..." />`. A legenda começa pelo que a figura mostra e termina com o que observar.
- Responda com: o caminho do arquivo, a frase do passo 1, o resultado do `conferir.mjs` e o que não pôde ser verificado.

## O que nunca fazer

- Escrever SVG, HTML ou CSS à mão, ou mexer em `document`.
- Usar `import`, `Math.random`, `setTimeout` ou cor fora da paleta.
- Alterar `src/caneta/caneta.js` para resolver uma figura. Se falta um método, use `c.caminho` e avise o autor.
- Entregar sem rodar o `conferir.mjs`.
