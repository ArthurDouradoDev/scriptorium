import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import {
  exportarRota,
  nomeArquivoSaida,
  transformarParaArquivoUnico,
} from '../scripts/exportar-html.mjs';

const pastasTemporarias: string[] = [];

function criarPastaTemp(prefixo: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
  pastasTemporarias.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of pastasTemporarias.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function verificarReferenciasExternas(html: string) {
  /* 1. Nenhum atributo src="..." pode usar http://, https:// ou caminho absoluto /. */
  const srcs = [...html.matchAll(/\bsrc=(["'])([^"']+)\1/gi)].map((m) => m[2]);
  for (const src of srcs) {
    expect(src).not.toMatch(/^(https?:\/\/|\/)/i);
  }

  /* 2. Nenhuma folha de estilo externa com href http://, https:// ou /. */
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  for (const link of links) {
    if (!/\brel=(["'])stylesheet\1/i.test(link)) continue;
    const hrefMatch = link.match(/\bhref=(["'])([^"']+)\1/i);
    if (hrefMatch) {
      expect(hrefMatch[2]).not.toMatch(/^(https?:\/\/|\/)/i);
    }
  }

  /* 3. Nenhum url(...) em CSS com http://, https:// ou caminho absoluto /. */
  const urlsCss = [...html.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi)].map((m) => m[2]);
  for (const u of urlsCss) {
    expect(u).not.toMatch(/^(https?:\/\/|\/)/i);
  }
}

function verificarAncorasDoSumario(html: string) {
  const matchSumario = html.match(/<section\b[^>]*id=(["'])sumario\1[^>]*>([\s\S]*?)<\/section>/i);
  expect(matchSumario).not.toBeNull();
  const blocoSumario = matchSumario![2];

  const ids = new Set([...html.matchAll(/\bid=(["'])([^"']+)\1/gi)].map((m) => m[2]));
  const hrefs = [...blocoSumario.matchAll(/\bhref=(["'])#([^"']+)\1/gi)].map((m) => m[2]);

  expect(hrefs.length).toBeGreaterThan(0);
  for (const ancora of hrefs) {
    expect(ids.has(ancora)).toBe(true);
  }
}

describe('exportar-html', () => {
  it('embute CSS, fonte, imagem redimensionada (<= 1600 px) e reescreve links de capítulos', async () => {
    const distDir = criarPastaTemp('rf-guide-dist-');
    fs.mkdirSync(path.join(distDir, '_astro'), { recursive: true });
    fs.mkdirSync(path.join(distDir, 'livros', 'teste', 'completo'), { recursive: true });

    /* Fonte mínima fictícia e CSS referenciando-a. */
    fs.writeFileSync(path.join(distDir, '_astro', 'fonte-latin.woff2'), Buffer.from('WOFF2DATA'));
    fs.writeFileSync(
      path.join(distDir, '_astro', 'estilo.css'),
      `@font-face{font-family:Caveat;src:url(/_astro/fonte-latin.woff2)format("woff2"),url(/_astro/fonte-latin.woff)format("woff")}body{color:var(--ink)}`,
    );

    /* Imagem larga (> 1600 px) para confirmar redimensionamento. */
    const imgGrande = await sharp({
      create: { width: 2200, height: 400, channels: 3, background: { r: 15, g: 33, b: 103 } },
    })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(distDir, '_astro', 'foto.png'), imgGrande);

    const htmlEntrada = `<!doctype html><html><head>
      <link rel="stylesheet" href="/_astro/estilo.css">
    </head><body>
      <section id="sumario">
        <a href="/livros/teste/cap1/">Capítulo 1</a>
        <a href="#cap-cap1">Ir</a>
      </section>
      <article id="cap-cap1">
        <img src="/_astro/foto.png" alt="Teste">
      </article>
    </body></html>`;

    const saida = await transformarParaArquivoUnico(htmlEntrada, 'livros/teste/completo', distDir);

    verificarReferenciasExternas(saida);
    verificarAncorasDoSumario(saida);
    expect(saida).toContain('data:font/woff2;base64,');
    expect(saida).not.toContain('fonte-latin.woff"');
    expect(saida).toContain('href="#cap-cap1"');

    const imgMatch = saida.match(/src="(data:image\/webp;base64,([^"]+))"/);
    expect(imgMatch).not.toBeNull();
    const meta = await sharp(Buffer.from(imgMatch![2], 'base64')).metadata();
    expect(meta.width).toBe(1600);
  });

  it('gera nomes de saída sem colisão em dist-export/', () => {
    expect(nomeArquivoSaida('/livros/guia-de-rf/completo/')).toBe('guia-de-rf-completo.html');
    expect(nomeArquivoSaida('/livros/guia-de-rf/rsrp-e-rsrq/')).toBe('guia-de-rf-rsrp-e-rsrq.html');
    expect(nomeArquivoSaida('/blog/por-que-desenhar-para-entender/')).toBe(
      'blog-por-que-desenhar-para-entender.html',
    );
  });

  it('recusa exportar página privada sem CONTEUDO_PRIVADO=1 e permite com a variável', async () => {
    const pastaPrivada = path.join(process.cwd(), 'conteudo', 'privado', 'blog', '__teste-export-privado');
    const distDir = criarPastaTemp('rf-guide-dist-priv-');
    const exportDir = criarPastaTemp('rf-guide-exp-priv-');

    try {
      fs.mkdirSync(pastaPrivada, { recursive: true });
      fs.writeFileSync(
        path.join(pastaPrivada, 'index.mdx'),
        '---\ntitulo: Privado\nresumo: Teste\netapa: rascunho\n---\n\nTexto secreto.\n',
      );
      fs.mkdirSync(path.join(distDir, 'blog', '__teste-export-privado'), { recursive: true });
      fs.writeFileSync(
        path.join(distDir, 'blog', '__teste-export-privado', 'index.html'),
        '<!doctype html><html><body><p>Texto secreto.</p></body></html>',
      );

      await expect(
        exportarRota('/blog/__teste-export-privado', { distDir, exportDir, env: {} }),
      ).rejects.toThrow(/CONTEUDO_PRIVADO=1/);

      const ok = await exportarRota('/blog/__teste-export-privado', {
        distDir,
        exportDir,
        env: { CONTEUDO_PRIVADO: '1' },
      });
      expect(ok.privada).toBe(true);
      expect(fs.existsSync(ok.caminhoSaida)).toBe(true);
    } finally {
      fs.rmSync(pastaPrivada, { recursive: true, force: true });
    }
  });

  it('valida o livro completo e a aula de exemplo em dist/ quando o build já foi gerado', async () => {
    const distDir = path.join(process.cwd(), 'dist');
    const completoDist = path.join(distDir, 'livros', 'guia-de-rf', 'completo', 'index.html');
    const aulaDist = path.join(distDir, 'livros', 'guia-de-rf', 'rsrp-e-rsrq', 'index.html');
    if (!fs.existsSync(completoDist) || !fs.existsSync(aulaDist)) {
      return;
    }

    const exportDir = criarPastaTemp('rf-guide-exp-real-');
    const resCompleto = await exportarRota('/livros/guia-de-rf/completo', { distDir, exportDir });
    const htmlCompleto = fs.readFileSync(resCompleto.caminhoSaida, 'utf8');
    verificarReferenciasExternas(htmlCompleto);
    verificarAncorasDoSumario(htmlCompleto);

    const resAula = await exportarRota('/livros/guia-de-rf/rsrp-e-rsrq', { distDir, exportDir });
    const htmlAula = fs.readFileSync(resAula.caminhoSaida, 'utf8');
    verificarReferenciasExternas(htmlAula);
    expect(htmlAula).toContain('__caneta.montar');
    expect(htmlAula).toContain('grade-rb.js');
    expect(htmlAula).toContain('duas-torres.js');
  });
});
