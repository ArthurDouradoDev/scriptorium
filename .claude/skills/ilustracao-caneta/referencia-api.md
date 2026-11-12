# API da caneta

Fonte: `src/caneta/caneta.js`. Mudou o kit, atualize este arquivo no mesmo commit.

Coordenadas em pixels da área da figura: `(0, 0)` é o canto de cima à esquerda, `y` cresce para baixo. Quase todos os métodos devolvem `c`, então dá para encadear: `c.linha(...).linha(...)`.

## Opções comuns (`o`)

| Opção | Valores | Efeito |
|---|---|---|
| `atraso` | segundos | quando o traço começa a se desenhar. Sem ela, aparece pronto |
| `peso` | `'fino'`, `'forte'` | espessura. Sem ela, normal |
| `cor` | `'vermelha'`, `'verde'`, `'ambar'`, `'apagada'` | sem ela, tinta do tema. `'apagada'` é a tinta enfraquecida, para texto secundário |
| `tracejado` | `true` | traço pontilhado |
| `simples` | `true` | risca uma vez só (o padrão é duas, como quem reforça) |
| `tremor` | número, padrão 1,4 | quanto a mão treme. Use 0,4 a 0,8 em peças pequenas |

## Desenho

| Método | O que faz |
|---|---|
| `c.linha(x1, y1, x2, y2, o)` | linha reta |
| `c.caixa(x, y, largura, altura, o)` | retângulo. `preencher: true` cobre o que está atrás |
| `c.circulo(cx, cy, raio, o)` | círculo à mão. `preencher: true` idem |
| `c.elipse(cx, cy, rx, ry, o)` | elipse |
| `c.curva([[x, y], ...], o)` | curva suave pelos pontos. `reta: true` liga com segmentos |
| `c.hachura(x, y, largura, altura, o)` | riscos diagonais. `espaco` (padrão 4; menor é mais escuro), `cruzada: true` |
| `c.seta(x1, y1, x2, y2, o)` | seta. `curva: 18` entorta (sinal troca o lado), `dupla: true`, `ponta` (tamanho, padrão 11) |
| `c.texto(x, y, 'texto', o)` | texto manuscrito; `y` é a linha de base. Lista ou `\n` para várias linhas (24 px entre elas). Opções: `ancora: 'start' \| 'middle' \| 'end'`, `forte: true`, `tamanho: 'pequeno' \| 'grande'`, `girar: -90` |
| `c.anotacao(x, y, linhas, [alvoX, alvoY], o)` | texto em `(x, y)` com seta curva até o alvo |
| `c.caminho(d, o)` | caminho SVG cru. Último recurso: o `conferir.mjs` não confere os limites dele |

## Gráficos

```js
const e = c.eixos({
  x: 90, y: 50, largura: 560, altura: 290,       // retângulo do gráfico
  dominioX: [0.1, 2], dominioY: [70, 150],        // valores nas pontas dos eixos
  marcasX: [1, 2, { v: 0.5, texto: '0,5' }],      // número, ou { v, texto } para escrever com vírgula
  marcasY: [70, 110, 150],
  rotuloX: 'distância (km)', rotuloY: 'perda (dB)',
  atraso: c.depois(0),
});
e.x(1.2)            // valor → pixel horizontal
e.y(128)            // valor → pixel vertical
e.ponto(1.2, 128)   // → [x, y]
e.amostrar(fn)      // → pontos de fn(x) em todo o domínio, prontos para c.curva()
```

Deixe 90 px à esquerda e 70 px embaixo do retângulo para as marcas e os rótulos.

## Movimento contínuo

| Método | O que faz |
|---|---|
| `c.viajar('M236 112H698', o)` | um envelope percorre o caminho sem parar. `forma: 'ponto'`, `duracao` (s, padrão 3,4), `inicio: -1.7` defasa |
| `c.ondas(cx, cy, o)` | anéis que se expandem. `n`, `raioMax`, `periodo` (ms), `recorte: [x, y, largura, altura]`, `intensidade: () => 0 a 1` |
| `c.aCadaQuadro((t) => ...)` | função chamada a cada quadro, com o tempo em ms |

Os três param sozinhos no impresso e com "reduzir movimento" ligado.

## Tempo, semente e camadas

| Método | O que faz |
|---|---|
| `c.depois(0.2)` | avança o relógio da animação e devolve o instante. Uso: `{ atraso: c.depois(0.2) }` |
| `c.agora()` | instante atual, sem avançar. Para dois elementos entrarem juntos |
| `c.semente(n)` | troca a semente do tremor |
| `c.camada()` | nova camada por cima; `camada.limpar()` apaga só ela |
| `c.largura`, `c.altura` | tamanho da área |

## Matemática e formatação (`m`)

Segundo parâmetro de `desenhar(c, m)` e de `modelo(v, m)`.

| Função | O que faz |
|---|---|
| `m.db(x)` | razão linear → dB |
| `m.lin(x)` | dB → razão linear |
| `m.limitar(x, a, b)` | prende `x` entre `a` e `b` |
| `m.mapear(x, a, b, c, d)` | leva `x` de `[a, b]` para `[c, d]` |
| `m.fmt(v, casas)` | número com vírgula decimal e sinal `−`: `m.fmt(-86.83)` → `'−86,8'` |
| `m.pct(x, casas)` | fração → porcentagem: `m.pct(0.274, 1)` → `'27,4%'` |
