import { MethodId } from "@/lib/types/study";

export interface BiblicalEncouragement {
  character: string;
  quote: string;
  reference: string;
  context?: string;
}

/**
 * Frases de incentivo, fé e esperança de personagens bíblicos
 * associadas a cada um dos 12 Métodos de Estudo Bíblico (Rick Warren).
 */
export const METHOD_BIBLICAL_ENCOURAGEMENTS: Record<
  MethodId,
  BiblicalEncouragement
> = {
  "01_DEVOCIONAL": {
    character: "Tiago",
    quote:
      "Aproximem-se de Deus, e ele se aproximará de vocês! Sejam praticantes da palavra, e não apenas ouvintes.",
    reference: "Tiago 4.8; 1.22",
    context: "A prática diária que transforma o coração",
  },
  "02_RESUMO_CAPITULO": {
    character: "Salomão",
    quote:
      "Adquira a sabedoria, adquira o entendimento! O caminho dos justos é como a luz da aurora, que brilha cada vez mais até a plena claridade do dia.",
    reference: "Provérbios 4.5,18",
    context: "A visão e o discernimento de todo o capítulo",
  },
  "03_QUALIDADE_CARATER": {
    character: "Paulo",
    quote:
      "O fruto do Espírito é amor, alegria, paz, paciência, amabilidade, bondade, fidelidade, mansidão e domínio próprio. Não nos cansemos de fazer o bem, pois no tempo certo colheremos!",
    reference: "Gálatas 5.22-23; 6.9",
    context: "A edificação de um caráter segundo o coração de Deus",
  },
  "04_TEMATICO": {
    character: "Bereanos (por Lucas)",
    quote:
      "Examinem as Escrituras todos os dias para confirmar a verdade. Vocês me procurarão e me acharão quando me procurarem de todo o coração!",
    reference: "Atos 17.11; Jeremias 29.13",
    context: "A busca diligente pelas verdades de Deus",
  },
  "05_BIOGRAFICO": {
    character: "Autor aos Hebreus",
    quote:
      "Cercados por tão grande nuvem de testemunhas, deixemos todo embaraço e corramos com perseverança a corrida proposta para nós, com os olhos fitos em Jesus!",
    reference: "Hebreus 12.1-2",
    context: "O legado inspirador dos gigantes da fé",
  },
  "06_TOPICOS": {
    character: "Esdras",
    quote:
      "Dedique o coração a buscar a Lei do Senhor, a praticá-la e a ensiná-la. A boa mão do nosso Deus esteve sobre nós para nos guiar!",
    reference: "Esdras 7.9-10",
    context: "A solidez do ensino e dos fundamentos bíblicos",
  },
  "07_MORFOLOGICO": {
    character: "Jeremias",
    quote:
      "Quando as tuas palavras foram encontradas, eu as comi; elas foram para mim o regozijo e a alegria do meu coração, pois pertenço a ti, Senhor!",
    reference: "Jeremias 15.16",
    context: "O sabor e a riqueza de cada palavra no texto original",
  },
  "08_HISTORICO_CULTURAL": {
    character: "Neemias",
    quote:
      "Leram claramente no livro da Lei de Deus e deram o sentido, de modo que todos entenderam. Não fiquem tristes, pois a alegria do Senhor é a vossa força!",
    reference: "Neemias 8.8,10",
    context: "A compreensão viva dos tempos e propósitos bíblicos",
  },
  "09_INVESTIGATIVO": {
    character: "Moisés",
    quote:
      "As coisas encobertas pertencem ao Senhor, mas as reveladas pertencem a nós e aos nossos filhos para sempre, para que pratiquemos todas as palavras desta Lei!",
    reference: "Deuteronômio 29.29",
    context: "A visão panorâmica da revelação de Deus",
  },
  "10_ANALITICO_CAPITULO": {
    character: "Davi",
    quote:
      "Abre os meus olhos para que eu veja as maravilhas da tua lei! Desejo os teus preceitos mais do que o ouro refinado e são mais doces do que o mel!",
    reference: "Salmos 119.18,72,103",
    context: "A profundidade exegética no Santo dos Santos",
  },
  "11_SINTETICO": {
    character: "João",
    quote:
      "Estes foram escritos para que vocês creiam que Jesus é o Cristo, o Filho de Deus, e tenham vida em seu nome. Aquele que começou a boa obra em vocês a completará!",
    reference: "João 20.31; Filipenses 1.6",
    context: "A grande síntese redentora e o discipulado",
  },
  "12_VERSICULO_POR_VERSICULO": {
    character: "Pedro",
    quote:
      "Temos a palavra profética confirmada, à qual vocês fazem bem em prestar atenção, como a uma luz que brilha em lugar escuro, até que o dia clareie!",
    reference: "2 Pedro 1.19",
    context: "A luz de cada versículo iluminando os passos",
  },
};

export const BIBLICAL_ENCOURAGEMENTS: BiblicalEncouragement[] = Object.values(
  METHOD_BIBLICAL_ENCOURAGEMENTS
);

/**
 * Retorna a frase de incentivo de um personagem bíblico especificamente associada ao método escolhido.
 */
export function getMethodBiblicalEncouragement(
  methodId: MethodId
): BiblicalEncouragement {
  return (
    METHOD_BIBLICAL_ENCOURAGEMENTS[methodId] ||
    METHOD_BIBLICAL_ENCOURAGEMENTS["01_DEVOCIONAL"]
  );
}

/**
 * Seleciona uma palavra de incentivo bíblica pelo ID do método ou semente de texto.
 */
export function getBiblicalEncouragement(
  methodOrSeed?: string
): BiblicalEncouragement {
  if (!methodOrSeed || methodOrSeed === "novo") {
    return METHOD_BIBLICAL_ENCOURAGEMENTS["01_DEVOCIONAL"];
  }

  if (methodOrSeed in METHOD_BIBLICAL_ENCOURAGEMENTS) {
    return METHOD_BIBLICAL_ENCOURAGEMENTS[methodOrSeed as MethodId];
  }

  let hash = 0;
  for (let i = 0; i < methodOrSeed.length; i++) {
    hash = (hash * 31 + methodOrSeed.charCodeAt(i)) >>> 0;
  }

  return BIBLICAL_ENCOURAGEMENTS[hash % BIBLICAL_ENCOURAGEMENTS.length];
}
