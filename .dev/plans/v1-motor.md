---
id: v1-motor
title: Motor de livro e blog com figuras à caneta, editor, histórico editorial e exportação
branch: feat/v1-motor
created: 2026-11-12
phases:
  - id: f1
    title: Projeto Astro com layout, temas e paleta
    files:
      - package.json
      - astro.config.mjs
      - tsconfig.json
      - src/estilos/
      - src/layouts/
      - src/pages/index.astro
      - src/pages/estilo.astro
      - src/caneta/
      - prototipos/
    verify:
      - "npx astro check"
      - "npm run build"
    commit_msg: "feat: cria o projeto Astro com layout, temas e paleta"
  - id: f2
    title: Coleções de conteúdo com raízes de exemplo, pública e privada
    files:
      - src/content.config.ts
      - src/conteudo/
      - src/pages/
      - conteudo/exemplo/
      - scripts/conferir-privado.mjs
      - tests/
      - .gitignore
      - package.json
    verify:
      - "npx astro check"
      - "npm test"
      - "npm run build"
      - "node scripts/conferir-privado.mjs"
    commit_msg: "feat: lê livros e blog das raízes de conteúdo"
  - id: f3
    title: Componentes de figura e de imagem
    files:
      - src/caneta/
      - src/componentes/Figura.astro
      - src/componentes/Imagem.astro
      - src/componentes/mdx.ts
      - conteudo/exemplo/
      - .claude/skills/
      - tests/
    verify:
      - "npx astro check"
      - "npm test"
      - "node .claude/skills/ilustracao-caneta/scripts/conferir.mjs conteudo/exemplo"
      - "npm run build"
    commit_msg: "feat: monta figuras à caneta e imagens com moldura nas páginas"
  - id: f4
    title: Componentes de seção e aula completa de exemplo
    files:
      - src/componentes/
      - src/estilos/
      - conteudo/exemplo/
      - .claude/skills/pagina-de-estudo/
    verify:
      - "npx astro check"
      - "npm run build"
    commit_msg: "feat: adiciona os componentes de seção e a aula de exemplo"
  - id: f5
    title: Estrutura de livro com sumário e navegação
    files:
      - src/conteudo/livro.ts
      - src/pages/
      - src/componentes/
      - src/layouts/
      - conteudo/exemplo/
      - tests/
    verify:
      - "npx astro check"
      - "npm test"
      - "npm run build"
    commit_msg: "feat: organiza capítulos em livros com sumário e navegação"
  - id: f6
    title: Editor local com Keystatic
    needs: [f4]
    files:
      - keystatic.config.ts
      - astro.config.mjs
      - package.json
      - src/componentes/mdx.ts
      - conteudo/exemplo/
    verify:
      - "npx astro check"
      - "npm run build"
    commit_msg: "feat: adiciona o editor local de conteúdo"
  - id: f7
    title: Histórico editorial visível ao leitor
    needs: [f4]
    files:
      - src/conteudo/historico.ts
      - src/componentes/Historico.astro
      - src/componentes/Figura.astro
      - src/componentes/Imagem.astro
      - src/layouts/
      - scripts/registrar.mjs
      - tests/
      - package.json
    verify:
      - "npx astro check"
      - "npm test"
      - "npm run build"
    commit_msg: "feat: mostra o histórico editorial de cada página"
  - id: f8
    title: Flashcards exportáveis para o Anki
    needs: [f4]
    files:
      - src/componentes/Flashcard.astro
      - src/componentes/mdx.ts
      - src/conteudo/flashcards.ts
      - scripts/exportar-flashcards.mjs
      - conteudo/exemplo/
      - tests/
      - package.json
    verify:
      - "npx astro check"
      - "npm test"
      - "npm run flashcards"
    commit_msg: "feat: exporta os flashcards das páginas para o Anki"
  - id: f9
    title: Exportação em HTML de arquivo único
    needs: [f5]
    files:
      - src/pages/
      - src/estilos/impressao.css
      - scripts/exportar-html.mjs
      - tests/
      - package.json
    verify:
      - "npm test"
      - "npm run build"
      - "npm run exportar:html -- --tudo"
    commit_msg: "feat: exporta páginas e livros em HTML de arquivo único"
  - id: f10
    title: Exportação em PDF
    needs: [f9]
    files:
      - scripts/exportar-pdf.mjs
      - src/estilos/impressao.css
      - package.json
    verify:
      - "npm run build"
      - "npm run exportar:pdf -- --tudo"
    commit_msg: "feat: exporta páginas e livros em PDF"
