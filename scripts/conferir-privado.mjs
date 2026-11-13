import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const raizProjeto = process.cwd();
const dirPrivado = path.join(raizProjeto, 'conteudo', 'privado');
const dirBlogPrivado = path.join(dirPrivado, 'blog');
const dirSentinela = path.join(dirBlogPrivado, '_sentinela-privado');
const arquivoSentinela = path.join(dirSentinela, 'index.mdx');
const sentinela = 'SENTINELA_PRIVADO_NAO_PUBLICAR_9F8E7D';

const privadoExistia = fs.existsSync(dirPrivado);
const blogPrivadoExistia = fs.existsSync(dirBlogPrivado);

function procurarSentinela(diretorio) {
  if (!fs.existsSync(diretorio)) return null;
  for (const entrada of fs.readdirSync(diretorio, { withFileTypes: true })) {
    const caminho = path.join(diretorio, entrada.name);
    if (entrada.isDirectory()) {
      const achado = procurarSentinela(caminho);
      if (achado) return achado;
    } else if (entrada.isFile()) {
      const conteudo = fs.readFileSync(caminho, 'utf8');
      if (conteudo.includes(sentinela)) return caminho;
    }
  }
  return null;
}

try {
  fs.mkdirSync(dirSentinela, { recursive: true });
  fs.writeFileSync(
    arquivoSentinela,
    [
      '---',
      'titulo: Página sentinela privada',
      'resumo: Não deve aparecer no build público.',
      'etapa: rascunho',
      'data: 2026-11-12',
      '---',
      '',
      `Conteúdo privado de conferência: ${sentinela}`,
      '',
    ].join('\n'),
    'utf8',
  );

  const env = { ...process.env };
  delete env.CONTEUDO_PRIVADO;

  execSync('npm run build', { stdio: 'inherit', env });

  const vazou = procurarSentinela(path.join(raizProjeto, 'dist'));
  if (vazou) {
    console.error(`ERRO: sentinela privada encontrada em ${vazou}`);
    process.exitCode = 1;
  } else {
    console.log('OK: conteúdo privado não apareceu em dist/.');
  }
} finally {
  fs.rmSync(dirSentinela, { recursive: true, force: true });
  if (!blogPrivadoExistia && fs.existsSync(dirBlogPrivado) && fs.readdirSync(dirBlogPrivado).length === 0) {
    fs.rmdirSync(dirBlogPrivado);
  }
  if (!privadoExistia && fs.existsSync(dirPrivado) && fs.readdirSync(dirPrivado).length === 0) {
    fs.rmdirSync(dirPrivado);
  }
}
