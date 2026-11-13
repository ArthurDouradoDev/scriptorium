import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { raizesAtivas } from './conteudo/raizes';

const etapas = z.enum(['anotacao', 'rascunho', 'revisao-ia', 'aprovado']);

const schemaBase = {
  titulo: z.string(),
  resumo: z.string(),
  chamada: z.string().optional(),
  etapa: etapas,
  tags: z.array(z.string()).optional(),
};

function criarLoader(subpasta: 'blog' | 'livros', padrao: string): Loader {
  const raizes = raizesAtivas();
  if (raizes.length === 0) {
    return {
      name: `vazio-${subpasta}`,
      load: async ({ store }) => {
        store.clear();
      },
    };
  }

  const prefixo = new RegExp(`^[^/]+/${subpasta}/`);
  return glob({
    base: './conteudo',
    pattern: raizes.map((r) => `${r.nome}/${subpasta}/${padrao}`),
    generateId: ({ entry }) =>
      entry.replace(/\\/g, '/').replace(prefixo, '').replace(/\/index\.mdx$/, ''),
  });
}

const posts = defineCollection({
  loader: criarLoader('blog', '*/index.mdx'),
  schema: z.object({
    ...schemaBase,
    data: z.coerce.date(),
  }),
});

const capitulos = defineCollection({
  loader: criarLoader('livros', '*/*/index.mdx'),
  schema: z.object(schemaBase),
});

export const collections = { posts, capitulos };
