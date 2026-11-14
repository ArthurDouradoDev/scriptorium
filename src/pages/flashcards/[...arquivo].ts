import type { APIRoute } from 'astro';
import { coletarExportacoesFlashcards } from '../../conteudo/flashcards';

export async function getStaticPaths() {
  const exportacoes = coletarExportacoesFlashcards();
  return exportacoes.map((exp) => ({
    params: { arquivo: exp.caminhoRelativo },
    props: { conteudo: exp.conteudo },
  }));
}

export const GET: APIRoute = ({ props }) => {
  return new Response(props.conteudo, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