---

# Motor de livro e blog com figuras à caneta, editor, histórico editorial e exportação

## Contexto

O rf_guide deixa de ser só um livro de RF e vira o motor de uma biblioteca pessoal: livros com capítulos e um blog, no estilo dos dois protótipos de `prototipos/`. O mesmo sistema serve ao fluxo de estudo do autor (aula, anotações, escrita, revisão com IA, figuras, flashcards) e a quem clonar o repositório para escrever o próprio material. O leitor vê como cada página foi feita: o que foi escrito à mão e o que teve IA.

## Fora do escopo

- Páginas do portfólio (apresentação pessoal, projetos). O motor entrega a página inicial, os livros e o blog; o portfólio é outro plano.
- Deploy e CI. O destino da publicação ainda não foi decidido.
- Editor hospedado com login, plataforma com cadastro de autores, newsletter e assinantes. O editor é local, para quem tem o repositório.
- Revisão de flashcards dentro do site. Os cards só são exportados.
- IA dentro do editor ou do site. A IA atua pelas skills de `.claude/skills/`, no Claude Code.
- Tratamento de imagens com IA. Imagens recebem só tratamento por CSS e moldura.
- Busca, comentários, RSS e métricas de leitura.
- Escala de cor contínua para mapas de calor. Mapas entram como imagem original com moldura.

## Restrições herdadas

- [conteudo-separado-do-motor](../memory/conteudo-separado-do-motor.md): o conteúdo vive em `conteudo/exemplo`, `conteudo/publico` e `conteudo/privado`; só `exemplo` é versionado neste repositório.
- [mdx-sem-import](../memory/mdx-sem-import.md): arquivos de conteúdo não têm `import`; o motor injeta os componentes.
- [paleta-de-figuras](../memory/paleta-de-figuras.md): a página usa duas cores; vermelho, verde e âmbar existem só dentro de figuras e sempre com um segundo sinal.
- [kit-caneta](../memory/kit-caneta.md): toda figura é um arquivo sem `import` desenhado pela API de `src/caneta/caneta.js`.
- [autoria-por-etapa-e-artefato](../memory/autoria-por-etapa-e-artefato.md): a separação entre artesanal e IA é por etapa e por artefato, nunca por frase.
- [imagens-com-moldura-sem-ia](../memory/imagens-com-moldura-sem-ia.md): imagem não é redesenhada por IA; diagrama de terceiros vira figura do kit.
- [editor-keystatic-local](../memory/editor-keystatic-local.md): o editor é o Keystatic em modo local; se o teste da f6 falhar, a alternativa é o TinaCMS.
- [exportacao-html-unico-e-pdf](../memory/exportacao-html-unico-e-pdf.md): todo componente precisa de um estado impresso estático.
- [flashcards-so-exportacao](../memory/flashcards-so-exportacao.md): flashcards moram na página e saem em arquivo de importação do Anki.

## f1 · Projeto Astro com layout, temas e paleta

### Objetivo

Criar o projeto Astro com MDX e o layout de página extraído dos protótipos: tipografia, barra do topo, botão de tema e barra de progresso. Fechar os valores da paleta de figuras olhando uma página de estilo nos dois temas.

### Escopo

#### Código

