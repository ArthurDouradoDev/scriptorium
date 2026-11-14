# scriptorium

Motor de uma biblioteca pessoal de estudo: livros com capítulos e um blog, escritos em MDX e publicados com Astro.

## Rodar

```bash
npm install
npm run dev
```

O site abre em `http://127.0.0.1:4321`. `npm run build` gera o site estático em `dist/`.

## Exportação (HTML e PDF)

Depois de rodar `npm run build`, é possível exportar páginas avulsas ou livros completos para `dist-export/`:

- HTML de arquivo único: `npm run exportar:html -- <rota>` ou `--tudo`
- PDF em A4: `npm run exportar:pdf -- <rota>` ou `--tudo`

A exportação em PDF usa o Chromium do Playwright. Na primeira vez (ou após atualizar o Playwright), instale o navegador com:

```bash
npx playwright install chromium
```

## Editor local

Com o `npm run dev` rodando, abra `http://127.0.0.1:4321/editor` (que redireciona para `/keystatic`). O editor grava os mesmos `index.mdx` que o site lê; não há login nem servidor. Ele só existe no modo de desenvolvimento: o build não leva a rota.

O menu lateral tem, para cada raiz de conteúdo (`exemplo`, `publico`, `privado`), os capítulos de cada livro, o sumário de cada livro e o blog. Livro novo (pasta com `livro.yaml`) aparece depois de reiniciar o `npm run dev`.

### Criar uma página

1. Clique no livro ou em **Blog** e depois em **Adicionar**.
2. Preencha título, resumo e etapa na coluna da direita. O **Nome da pasta** vira o endereço da página.
3. Escreva o texto. O botão **+** e a tecla `/` inserem os blocos: nota, figura, imagem, quadro, seções fixas e flashcards.
4. Clique em **Criar**.
5. Capítulo novo: abra o **sumário** do livro e acrescente o capítulo a uma parte. Sem isso o build acusa capítulo órfão.

### Inserir uma figura já gerada

A figura é um arquivo `figuras/<nome>.js` na pasta da página, gerado pelas skills `ilustracao-caneta` ou `simulacao-caneta`. No editor, insira o bloco **Figura à caneta** e escreva o nome do arquivo sem o `.js` (ex.: `grade-rb`). A prévia mostra o desenho; com legenda, a figura ganha número. Para mudar a figura de lugar, arraste o bloco.

### Imagens

O bloco **Imagem** envia o arquivo para `imagens/` na pasta da página. Texto alternativo é obrigatório; crédito, para imagem de terceiros.

### Formato dos arquivos

O editor reescreve o arquivo no formato dele: listas com `*`, tabelas alinhadas, atributos dos componentes numa linha só. Página escrita à mão muda de formato no primeiro salvamento; commite essa mudança separada da edição. Para a página abrir no editor, componente com conteúdo fica em linhas próprias, sem HTML cru e sem comentários `{/* */}`. `npm test` confere que todas as páginas abrem.
