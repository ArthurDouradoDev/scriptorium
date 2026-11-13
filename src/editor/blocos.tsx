/* Blocos que o editor local oferece: um para cada componente de src/componentes/mdx.ts.
   Cada prévia (ContentView) imita o componente da página, com as classes de editor.css,
   para o texto no editor ter a cara da aula publicada. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fields } from '@keystatic/core';
import { block, inline, mark, repeating, wrapper } from '@keystatic/core/content-components';
import { aLargeSmallIcon } from '@keystar/ui/icon/icons/aLargeSmallIcon';
import { botIcon } from '@keystar/ui/icon/icons/botIcon';
import { code2Icon } from '@keystar/ui/icon/icons/code2Icon';
import { divideIcon } from '@keystar/ui/icon/icons/divideIcon';
import { grid2X2Icon } from '@keystar/ui/icon/icons/grid2X2Icon';
import { imageIcon } from '@keystar/ui/icon/icons/imageIcon';
import { layersIcon } from '@keystar/ui/icon/icons/layersIcon';
import { listChecksIcon } from '@keystar/ui/icon/icons/listChecksIcon';
import { listIcon } from '@keystar/ui/icon/icons/listIcon';
import { messageCircleQuestionIcon } from '@keystar/ui/icon/icons/messageCircleQuestionIcon';
import { notebookPenIcon } from '@keystar/ui/icon/icons/notebookPenIcon';
import { penToolIcon } from '@keystar/ui/icon/icons/penToolIcon';
import { sigmaIcon } from '@keystar/ui/icon/icons/sigmaIcon';
import { underlineIcon } from '@keystar/ui/icon/icons/underlineIcon';
import type { Figura as ArquivoFigura } from '../caneta/caneta.js';
import { pastaDaPaginaAberta } from './estrutura';

const opcoesLargura = [
  { label: 'Coluna do texto', value: 'texto' },
  { label: 'Larga', value: 'larga' },
] as const;

const campoLargura = fields.select({ label: 'Largura', options: opcoesLargura, defaultValue: 'texto' });

/* ---------- prévias ---------- */

const figuras = import.meta.glob<{ default: ArquivoFigura }>('/conteudo/**/figuras/*.js');

function Legenda({ legenda, credito }: { legenda: string; credito?: string }) {
  if (!legenda && !credito) return null;
  return (
    <figcaption className={legenda ? 'ed-legenda ed-legenda-numerada' : 'ed-legenda'}>
      {legenda} {credito && <span>{legenda ? `(${credito})` : credito}</span>}
    </figcaption>
  );
}

function PreviaFigura({ nome, legenda, largura }: { nome: string; legenda: string; largura: string }) {
  const alvo = useRef<HTMLDivElement>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    const el = alvo.current;
    if (!el || !nome) return;
    const pasta = pastaDaPaginaAberta();
    const carregar = pasta ? figuras[`${pasta}/figuras/${nome}.js`] : undefined;
    if (!carregar) {
      setAviso(pasta ? `Não achei figuras/${nome}.js na pasta desta página.` : 'A prévia aparece depois que a página é salva.');
      return;
    }
    setAviso(null);
    let ativa = true;
    let destruir: (() => void) | undefined;
    Promise.all([import('../caneta/caneta.js'), carregar()]).then(([{ montar }, modulo]) => {
      if (!ativa) return;
      el.replaceChildren();
      destruir = montar(el, modulo.default).destruir;
    });
    return () => {
      ativa = false;
      destruir?.();
      el.replaceChildren();
      el.className = '';
    };
  }, [nome]);

  return (
    <figure className={largura === 'larga' ? 'ed-figura ed-larga' : 'ed-figura'} contentEditable={false}>
      {aviso ? <p className="ed-vazio">{aviso}</p> : <div ref={alvo} />}
      <Legenda legenda={legenda} />
    </figure>
  );
}