- **Projeto:** `package.json` com `"type": "module"` e os scripts `dev`, `build` e `preview`; Astro na versão estável atual, com as integrações de MDX e `@astrojs/check`; TypeScript no modo `strict`. Antes de escrever a configuração, conferir na documentação da versão instalada o nome do arquivo de coleções e a API de loaders, porque isso mudou entre versões.
- **Fontes:** Newsreader e Caveat instaladas como pacotes (`@fontsource-variable/newsreader`, `@fontsource/caveat`) em vez do link do Google Fonts. A exportação da f9 precisa das fontes no build para embuti-las.
- **`src/estilos/tokens.css`:** já existe, criado junto com as skills. Passa a ser importado pelo layout. Contém `--bg`, `--ink`, as derivadas (`--muted`, `--rule`, `--wash`), as fontes e as três cores da paleta de figuras nos dois temas.
- **`src/estilos/base.css`:** tipografia e elementos de texto dos protótipos (`h1`, `h2` com número manuscrito, parágrafo, tabela, lista, `figure`, `figcaption`, coluna de 680 px e a classe larga de 900 px).
- **`src/layouts/Pagina.astro`:** barra fixa com trilha de navegação, botão de tema e barra de progresso de leitura; cabeçalho com chamada manuscrita, título e subtítulo; rodapé. O tema segue o sistema e pode ser forçado pelo botão, com a escolha guardada em `localStorage`. Um script em linha no `<head>` aplica o tema antes da primeira pintura.
- **`src/pages/estilo.astro`:** página de estilo, fora da navegação. Mostra os elementos de texto, os três pesos de traço, as quatro hachuras e a mesma figura de teste em três versões (só tinta, com a paleta, com a paleta e traços distintos).
- **Paleta:** os valores em `tokens.css` são provisórios. Ajustar nesta fase até que, nos dois temas, cada cor tenha contraste de pelo menos 4,5:1 com o fundo e as três se distingam entre si em simulação de daltonismo (ferramentas de desenvolvedor do navegador, aba Renderização).
- **`prototipos/`:** entra no repositório como referência visual. Não é publicado.

#### Interface

- `/` mostra uma página provisória com o layout aplicado.
- `/estilo` mostra a página de estilo.

### Validação visual

- Abrir `/` e alternar o tema: fundo branco com azul escuro no claro, preto com branco no escuro, sem piscar ao recarregar.
- Comparar `/estilo` com `prototipos/aula-rsrp-rsrq.html` lado a lado: mesmos tamanhos de título, mesma largura de coluna, mesma fonte manuscrita.
- Em `/estilo`, conferir as três cores nos dois temas e com a simulação de daltonismo ligada. Aprovar ou ajustar os valores.
- Desligar a rede e recarregar: as fontes continuam as mesmas.

## f2 · Coleções de conteúdo com raízes de exemplo, pública e privada

### Objetivo

Fazer o motor ler páginas de três pastas de conteúdo: a de exemplo, que vem no repositório, a pública e a privada, que são repositórios ou pastas à parte. O conteúdo privado aparece no site local e nunca entra no build público.

### Escopo

#### Código

- **Raízes:** `conteudo/exemplo/` (versionada aqui), `conteudo/publico/` e `conteudo/privado/` (ignoradas pelo `.gitignore` deste repositório; cada uma pode ser um clone de outro repositório). Uma raiz ausente é ignorada sem erro.
- **Formato dentro de cada raiz:**
  - `livros/<livro>/livro.yaml` e `livros/<livro>/<capitulo>/index.mdx`;
  - `blog/<slug>/index.mdx`;
  - uma pasta por página, para figuras (`figuras/`) e imagens (`imagens/`) ficarem ao lado do texto.
- **`src/conteudo/raizes.ts`:** `raizesAtivas()` devolve as raízes existentes. A privada só entra quando o comando é `dev` ou quando `CONTEUDO_PRIVADO=1`. Sem `conteudo/publico`, a raiz de exemplo faz o papel de conteúdo público.
- **`src/content.config.ts`:** coleções `capitulos` e `posts`, com um loader de arquivos por raiz ativa. Frontmatter validado por schema:
  - `titulo`, `resumo`, `chamada` (opcional, a linha manuscrita acima do título);
  - `etapa`: `anotacao` | `rascunho` | `revisao-ia` | `aprovado`;
  - `data` (posts);
  - `tags` (opcional).
