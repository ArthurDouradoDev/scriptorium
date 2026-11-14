# scriptorium

Motor de uma biblioteca pessoal de estudo e treinamento: livros com capítulos e um blog, publicados como página web e exportáveis em HTML de arquivo único e PDF. Começa com conteúdo de RF (radiofrequência) e vai expandir para outros assuntos. Stack: Astro + MDX + TypeScript, com npm.

## Comandos

O `package.json` ainda não existe; ao criá-lo, mantenha estes scripts:

- Rodar: `npm run dev`
- Build: `npm run build`
- Checar tipos: `npx astro check`

## Contexto do projeto

- O conteúdo é escrito em português.
- RF é só o primeiro assunto: a estrutura de conteúdo e de navegação precisa aceitar outros assuntos sem retrabalho.
- Visual minimalista. Tema claro: branco com azul escuro. Tema escuro: preto com branco. Todo componente funciona nos dois temas.
- Ilustrações animadas e simulações têm aparência de desenho à caneta Bic. Não mude essa identidade visual nem as cores dos temas sem pedido explícito.
- A página usa só duas cores. Dentro de figuras existe uma paleta fixa (vermelha, verde e âmbar, em `src/estilos/tokens.css`), sempre acompanhada de traço ou rótulo próprio. Nenhum outro arquivo escreve cor.
- Toda figura é um arquivo `figuras/<nome>.js` desenhado pela API de `src/caneta/caneta.js`. Nada de SVG à mão.
- O conteúdo fica em `conteudo/exemplo` (versionado aqui), `conteudo/publico` e `conteudo/privado` (repositórios à parte, ignorados pelo git deste). Arquivos de conteúdo não têm `import`. Material do trabalho vai em `privado`.
- O leitor vê como cada página foi feita: o texto do autor é commitado antes de a IA tocar nele, e commit com IA leva o trailer `Co-Authored-By`.
- Skills do projeto em `.claude/skills/`: `ilustracao-caneta`, `simulacao-caneta`, `pagina-de-estudo`, `revisao-editorial` e `flashcards`. Use a skill em vez de improvisar o formato.
- Commits: Conventional Commits em português (`feat: adiciona capítulo de antenas`). Branches: `tipo/descricao`.
- Desenvolvimento em Windows 11: o Bash do Git for Windows falha nesta máquina; rode os comandos no PowerShell.

## Como trabalhar

- **Pense antes de codar.** Declare as suposições; se o pedido admite leituras diferentes, apresente-as em vez de escolher uma em silêncio.
- **Simplicidade primeiro.** Faça só o que foi pedido: nenhuma abstração de uso único, nenhuma configuração que ninguém pediu.
- **Mudanças cirúrgicas.** Siga o estilo do código ao redor, deixe o código vizinho como está e remova só o que a sua mudança deixou órfão. Cada linha alterada deve rastrear até o pedido.
- **Verifique pelo objetivo.** Transforme a tarefa num critério verificável (um teste que reproduz o erro e depois passa) e rode a verificação antes de dizer que terminou.

## Memória do projeto

- `.dev/memory/` e `.dev/errors/`: aprendizados do projeto com frontmatter (module, tags); relevantes ao implementar ou depurar áreas documentadas. `builderdev recall <termos>` busca neles.
- `.dev/plans/`: planos por fase, com o status derivado dos commits. `builderdev brief` mostra a fase ativa.

## Fluxo de fases

- Ao começar uma fase do plano: `builderdev start <plano>/<fase>`; `builderdev status` lista as fases e o que está liberado.
- Uma fase termina em um commit só, e esse commit a marca como concluída. Commit de outra coisa com fase ativa: `builderdev stop` antes.
- Antes de commitar, rode o `verify` da fase e apresente o checklist de `### Validação visual`, junto com as notas do commit; commite depois da confirmação.
- Notas do commit da fase: até três linhas de até 200 caracteres, escritas por você a partir da sessão: `Feito:` (o que foi feito), `Desvios:` (o que mudou em relação ao plano) e `Pendente:` (o que ficou para depois). Omita a que não se aplica.
- Mensagem do commit: o `commit_msg` da fase e, em outro `-m`, as linhas de nota, uma por linha. O trailer `Plan-Step` entra pelo git hook, depois delas; sem o hook instalado (`builderdev hooks install`), acrescente `Plan-Step: <plano>/<fase>` à mão.
- Mudança pequena que fecha uma ideia sem plano: trailer `Closes-Idea: <slug>`.

## Ao compactar

Preserve no resumo: a fase ativa (plano e id), os arquivos modificados nesta sessão, os comandos de teste e de verificação da fase e os erros ainda não resolvidos.
