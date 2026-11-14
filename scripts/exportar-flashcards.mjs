import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* Permite importar módulos TypeScript com caminhos relativos sem extensão (ex.: `./raizes`) direto no Node. */
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !path.extname(specifier) && context.parentURL) {
      const parentPath = fileURLToPath(context.parentURL);
      const candidatoTs = path.resolve(path.dirname(parentPath), `${specifier}.ts`);
      if (fs.existsSync(candidatoTs)) {
        return nextResolve(`${specifier}.ts`, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const { coletarExportacoesFlashcards } = await import('../src/conteudo/flashcards.ts');
const { incluirPrivado } = await import('../src/conteudo/raizes.ts');

const pastaSaida = path.resolve(process.cwd(), 'dist-flashcards');
fs.rmSync(pastaSaida, { recursive: true, force: true });
fs.mkdirSync(pastaSaida, { recursive: true });

const exportacoes = coletarExportacoesFlashcards();

for (const exp of exportacoes) {
  const destino = path.join(pastaSaida, exp.caminhoRelativo);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, exp.conteudo, 'utf8');
}

const comPrivado = incluirPrivado();
console.log(`Exportados ${exportacoes.length} arquivo(s) para dist-flashcards/${comPrivado ? ' (incluindo conteúdo privado)' : ''}:`);
for (const exp of exportacoes) {
  console.log(`  - ${exp.caminhoRelativo} (${exp.quantidade} ${exp.quantidade === 1 ? 'card' : 'cards'} · baralho "${exp.baralho}")`);
}