- **Publicação por etapa:** página com `etapa: anotacao` é tratada como privada, em qualquer raiz.
- **Rotas:** `src/pages/blog/[slug].astro` e `src/pages/livros/[livro]/[capitulo].astro` renderizam o MDX com o layout da f1 e com o mapa de componentes de `src/componentes/mdx.ts` (vazio nesta fase). O MDX de conteúdo não tem `import`.
- **Conteúdo de exemplo:** um post e um livro com dois capítulos curtos, só com texto.
- **Testes:** Vitest entra aqui, com `"test": "vitest run"` no `package.json`.
- **`scripts/conferir-privado.mjs`:** cria uma página temporária em `conteudo/privado/` com um texto sentinela, roda o build público, falha se o sentinela aparecer em `dist/` e apaga a página temporária.

#### Interface

- `/blog/<slug>` e `/livros/<livro>/<capitulo>` mostram as páginas de exemplo.

#### Testes

- `tests/raizes.test.ts`: raiz ausente é ignorada; a privada só entra em `dev` ou com a variável; `anotacao` fica fora do build público.

### Validação visual

- Abrir o post e os dois capítulos de exemplo e conferir título, chamada e texto no layout.
- Criar `conteudo/privado/blog/teste/index.mdx`, abrir no `npm run dev` e ver a página; rodar `npm run build` e confirmar que ela não está em `dist/`.

## f3 · Componentes de figura e de imagem

### Objetivo

Colocar ilustrações animadas e simulações dentro das páginas, a partir dos arquivos de figura que as skills produzem, e tratar imagens com moldura e tom de tinta. Cada componente já nasce com o estado impresso.

### Escopo

#### Código

- **Kit:** `src/caneta/caneta.js` e `src/caneta/caneta.css` já existem, criados junto com as skills, e são a fonte única do traço. Esta fase só os integra; mudança de API exige atualizar `referencia-api.md` da skill `ilustracao-caneta` no mesmo commit. O kit fica em JavaScript com JSDoc porque a prévia das skills o carrega sem build.
- **`src/componentes/Figura.astro`:** `<Figura nome="grade-rb" legenda="..." largura="texto|larga" />`.
  - Encontra `figuras/<nome>.js` na pasta da própria página com `import.meta.glob`, e falha o build com mensagem clara se o arquivo não existir.
  - Renderiza `<figure>` com a legenda numerada e monta a figura no cliente com `montar()` do kit. O script só carrega quando a figura entra na tela.
  - Sem JavaScript e na impressão, a figura aparece no estado impresso: desenho completo e, nas simulações, os valores iniciais com as leituras.
- **`src/componentes/Imagem.astro`:** `<Imagem arquivo="torre.jpg" alt="..." legenda="..." tratamento="original|tinta" origem="propria|terceiros|ia" credito="..." largura="texto|larga" />`.
  - `alt` é obrigatório; `credito` é obrigatório quando `origem="terceiros"`.
  - Moldura de linha fina na cor da tinta com o mesmo tremor do kit e margem interna; sem sombra e sem canto arredondado.
  - `tratamento="tinta"`: tons de cinza tingidos com a cor da tinta, por filtro CSS; um clique alterna para o original.
  - No tema escuro, leve redução de brilho.
  - Imagens passam pela otimização do Astro (redimensionar e comprimir).
- **`src/componentes/mdx.ts`:** registra `Figura` e `Imagem`.
- **Conteúdo de exemplo:** os dois exemplos das skills (`grade-rb` e `duas-torres`) são copiados para um capítulo de exemplo, com uma foto e uma captura de tela para o componente de imagem.
- **Skills:** trocar nas skills `ilustracao-caneta` e `simulacao-caneta` a instrução de uso provisória pela definitiva (`<Figura nome="..." />`).

