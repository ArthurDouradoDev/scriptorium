import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function uso() {
  console.error('Uso: npm run registrar -- <pasta-da-pagina> "<assunto>"');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) uso();

const [entradaCaminho, ...restoAssunto] = args;
const assunto = restoAssunto.join(' ').trim();
if (!entradaCaminho || !assunto) uso();

const absEntrada = path.resolve(entradaCaminho);
const pastaBruta =
  absEntrada.endsWith('.mdx') || absEntrada.endsWith('.md') ? path.dirname(absEntrada) : absEntrada;

if (!fs.existsSync(pastaBruta) || !fs.statSync(pastaBruta).isDirectory()) {
  console.error(`Pasta da página não encontrada: ${pastaBruta}`);
  process.exit(1);
}
const pastaPagina = fs.realpathSync.native(pastaBruta);

function encontrarRaizGit(pasta) {
  const posix = pasta.replace(/\\/g, '/');
  const partes = posix.split('/');
  const idx = partes.lastIndexOf('conteudo');
  if (idx !== -1 && idx + 1 < partes.length) {
    const raiz = partes[idx + 1];
    if (raiz === 'publico' || raiz === 'privado') {
      const raizDir = partes.slice(0, idx + 2).join('/');
      if (!fs.existsSync(path.join(raizDir, '.git'))) {
        return null;
      }
    }
  }

  try {
    const topo = execFileSync('git', ['-C', pasta, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    return fs.realpathSync.native(topo);
  } catch {
    return null;
  }
}

const gitRoot = encontrarRaizGit(pastaPagina);
if (!gitRoot) {
  console.error(`A raiz de conteúdo de "${pastaPagina}" não é um repositório git.`);
  process.exit(1);
}

const relPasta = path.relative(gitRoot, pastaPagina).replace(/\\/g, '/') || '.';
const slug = path.basename(pastaPagina);

const status = execFileSync('git', ['-C', gitRoot, 'status', '--short', '--', relPasta], {
  encoding: 'utf8',
}).trim();

if (!status) {
  console.log(`Nenhuma mudança pendente em ${relPasta}.`);
  process.exit(0);
}

execFileSync('git', ['-C', gitRoot, 'add', '--', relPasta], { stdio: 'inherit' });

const mensagem = `conteudo(${slug}): ${assunto}`;
execFileSync('git', ['-C', gitRoot, 'commit', '-m', mensagem], { stdio: 'inherit' });
