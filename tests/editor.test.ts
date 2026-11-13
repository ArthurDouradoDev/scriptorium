import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { blocos } from '../src/editor/blocos';

/* O campo mdx do editor usa o build de navegador do Keystatic; o de Node só lê. */
const urlKeystatic = pathToFileURL(path.resolve('node_modules/@keystatic/core/dist/keystatic-core.js')).href;
const { fields } = (await import(urlKeystatic)) as typeof import('@keystatic/core');
const campo = fields.mdx({ label: 'Texto', components: blocos, options: { heading: [2, 3], image: false } });

function paginas(raiz: string): string[] {
  const base = path.resolve('conteudo', raiz);
  if (!fs.existsSync(base)) return [];
  const achadas: string[] = [];
  for (const [pasta, profundidade] of [['livros', 2], ['blog', 1]] as const) {
    let nivel = [path.join(base, pasta)].filter((p) => fs.existsSync(p));
    for (let i = 0; i < profundidade; i++) {
      nivel = nivel.flatMap((p) =>
        fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => path.join(p, d.name)),
      );
    }
    achadas.push(...nivel.map((p) => path.join(p, 'index.mdx')).filter((p) => fs.existsSync(p)));
  }
  return achadas;
}

/** Abre o corpo no editor e grava de novo, como o Keystatic faz ao salvar. */
function abrirESalvar(arquivo: string) {
  const corpo = fs.readFileSync(arquivo, 'utf8').replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '');
  const pastaImagens = path.join(path.dirname(arquivo), 'imagens');
  const imagens = new Map(
    fs.existsSync(pastaImagens)
      ? fs.readdirSync(pastaImagens).map((nome) => [nome, new Uint8Array(fs.readFileSync(path.join(pastaImagens, nome)))])
      : [],
  );
  const estado = campo.parse(undefined, {
    content: new TextEncoder().encode(corpo),
    other: imagens,
    external: new Map(),
    slug: undefined,
  });
  const gravado = campo.serialize(estado, { slug: undefined });
  return { corpo, gravado: new TextDecoder().decode(gravado.content), imagens: gravado.other };
}

const nome = (arquivo: string) => path.relative(path.resolve('conteudo'), arquivo).replace(/\\/g, '/');

describe('editor local', () => {
  const todas = ['exemplo', 'publico', 'privado'].flatMap(paginas);

  it.each(todas.map((a) => [nome(a), a]))('abre %s sem erro', (_, arquivo) => {
    expect(() => abrirESalvar(arquivo)).not.toThrow();
  });

  it.each(paginas('exemplo').map((a) => [nome(a), a]))('%s volta idêntica depois de salva', (_, arquivo) => {
    const { corpo, gravado } = abrirESalvar(arquivo);
    expect(gravado).toBe(corpo);
  });

  it('mantém o arquivo da Imagem e grava a imagem de volta em imagens/', () => {
    const arquivo = path.resolve('conteudo/exemplo/livros/guia-de-rf/onda-e-espectro/index.mdx');
    const { gravado, imagens } = abrirESalvar(arquivo);
    expect(gravado).toContain('arquivo="antena.png"');
    expect(gravado).toContain('arquivo="espectro.png"');
    expect([...imagens.keys()].sort()).toEqual(['antena.png', 'espectro.png']);
  });
});