#### Interface

- Figuras se desenham ao entrar na tela e tremem de leve; simulações respondem aos controles.
- Imagens aparecem com moldura; as de tratamento `tinta` alternam para o original com um clique.

#### Testes

- `tests/figura.test.ts`: nome de figura inexistente produz erro com o caminho esperado; a numeração das figuras segue a ordem na página.
- O `conferir.mjs` das skills roda sobre `conteudo/exemplo` e precisa terminar sem erros.

### Validação visual

- Abrir o capítulo de exemplo: a grade se desenha ao rolar até ela; a simulação responde aos quatro controles.
- Alternar o tema com a página aberta: figuras e molduras trocam de cor sem recarregar.
- Abrir a prévia de impressão do navegador: as figuras aparecem completas e a simulação mostra valores, sem controles.
- Ativar "reduzir movimento" no sistema: nada se move e nada fica invisível.
- Conferir a foto em `tinta` e em `original`, e a captura de tela no tema escuro.

## f4 · Componentes de seção e aula completa de exemplo

### Objetivo

Criar os blocos de texto que as páginas usam, incluindo as seções fixas sobre software, prompt e validação de IA, e portar a aula de RSRP e RSRQ do protótipo para MDX como capítulo de exemplo.

### Escopo

#### Código

- **Contrato:** `.claude/skills/pagina-de-estudo/modelo-pagina.mdx` usa todos os componentes com os nomes e atributos definitivos. Os componentes desta fase implementam exatamente o que o modelo usa; mudança de nome ou atributo exige atualizar o modelo e a skill no mesmo commit.
- **Componentes em `src/componentes/`, todos registrados em `mdx.ts`:**
  - `Termo`: termo definido, com sublinhado.
  - `Nota`: anotação manuscrita com barra lateral.
  - `Formula` e `Fracao`: expressão simples em HTML; `descricao` obrigatória, usada como `aria-label`.
  - `Quadro` e `Caso`: grade de dois por dois com título manuscrito em cada célula.
  - `Resumo`: lista "Em resumo".
  - `Confira` e `Pergunta`: perguntas com resposta recolhida.
  - `NoSoftware`: como o assunto aparece em desenvolvimento de software, computação ou RF e por que importa.
  - `NoPrompt`: como usar o conceito num pedido a uma IA; atributos `contexto` e `porque`, e o pedido como bloco de código copiável no conteúdo.
  - `ComoValidar` e `Conferir`: lista de conferências para checar o que uma IA produziu sobre o assunto; cada item tem `verificar` e `erro`.
  - `Flashcards` e `Flashcard`: nesta fase só um bloco recolhido com a contagem; a exportação é a f8.
- **Aparência das três seções fixas:** mesmo desenho em todas as páginas, com título manuscrito e moldura fina, para o leitor reconhecê-las.
- **Numeração:** os `h2` recebem o número manuscrito automaticamente; o autor não escreve números.
- **Aula de exemplo:** `conteudo/exemplo/livros/guia-de-rf/rsrp-e-rsrq/index.mdx`, a partir do `modelo-pagina.mdx`, com todo o texto do protótipo, as duas figuras e uma seção de cada um dos três blocos fixos.

#### Interface

- A aula de exemplo fica visualmente equivalente a `prototipos/aula-rsrp-rsrq.html`, com as três seções novas no fim.

### Validação visual

- Abrir a aula de exemplo e o protótipo lado a lado, nos dois temas, e comparar seção por seção.
- Conferir que `NoPrompt` tem um botão de copiar que funciona e que as três seções fixas se distinguem do texto corrido.
- Conferir a aula em largura de celular: grades viram uma coluna e nada estoura a largura.

## f5 · Estrutura de livro com sumário e navegação

### Objetivo

Dar forma de livro ao conteúdo: um arquivo define partes e ordem dos capítulos, e dele saem o sumário, a navegação entre capítulos e a numeração. O blog ganha a página de índice por data.

