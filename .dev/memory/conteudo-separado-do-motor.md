---
track: conhecimento
type: decisao
module: conteudo
summary: Conteúdo fica em conteudo/exemplo, conteudo/publico e conteudo/privado; só exemplo é versionado no motor
tags: [conteudo, privado, repositorios]
applies_when: [criar ou mover página, mexer no build ou no deploy, configurar o editor]
created: 2026-11-12
---

# Conteúdo separado do motor

O rf_guide é o motor (layout, componentes, kit de figuras, skills, exportação). O conteúdo fica em três raízes dentro de `conteudo/`:

- `conteudo/exemplo/`: versionada neste repositório. É o que quem clona vê funcionando.
- `conteudo/publico/`: outro repositório, clonado nesta pasta. Vai para o site.
- `conteudo/privado/`: pasta local ou repositório privado. Anotações de aula e material interno do trabalho.

`publico` e `privado` estão no `.gitignore` do motor.

## Por quê

- O histórico editorial de cada página é lido do git da raiz de conteúdo, sem commits do motor no meio.
- O build público não inclui a raiz privada. Ela só entra no `npm run dev` ou com `CONTEUDO_PRIVADO=1`.
- O material do trabalho cita sistemas internos e não pode ir para um site pessoal. Ele é compartilhado por HTML de arquivo único ou PDF.
- As raízes ficam dentro da pasta do projeto, e não ao lado, para o Vite, o loader de conteúdo e o editor enxergarem os arquivos sem configuração de acesso a pastas externas.

## Formato dentro de cada raiz

- `livros/<livro>/livro.yaml` e `livros/<livro>/<capitulo>/index.mdx`
- `blog/<slug>/index.mdx`
- uma pasta por página, com `figuras/` e `imagens/` ao lado do texto

Página com `etapa: anotacao` é tratada como privada em qualquer raiz.
