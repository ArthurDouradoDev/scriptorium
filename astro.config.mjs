// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import YAML from 'yaml';

/* O editor local (Keystatic, em /keystatic) só existe no `npm run dev`: o build não leva a rota. */
const emDev = process.argv.includes('dev');

/** Raízes de conteúdo e livros de cada uma, para as coleções do editor (src/editor/estrutura.ts). */
function conteudoDoEditor() {
  return ['exemplo', 'publico', 'privado']
    .filter((raiz) => fs.existsSync(path.join('conteudo', raiz)))
    .map((raiz) => {
      const pastaLivros = path.join('conteudo', raiz, 'livros');
      const livros = fs.existsSync(pastaLivros)
        ? fs
            .readdirSync(pastaLivros, { withFileTypes: true })
            .filter((d) => d.isDirectory() && fs.existsSync(path.join(pastaLivros, d.name, 'livro.yaml')))
            .map((d) => {
              const yaml = YAML.parse(fs.readFileSync(path.join(pastaLivros, d.name, 'livro.yaml'), 'utf8'));
              return { id: d.name, titulo: yaml?.titulo ?? d.name };
            })
        : [];
      return { raiz, livros };
    });
}

export default defineConfig({
  integrations: emDev ? [mdx(), react(), keystatic()] : [mdx()],
  vite: emDev ? { define: { __CONTEUDO_EDITOR__: JSON.stringify(conteudoDoEditor()) } } : {},
});