### Escopo

#### Código

- **`livro.yaml`:** `titulo`, `resumo`, `partes` (cada uma com `titulo` e a lista ordenada de pastas de capítulo) e `cores` (opcional: o significado de cada cor da paleta neste livro).
- **`src/conteudo/livro.ts`:** `carregarLivro(id)` cruza o `livro.yaml` com a coleção `capitulos` e devolve partes, capítulos numerados e, para cada capítulo, o anterior e o próximo. Capítulo listado e inexistente, ou existente e não listado, falha o build com o nome do arquivo.
- **Rotas:**
  - `/livros/` lista os livros;
  - `/livros/<livro>/` é o sumário, com partes, capítulos e as seções (`h2`) de cada capítulo;
  - `/blog/` lista os posts por data;
  - `/` passa a apontar para livros e blog.
- **Layout de capítulo:** trilha "Livro · Parte · Capítulo" na barra do topo, chamada "capítulo N" e rodapé com anterior e próximo. O sumário fica a um clique de qualquer capítulo.
- **Numeração de figuras** por capítulo ("Figura 3.2").
- **Convenção de cores:** quando o `livro.yaml` define `cores`, o sumário mostra a legenda do livro.
- **Promover post a capítulo:** mover a pasta para o livro e listá-la no `livro.yaml`; documentar no `README.md` do conteúdo de exemplo.

#### Testes

- `tests/livro.test.ts`: ordem e numeração; anterior e próximo nas bordas e entre partes; erro para capítulo órfão e para capítulo ausente.

### Validação visual

- Abrir `/livros/guia-de-rf/` e conferir partes, capítulos e seções.
- Navegar do primeiro ao último capítulo só pelos links de rodapé, e voltar ao sumário pela trilha.
- Trocar a ordem de dois capítulos no `livro.yaml` e ver números e navegação mudarem sem editar os capítulos.

## f6 · Editor local com Keystatic

### Objetivo

Dar a quem tem o repositório um editor de texto no navegador, para escrever e editar páginas sem mexer em código. O editor grava os mesmos arquivos MDX e permite inserir e mover figuras, imagens e blocos.

### Escopo

#### Código

- **Teste antes de tudo (meia hora):** instalar o Keystatic em modo local, apontar para `conteudo/exemplo`, editar a aula de RSRP e salvar. O teste passa se:
  - o arquivo salvo continua sem `import` e o diff mostra só o trecho editado;
  - um bloco `Figura` pode ser recortado e colado em outro ponto do texto;
  - o campo `largura` do bloco muda de `texto` para `larga`.

  Se falhar em qualquer item, parar, registrar o motivo em `.dev/errors/` e repetir o teste com o TinaCMS antes de seguir.
- **`keystatic.config.ts`:** armazenamento local; uma coleção de capítulos e uma de posts por raiz existente (`exemplo`, `publico`, `privado`); campos de frontmatter iguais ao schema da f2, com `etapa` como lista de opções.
- **Blocos de conteúdo:** cada componente de `mdx.ts` é declarado uma vez, com formulário:
  - `Figura`: `nome`, `legenda`, `largura`;
  - `Imagem`: arquivo (upload para `imagens/` da página), `alt`, `legenda`, `tratamento`, `origem`, `credito`, `largura`;
  - `Nota`, `Quadro`, `Resumo`, `Confira`, `NoSoftware`, `NoPrompt`, `ComoValidar`, `Flashcard`.
- **Só em desenvolvimento:** a rota do editor existe no `npm run dev` e não entra no build.
- **`README.md`:** como abrir o editor, criar uma página e inserir uma figura já gerada.

#### Interface

- `/keystatic` abre o editor com as coleções das raízes existentes.

### Validação visual