function useEnderecoDaImagem(arquivo: { data: Uint8Array; extension: string } | null) {
  const [endereco, setEndereco] = useState<string | null>(null);
  useEffect(() => {
    if (!arquivo) return setEndereco(null);
    const tipo = arquivo.extension === 'svg' ? 'image/svg+xml' : `image/${arquivo.extension === 'jpg' ? 'jpeg' : arquivo.extension}`;
    const url = URL.createObjectURL(new Blob([arquivo.data as BlobPart], { type: tipo }));
    setEndereco(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);
  return endereco;
}

function PreviaImagem(props: {
  arquivo: { data: Uint8Array; extension: string } | null;
  alt: string;
  legenda: string;
  tratamento: string;
  credito: string;
  largura: string;
}) {
  const endereco = useEnderecoDaImagem(props.arquivo);
  return (
    <figure className={props.largura === 'larga' ? 'ed-figura ed-larga' : 'ed-figura'} contentEditable={false}>
      <div className={props.tratamento === 'tinta' ? 'ed-moldura ed-moldura-tinta' : 'ed-moldura'}>
        {endereco ? <img src={endereco} alt={props.alt} /> : <p className="ed-vazio">Escolha o arquivo da imagem.</p>}
      </div>
      <Legenda legenda={props.legenda} credito={props.credito} />
    </figure>
  );
}

function SecaoFixa({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="ed-secao-fixa">
      <p className="ed-secao-fixa-titulo" contentEditable={false}>
        {titulo}
      </p>
      {children}
    </section>
  );
}

/* ---------- blocos ---------- */

export const blocos = {
  Termo: mark({
    label: 'Termo definido',
    icon: underlineIcon,
    schema: {},
    className: 'ed-termo',
  }),
  Figura: block({
    label: 'Figura à caneta',
    description: 'Ilustração ou simulação de figuras/<nome>.js, na pasta da página.',
    icon: penToolIcon,
    schema: {
      nome: fields.text({
        label: 'Nome da figura',
        description: 'Nome do arquivo em figuras/, sem o .js. Ex.: grade-rb',
        validation: { isRequired: true },
      }),
      legenda: fields.text({ label: 'Legenda', description: 'Com legenda, a figura ganha número.', multiline: true }),
      largura: campoLargura,
    },
    ContentView: ({ value }) => <PreviaFigura {...value} />,
  }),
  Imagem: block({
    label: 'Imagem',
    description: 'Foto ou captura com moldura. O arquivo vai para imagens/, na pasta da página.',
    icon: imageIcon,
    schema: {
      arquivo: fields.image({ label: 'Arquivo', validation: { isRequired: true } }),
      alt: fields.text({
        label: 'Texto alternativo',
        description: 'O que a imagem mostra, para quem não a vê.',
        validation: { isRequired: true },
      }),
      legenda: fields.text({ label: 'Legenda', description: 'Com legenda, a imagem ganha número.', multiline: true }),
      tratamento: fields.select({
        label: 'Tratamento',
        options: [
          { label: 'Cores originais', value: 'original' },
          { label: 'Tom de tinta (um clique mostra o original)', value: 'tinta' },
        ],
        defaultValue: 'original',
      }),
      origem: fields.select({
        label: 'Origem',
        options: [
          { label: 'Própria', value: 'propria' },
          { label: 'De terceiros', value: 'terceiros' },
          { label: 'Gerada por IA', value: 'ia' },
        ],
        defaultValue: 'propria',
      }),
      credito: fields.text({ label: 'Crédito', description: 'Obrigatório para imagem de terceiros.' }),
      largura: campoLargura,
    },
    ContentView: ({ value }) => <PreviaImagem {...value} />,
  }),
  Nota: wrapper({
    label: 'Nota manuscrita',
    icon: notebookPenIcon,
    schema: {},
    ContentView: ({ children }) => <aside className="ed-nota">{children}</aside>,
  }),
  Pequeno: wrapper({
    label: 'Texto pequeno',
    description: 'Nota de rodapé de tabela ou aviso de modelo simplificado.',
    icon: aLargeSmallIcon,
    schema: {},
    ContentView: ({ children }) => <div className="ed-pequeno">{children}</div>,
  }),
  Formula: wrapper({
    label: 'Fórmula',
    description: 'Expressão centralizada. Use o bloco Fração dentro dela.',
    icon: sigmaIcon,
    schema: {
      descricao: fields.text({
        label: 'Leitura em voz alta',
        description: 'Como um leitor de tela deve ler a fórmula.',
        validation: { isRequired: true },
      }),
    },
    ContentView: ({ children }) => <div className="ed-formula">{children}</div>,
  }),
  Fracao: inline({
    label: 'Fração',
    icon: divideIcon,
    schema: {
      'em-cima': fields.text({ label: 'Numerador', validation: { isRequired: true } }),
      embaixo: fields.text({ label: 'Denominador', validation: { isRequired: true } }),
    },
    ContentView: ({ value }) => (
      <span className="ed-fracao">
        <span>{value['em-cima']}</span>
        <span>{value.embaixo}</span>
      </span>
    ),
  }),
  Quadro: repeating({
    label: 'Quadro 2×2',
    description: 'Quatro casos comparados em dois eixos.',
    icon: grid2X2Icon,
    schema: {},
    children: 'Caso',
    validation: { children: { min: 4, max: 4 } },
    ContentView: ({ children }) => <div className="ed-quadro">{children}</div>,
  }),
  Caso: wrapper({
    label: 'Caso',
    forSpecificLocations: true,
    schema: { titulo: fields.text({ label: 'Título', validation: { isRequired: true } }) },
    ContentView: ({ value, children }) => (
      <div className="ed-caso">
        <h3 contentEditable={false}>{value.titulo}</h3>
        {children}
      </div>
    ),
  }),
  Resumo: wrapper({
    label: 'Em resumo',
    description: 'A lista do fim da aula.',
    icon: listIcon,
    schema: {},
    ContentView: ({ children }) => <div className="ed-resumo">{children}</div>,
  }),
  Confira: repeating({
    label: 'Confira se entendeu',
    description: 'Perguntas com a resposta recolhida.',
    icon: messageCircleQuestionIcon,
    schema: {},
    children: 'Pergunta',
    validation: { children: { min: 1, max: 99 } },
    ContentView: ({ children }) => <div className="ed-confira">{children}</div>,
  }),
  Pergunta: wrapper({
    label: 'Pergunta',
    forSpecificLocations: true,
    schema: { texto: fields.text({ label: 'Pergunta', validation: { isRequired: true } }) },
    ContentView: ({ value, children }) => (
      <div className="ed-pergunta">
        <p className="ed-pergunta-texto" contentEditable={false}>
          {value.texto}
        </p>
        <div className="ed-resposta">{children}</div>
      </div>
    ),
  }),
  NoSoftware: wrapper({
    label: 'Na prática do software',
    description: 'Seção fixa: como o assunto aparece no código.',
    icon: code2Icon,
    schema: {},
    ContentView: ({ children }) => <SecaoFixa titulo="No código">{children}</SecaoFixa>,
  }),
  NoPrompt: wrapper({
    label: 'Como pedir a uma IA',
    description: 'Seção fixa: o pedido pronto, num bloco de código.',
    icon: botIcon,
    schema: {
      contexto: fields.text({ label: 'Contexto', multiline: true, validation: { isRequired: true } }),
      porque: fields.text({ label: 'Por que assim', multiline: true, validation: { isRequired: true } }),
    },
    ContentView: ({ value, children }) => (
      <SecaoFixa titulo="Pedido para a IA">
        <p className="ed-prompt-nota" contentEditable={false}>
          <b>Contexto:</b> {value.contexto}
        </p>
        {children}
        <p className="ed-prompt-nota" contentEditable={false}>
          <b>Por que assim:</b> {value.porque}
        </p>
      </SecaoFixa>
    ),
  }),
  ComoValidar: repeating({
    label: 'Como conferir o que a IA fez',
    description: 'Seção fixa: lista de conferências.',
    icon: listChecksIcon,
    schema: {},
    children: 'Conferir',
    validation: { children: { min: 1, max: 99 } },
    ContentView: ({ children }) => <SecaoFixa titulo="Conferência">{children}</SecaoFixa>,
  }),
  Conferir: block({
    label: 'Conferência',
    forSpecificLocations: true,
    schema: {
      verificar: fields.text({ label: 'O que verificar', multiline: true, validation: { isRequired: true } }),
      erro: fields.text({ label: 'Sinal de erro', multiline: true, validation: { isRequired: true } }),
    },
    ContentView: ({ value }) => (
      <div className="ed-conferir">
        <p className="ed-conferir-verificar">{value.verificar}</p>
        <p className="ed-conferir-erro">
          <b>Sinal de erro:</b> {value.erro}
        </p>
      </div>
    ),
  }),
  Flashcards: repeating({
    label: 'Flashcards',
    description: 'Cards exportados para o Anki. Fica no fim da página.',
    icon: layersIcon,
    schema: {},
    children: 'Flashcard',
    validation: { children: { min: 1, max: 99 } },
    ContentView: ({ children }) => (
      <div className="ed-flashcards">
        <p className="ed-flashcards-titulo" contentEditable={false}>
          Flashcards
        </p>
        {children}
      </div>
    ),
  }),
  Flashcard: wrapper({
    label: 'Flashcard',
    forSpecificLocations: true,
    schema: {
      frente: fields.text({ label: 'Frente', validation: { isRequired: true } }),
      verso: fields.text({
        label: 'Verso curto (opcional)',
        description: 'Deixe vazio e escreva a resposta no corpo do card.',
        multiline: true,
      }),
    },
    ContentView: ({ value, children }) => (
      <div className="ed-flashcard">
        <p className="ed-flashcard-frente" contentEditable={false}>
          {value.frente}
        </p>
        {value.verso && (
          <p className="ed-flashcard-verso" contentEditable={false}>
            {value.verso}
          </p>
        )}
        <div className="ed-flashcard-verso">{children}</div>
      </div>
    ),
  }),
};
