import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  exportarPdfRota,
  nomeArquivoPdf,
  prepararHtmlParaPdf,
} from '../scripts/exportar-pdf.mjs';

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

describe('exportar-pdf', () => {
  it('gera nomes de saída .pdf sem colisão', () => {
    expect(nomeArquivoPdf('/livros/guia-de-rf/completo/')).toBe('guia-de-rf-completo.pdf');
    expect(nomeArquivoPdf('/livros/guia-de-rf/rsrp-e-rsrq/')).toBe('guia-de-rf-rsrp-e-rsrq.pdf');
    expect(nomeArquivoPdf('/blog/por-que-desenhar-para-entender/')).toBe(
      'blog-por-que-desenhar-para-entender.pdf',
    );
  });

  it('marca figuras com data-caneta-montada="1" para preservar o estado impresso', () => {
    const html = '<div class="caneta" data-estado="impresso" data-caneta-chave="/conteudo/exemplo/a.js"></div>';
    const preparado = prepararHtmlParaPdf(html);
    expect(preparado).toContain('data-caneta-montada="1"');
    expect(preparado).toContain('data-estado="impresso"');
  });

  it('recusa exportar página privada em PDF sem CONTEUDO_PRIVADO=1', async () => {
    const pastaPrivada = path.join(process.cwd(), 'conteudo', 'privado', 'blog', '__teste-pdf-privado');
    const distDir = criarPastaTemp('rf-guide-dist-pdf-priv-');
    const exportDir = criarPastaTemp('rf-guide-exp-pdf-priv-');

    try {
      fs.mkdirSync(pastaPrivada, { recursive: true });
      fs.writeFileSync(
        path.join(pastaPrivada, 'index.mdx'),
        '---\ntitulo: Privado\nresumo: Teste\netapa: rascunho\n---\n\nTexto secreto.\n',
      );
      fs.mkdirSync(path.join(distDir, 'blog', '__teste-pdf-privado'), { recursive: true });
      fs.writeFileSync(
        path.join(distDir, 'blog', '__teste-pdf-privado', 'index.html'),
        '<!doctype html><html><body><p>Texto secreto.</p></body></html>',
      );

      await expect(
        exportarPdfRota('/blog/__teste-pdf-privado', { distDir, exportDir, env: {} }),
      ).rejects.toThrow(/CONTEUDO_PRIVADO=1/);
    } finally {
      fs.rmSync(pastaPrivada, { recursive: true, force: true });
    }
  });

  it('gera PDF válido da aula de exemplo quando dist/ existe', async () => {
    const distDir = path.join(process.cwd(), 'dist');
    const aulaDist = path.join(distDir, 'livros', 'guia-de-rf', 'rsrp-e-rsrq', 'index.html');
    if (!fs.existsSync(aulaDist)) {
      return;
    }

    const exportDir = criarPastaTemp('rf-guide-exp-pdf-real-');
    const res = await exportarPdfRota('/livros/guia-de-rf/rsrp-e-rsrq', { distDir, exportDir });
    expect(res.arquivo).toBe('guia-de-rf-rsrp-e-rsrq.pdf');
    expect(fs.existsSync(res.caminhoSaida)).toBe(true);
    const cabecalho = fs.readFileSync(res.caminhoSaida).subarray(0, 5).toString('ascii');
    expect(cabecalho).toBe('%PDF-');
  }, 20000);
});