- Criar um post novo pelo editor, com um título, dois parágrafos, uma nota e uma imagem; abrir a página no site e conferir.
- Mover a figura da aula de exemplo duas seções abaixo, salvar e conferir que a numeração das figuras acompanha.
- Rodar `git diff` no conteúdo depois de salvar: só as linhas editadas mudaram.
- Rodar `npm run build` e confirmar que `/keystatic` não existe em `dist/`.

## f7 · Histórico editorial visível ao leitor

### Objetivo

Mostrar em cada página como ela foi feita: as etapas por que passou, quais mudanças tiveram IA e quais foram à mão, e a origem de cada figura e imagem.

### Escopo

#### Código

- **Fonte dos dados:** o git da raiz de conteúdo em que a página está (`git -C conteudo/<raiz> log --follow`), lido no build. Sem git na raiz, a página mostra só a etapa atual.
- **`src/conteudo/historico.ts`:** `historicoDaPagina(caminho)` devolve a lista de mudanças, da mais antiga para a mais nova. Para cada commit que tocou a pasta da página:
  - data e assunto do commit;
  - `etapa` do frontmatter naquele commit;
  - `comIA`: verdadeiro quando o commit tem o trailer `Co-Authored-By` de um modelo;
  - arquivos tocados, separados em texto, figuras e imagens;
  - linhas adicionadas e removidas no texto.
- **Regra que torna o histórico honesto:** o texto escrito à mão é commitado antes de a IA tocar nele. `scripts/registrar.mjs` (`npm run registrar -- <pasta-da-pagina> "<assunto>"`) faz esse commit no repositório da raiz certa, com a mensagem `conteudo(<slug>): <assunto>`. A skill `revisao-editorial` chama o script antes de revisar.
- **`src/componentes/Historico.astro`:** bloco recolhido no fim da página, "Como esta página foi feita": linha do tempo com a etapa, a marca "à mão" ou "com IA" e o tamanho da mudança. Para a passagem de `rascunho` a `revisao-ia`, mostra o diff do texto.
- **Origem por artefato:**
  - `Figura` lê o campo `origem` do arquivo da figura (`autoria`, `pedido`, `validacao`) e mostra um "como foi feita" recolhido sob a legenda;
  - `Imagem` mostra `origem` e `credito`.
- **Selo no topo da página:** etapa atual e data da última mudança.

#### Testes

- `tests/historico.test.ts`, com um repositório git temporário criado no teste: ordem das mudanças; detecção do trailer; mudança de etapa; página sem git; página renomeada.

### Validação visual

- Abrir a aula de exemplo e expandir "Como esta página foi feita": as etapas aparecem em ordem e o commit da revisão está marcado "com IA".
- Conferir o diff entre rascunho e revisão.
- Expandir "como foi feita" sob uma figura e ler pedido e validação.
- Abrir uma página de uma raiz sem git: aparece só o selo de etapa, sem erro.

## f8 · Flashcards exportáveis para o Anki

### Objetivo

Guardar os flashcards dentro da própria página e gerar, para cada página e cada livro, um arquivo que o Anki importa direto.

### Escopo

#### Código

- **`Flashcard`:** `<Flashcard frente="..." verso="..." />` e a forma com conteúdo para versos longos. Os cards ficam num bloco `<Flashcards>` no fim da página. No site, o bloco aparece recolhido, com a contagem e o link do arquivo; não há modo de revisão.
- **`src/conteudo/flashcards.ts`:** `extrairCards(arquivoMdx)` lê os cards direto do MDX. Cada card recebe um identificador estável (hash de página e frente) para o Anki atualizar em vez de duplicar.
- **`scripts/exportar-flashcards.mjs`** (`npm run flashcards`): grava em `dist-flashcards/` um arquivo `.txt` por página e um por livro, no formato de importação de texto do Anki, com os cabeçalhos `#separator:tab`, `#html:true`, `#notetype:Basic`, `#deck:<Livro>::<Capítulo>`, `#guid column:1` e `#tags column:4`.
- **Privado:** cards de páginas privadas só saem com `CONTEUDO_PRIVADO=1`.
- **Skill:** a skill `flashcards` grava o bloco na página; trocar nela a instrução provisória pela definitiva.

