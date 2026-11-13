import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  caminhoDaPaginaPorUrl,
  proximoNumeroFigura,
  renderizarFiguraImpressa,
  resolverArquivoPagina,
} from '../src/caneta/figura';
import type { Figura } from '../src/caneta/caneta.js';
import type { Raiz } from '../src/conteudo/raizes';

const RAIZ_EXEMPLO: Raiz[] = [{ nome: 'exemplo', caminho: '/repo/conteudo/exemplo', privada: false }];

describe('resolverArquivoPagina', () => {
  it('encontra figura existente na pasta da página', () => {
    const chaveEsperada = '/conteudo/exemplo/livros/guia-de-rf/onda-e-espectro/figuras/grade-rb.js';
    const mapa = { [chaveEsperada]: () => Promise.resolve({ default: {} }) };

    const encontrado = resolverArquivoPagina({
      tipo: 'figuras',
      arquivo: 'grade-rb.js',
      pagina: '/livros/guia-de-rf/onda-e-espectro/',
      mapa,
      raizes: RAIZ_EXEMPLO,
    });

    expect(encontrado.chave).toBe(chaveEsperada);
  });

  it('produz erro com o caminho esperado quando a figura não existe', () => {
    expect(() =>
      resolverArquivoPagina({
        tipo: 'figuras',
        arquivo: 'nao-existe.js',
        pagina: 'livros/guia-de-rf/onda-e-espectro',
        mapa: {},
        raizes: RAIZ_EXEMPLO,
      }),
    ).toThrow(/conteudo\/exemplo\/livros\/guia-de-rf\/onda-e-espectro\/figuras\/nao-existe\.js/);
  });

  it('produz erro com o caminho esperado quando a imagem não existe', () => {
    expect(() =>
      resolverArquivoPagina({
        tipo: 'imagens',
        arquivo: 'ausente.png',
        pagina: 'blog/meu-post',
        mapa: {},
        raizes: RAIZ_EXEMPLO,
      }),
    ).toThrow(/conteudo\/exemplo\/blog\/meu-post\/imagens\/ausente\.png/);
  });
});

describe('proximoNumeroFigura', () => {
  it('numera as figuras na ordem em que aparecem na página', () => {
    const paginaA: Record<string | symbol, unknown> = {};
    expect(proximoNumeroFigura(paginaA)).toBe(1);
    expect(proximoNumeroFigura(paginaA)).toBe(2);
    expect(proximoNumeroFigura(paginaA)).toBe(3);

    const paginaB: Record<string | symbol, unknown> = {};
    expect(proximoNumeroFigura(paginaB)).toBe(1);
  });
});

describe('caminhoDaPaginaPorUrl', () => {
  it('remove barras iniciais e finais', () => {
    expect(caminhoDaPaginaPorUrl('/livros/guia-de-rf/onda-e-espectro/')).toBe(
      'livros/guia-de-rf/onda-e-espectro',
    );
    expect(caminhoDaPaginaPorUrl('/blog/por-que-desenhar-para-entender')).toBe(
      'blog/por-que-desenhar-para-entender',
    );
  });
});

describe('renderizarFiguraImpressa', () => {
  it('pré-renderiza ilustração no estado impresso com SVG completo', async () => {
    const caminho = path.resolve(
      process.cwd(),
      'conteudo/exemplo/livros/guia-de-rf/onda-e-espectro/figuras/grade-rb.js',
    );
    const mod = (await import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync(caminho, 'utf8')).toString('base64')}`)) as {
      default: Figura;
    };

    const { classes, htmlInterno } = renderizarFiguraImpressa(mod.default);
    expect(classes).toContain('caneta');
    expect(classes).toContain('tinta');
    expect(htmlInterno).toContain('<svg');
    expect(htmlInterno).toContain('viewBox="0 0 780 400"');
  });

  it('pré-renderiza simulação no estado impresso com leituras iniciais', async () => {
    const caminho = path.resolve(
      process.cwd(),
      'conteudo/exemplo/livros/guia-de-rf/onda-e-espectro/figuras/duas-torres.js',
    );
    const mod = (await import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync(caminho, 'utf8')).toString('base64')}`)) as {
      default: Figura;
    };

    const { classes, htmlInterno } = renderizarFiguraImpressa(mod.default);
    expect(classes).toContain('caneta');
    expect(classes).toContain('caneta-sim');
    expect(htmlInterno).toContain('class="leituras"');
    expect(htmlInterno).toContain('class="veredito"');
  });
});
