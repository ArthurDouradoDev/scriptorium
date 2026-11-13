---
track: conhecimento
type: decisao
module: editor
summary: O editor é o Keystatic em modo local, sem login nem servidor; alternativa se o teste falhar é o TinaCMS
tags: [editor, keystatic, conteudo]
applies_when: [configurar o editor, criar componente novo, pensar em edição online]
created: 2026-11-12
---

# Editor: Keystatic em modo local

Quem tem o repositório roda `npm run dev` e escreve em `/keystatic`, sem mexer em código. O editor grava os mesmos arquivos MDX das raízes de conteúdo.

## Alternativas descartadas

- **Editor próprio dentro do site:** exigiria login, backend de escrita, compilação de MDX no navegador e integração com a API do GitHub. Custaria mais que o resto do sistema.
- **Ghost:** melhor experiência de escrita, mas guarda o conteúdo em banco de dados. Perderia o histórico pelo git, o conteúdo privado local e os componentes de figura.
- **Decap e Sveltia:** fracos com componentes dentro do texto.
- **Plataforma com cadastro de autores:** fora do objetivo. O editor é para quem clona o repositório.

## Consequências

- Cada componente de `src/componentes/mdx.ts` precisa ser declarado no `keystatic.config.ts`, com formulário.
- Reposicionar figura: arrastar o bloco no texto, e o campo `largura` (`texto` ou `larga`). Mexer dentro do desenho é trabalho das skills.
- O editor não gera figuras nem chama IA. As skills geram no Claude Code e o autor insere o bloco pelo menu.
- Cada bloco tem prévia própria em `src/editor/blocos.tsx` (a figura à caneta é montada de verdade); o editor usa só as cores de `tokens.css`.

## Validado na f6

Testado com `@keystatic/core` 0.6.9: arquivo salvo sem `import`, bloco arrastado de lugar, imagem enviada cai em `imagens/`. O diff fica mínimo porque o conteúdo de exemplo está no formato que o editor grava; página escrita à mão muda de formato no primeiro salvamento. `tests/editor.test.ts` garante que toda página abre no editor. Detalhes em `.dev/errors/keystatic-mdx-inline-e-imagens.md`.