#### Testes

- `tests/flashcards.test.ts`: extração das duas formas do componente; identificador estável quando o verso muda; escape de tabulação e quebra de linha; cabeçalhos do arquivo.

### Validação visual

- Rodar `npm run flashcards` e importar no Anki o arquivo da aula de exemplo: os cards entram no baralho `Guia de RF::RSRP e RSRQ`.
- Mudar o verso de um card, exportar e importar de novo: o card é atualizado, não duplicado.
- Abrir a aula no site: o bloco de flashcards aparece recolhido no fim, com a contagem certa.

## f9 · Exportação em HTML de arquivo único

### Objetivo

Gerar um arquivo HTML sozinho, que abre sem internet e sem servidor, de uma página ou de um livro inteiro com sumário.

### Escopo

#### Código

- **`src/pages/livros/[livro]/completo.astro`:** o livro inteiro numa página: capa, sumário com links internos e os capítulos em ordem. Não aparece na navegação.
- **`scripts/exportar-html.mjs`** (`npm run exportar:html -- <rota>` ou `--tudo`): lê a página de `dist/` e embute CSS, scripts, fontes (só os pesos usados) e imagens em base64; reescreve os links entre capítulos para âncoras internas. Grava em `dist-export/<nome>.html`.
- **Imagens:** limite de 1600 px de largura e compressão antes de embutir; o script informa o tamanho final de cada arquivo.
- **Interatividade:** o arquivo único mantém tema, animações e simulações, porque o kit vai embutido.
- **`src/estilos/impressao.css`:** nasce aqui com o que as duas exportações compartilham (esconder barra e botões).
- **Privado:** exportar página privada exige `CONTEUDO_PRIVADO=1`, e o script avisa na saída que o arquivo contém conteúdo privado.

#### Testes

- `tests/exportar-html.test.ts`: o arquivo exportado não tem nenhuma referência `http://`, `https://` ou caminho absoluto em `src`, `href` de folha de estilo ou `url()`; os links do sumário apontam para âncoras que existem.

### Validação visual

- Exportar a aula de exemplo, copiar o arquivo para outra pasta, desligar a rede e abrir: fontes, figuras, simulação e troca de tema funcionam.
- Exportar o livro completo e navegar pelo sumário.
- Conferir o tamanho do arquivo informado pelo script.

## f10 · Exportação em PDF

### Objetivo

Gerar o PDF de uma página ou de um livro inteiro, com capa, sumário e as figuras no estado impresso.

### Escopo

#### Código

- **`scripts/exportar-pdf.mjs`** (`npm run exportar:pdf -- <rota>` ou `--tudo`): abre o HTML de arquivo único da f9 no Chromium do Playwright, força o tema claro e o estado impresso das figuras e grava `dist-export/<nome>.pdf` em A4.
- **`src/estilos/impressao.css`:** margens, quebra de página antes de cada capítulo, figura e legenda sempre juntas, títulos nunca sozinhos no fim da página, cabeçalho com o título do capítulo e rodapé com o número da página.
- **Sumário com número de página:** o Chromium não preenche números de página em links internos por CSS. Usar o Paged.js para isso; se ele quebrar o layout das figuras, o sumário do PDF sai sem números, e o motivo vai para `.dev/errors/`.
- **Simulações:** aparecem com os valores iniciais, as leituras e uma linha "versão interativa em <endereço>" quando o site tiver endereço público configurado.
- **Dependência:** Playwright entra como dependência de desenvolvimento; o `README.md` explica o `npx playwright install chromium`.

### Validação visual

- Exportar a aula de exemplo e conferir no PDF: texto e figuras vetoriais (dar zoom), nenhuma figura cortada entre páginas, simulação com valores.
- Exportar o livro completo e conferir capa, sumário e início de cada capítulo em página nova.
- Imprimir uma página em preto e branco: as séries das figuras continuam distinguíveis pelo traço.
