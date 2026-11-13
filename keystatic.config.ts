/* Editor local de conteúdo (Keystatic), só no `npm run dev`: abre em /keystatic.
   Grava os mesmos index.mdx que o site lê, sem import (ver .dev/memory/mdx-sem-import.md).
   O texto da página é o campo `imagens` porque o Keystatic guarda os arquivos do campo
   numa pasta com o nome dele: assim as imagens enviadas caem em imagens/, como o site espera. */
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/700.css';
import './src/estilos/tokens.css';
import './src/caneta/caneta.css';
import './src/editor/editor.css';
import { collection, config, fields, singleton } from '@keystatic/core';
import type { Collection, ComponentSchema, Singleton } from '@keystatic/core';
import { blocos } from './src/editor/blocos';
import {
  ROTULOS_RAIZ,
  chaveDoBlog,
  chaveDoLivro,
  chaveDoSumario,
  conteudoDoEditor,
} from './src/editor/estrutura';

/* Mesmos campos e na mesma ordem do schema de src/content.config.ts. */
const camposDaPagina = {
  titulo: fields.slug({
    name: { label: 'Título', validation: { isRequired: true } },
    slug: { label: 'Nome da pasta', description: 'Vira o endereço da página. Letras minúsculas e hífens.' },
  }),
  resumo: fields.text({
    label: 'Resumo',
    description: 'Subtítulo da página, também usado na lista.',
    multiline: true,
    validation: { isRequired: true },
  }),
  chamada: fields.text({ label: 'Chamada', description: 'Linha manuscrita acima do título. Ex.: aula 3' }),
  etapa: fields.select({
    label: 'Etapa',
    description: 'Páginas em anotação ficam fora do site publicado.',
    options: [
      { label: 'Anotação', value: 'anotacao' },
      { label: 'Rascunho', value: 'rascunho' },
      { label: 'Revisão com IA', value: 'revisao-ia' },
      { label: 'Aprovado', value: 'aprovado' },
    ],
    defaultValue: 'rascunho',
  }),
};

const campoTags = fields.array(fields.text({ label: 'Tag' }), {
  label: 'Tags',
  itemLabel: (props) => props.value,
});

const campoTexto = fields.mdx({
  label: 'Texto',
  components: blocos,
  options: { heading: [2, 3], image: false },
});

const collections: Record<string, Collection<Record<string, ComponentSchema>, string>> = {};
const singletons: Record<string, Singleton<Record<string, ComponentSchema>>> = {};
const navegacao: Record<string, string[]> = {};

for (const { raiz, livros } of conteudoDoEditor()) {
  const itens: string[] = [];

  for (const livro of livros) {
    const chave = chaveDoLivro(raiz, livro.id);
    collections[chave] = collection({
      label: livro.titulo,
      slugField: 'titulo',
      path: `conteudo/${raiz}/livros/${livro.id}/*/`,
      entryLayout: 'content',
      format: { contentField: 'imagens' },
      schema: { ...camposDaPagina, tags: campoTags, imagens: campoTexto },
    });

    const chaveSumario = chaveDoSumario(raiz, livro.id);
    singletons[chaveSumario] = singleton({
      label: `${livro.titulo}: sumário`,
      path: `conteudo/${raiz}/livros/${livro.id}/livro`,
      schema: {
        titulo: fields.text({ label: 'Título do livro', validation: { isRequired: true } }),
        resumo: fields.text({ label: 'Resumo', multiline: true, validation: { isRequired: true } }),
        cores: fields.object(
          {
            vermelho: fields.text({ label: 'Vermelho' }),
            verde: fields.text({ label: 'Verde' }),
            ambar: fields.text({ label: 'Âmbar' }),
          },
          { label: 'Cores das figuras', description: 'O que cada cor significa nas figuras deste livro.' },
        ),
        partes: fields.array(
          fields.object({
            titulo: fields.text({ label: 'Título da parte', validation: { isRequired: true } }),
            capitulos: fields.array(fields.relationship({ label: 'Capítulo', collection: chave }), {
              label: 'Capítulos, na ordem do livro',
              itemLabel: (props) => props.value ?? 'Escolha um capítulo',
            }),
          }),
          { label: 'Partes', itemLabel: (props) => props.fields.titulo.value },
        ),
      },
    });
    itens.push(chave, chaveSumario);
  }

  const chaveBlog = chaveDoBlog(raiz);
  collections[chaveBlog] = collection({
    label: 'Blog',
    slugField: 'titulo',
    path: `conteudo/${raiz}/blog/*/`,
    entryLayout: 'content',
    format: { contentField: 'imagens' },
    schema: {
      ...camposDaPagina,
      data: fields.date({ label: 'Data', defaultValue: { kind: 'today' }, validation: { isRequired: true } }),
      tags: campoTags,
      imagens: campoTexto,
    },
  });
  itens.push(chaveBlog);

  navegacao[ROTULOS_RAIZ[raiz] ?? raiz] = itens;
}

export default config({
  storage: { kind: 'local' },
  locale: 'pt-BR',
  ui: {
    brand: { name: 'Editor da biblioteca' },
    navigation: navegacao,
  },
  collections,
  singletons,
});
