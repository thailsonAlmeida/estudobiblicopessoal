import { MethodId } from "../types/study";

export interface MethodMetadata {
  id: MethodId;
  order: number;
  name: string;
  shortDescription: string;
  sanctuaryLevel: "atrio" | "lugar_santo" | "santo_dos_santos";
  sanctuaryLevelLabel: string;
  timeEstimate: string;
  totalSteps: number;
  iconName: string;
  accentColor: string;
  tagline: string;
}

export const BIBLE_STUDY_METHODS: Record<MethodId, MethodMetadata> = {
  "01_DEVOCIONAL": {
    id: "01_DEVOCIONAL",
    order: 1,
    name: "Método Devocional",
    shortDescription: "Medite em uma passagem e aplique à sua vida pessoal de forma prática, possível e mensurável.",
    sanctuaryLevel: "atrio",
    sanctuaryLevelLabel: "Átrio Exterior",
    timeEstimate: "15 a 20 min",
    totalSteps: 4,
    iconName: "HeartHandshake",
    accentColor: "var(--tabernacle-blue)",
    tagline: "O alicerce diário de aplicação da Palavra"
  },
  "02_RESUMO_CAPITULO": {
    id: "02_RESUMO_CAPITULO",
    order: 2,
    name: "Resumo de Capítulo",
    shortDescription: "Compreenda um capítulo inteiro através de cinco leituras e dez perguntas objetivas.",
    sanctuaryLevel: "atrio",
    sanctuaryLevelLabel: "Átrio Exterior",
    timeEstimate: "20 a 30 min",
    totalSteps: 10,
    iconName: "BookOpen",
    accentColor: "var(--tabernacle-gold)",
    tagline: "A visão geral de cada capítulo bíblico sem ferramentas externas"
  },
  "03_QUALIDADE_CARATER": {
    id: "03_QUALIDADE_CARATER",
    order: 3,
    name: "Qualidade de Caráter",
    shortDescription: "Identifique traços morais bíblicos (positivos ou negativos) e molde seu caráter à semelhança de Cristo.",
    sanctuaryLevel: "lugar_santo",
    sanctuaryLevelLabel: "Lugar Santo",
    timeEstimate: "45 min a 1h",
    totalSteps: 9,
    iconName: "Sparkles",
    accentColor: "var(--tabernacle-purple)",
    tagline: "Transformação interior do caráter"
  },
  "04_TEMATICO": {
    id: "04_TEMATICO",
    order: 4,
    name: "Método Temático",
    shortDescription: "Pesquise um tema específico respondendo estritamente a 3 a 5 perguntas predeterminadas.",
    sanctuaryLevel: "lugar_santo",
    sanctuaryLevelLabel: "Lugar Santo",
    timeEstimate: "30 a 45 min",
    totalSteps: 6,
    iconName: "Compass",
    accentColor: "var(--tabernacle-blue)",
    tagline: "Investigação objetiva com os 'homens honestos' de Kipling"
  },
  "05_BIOGRAFICO": {
    id: "05_BIOGRAFICO",
    order: 5,
    name: "Método Biográfico",
    shortDescription: "Descubra os segredos do sucesso e fracasso dos homens e mulheres da Escritura.",
    sanctuaryLevel: "lugar_santo",
    sanctuaryLevelLabel: "Lugar Santo",
    timeEstimate: "1 a 2 horas",
    totalSteps: 10,
    iconName: "Users",
    accentColor: "var(--tabernacle-crimson)",
    tagline: "Lições vivas nas trajetórias dos santos do passado"
  },
  "06_TOPICOS": {
    id: "06_TOPICOS",
    order: 6,
    name: "Método por Tópicos",
    shortDescription: "Rastreie exaustivamente um tópico ou doutrina na Bíblia inteira e monte um esboço lógico.",
    sanctuaryLevel: "lugar_santo",
    sanctuaryLevelLabel: "Lugar Santo",
    timeEstimate: "1 a 2 horas",
    totalSteps: 6,
    iconName: "Layers",
    accentColor: "var(--tabernacle-bronze)",
    tagline: "Construção de convicções doutrinárias sólidas"
  },
  "07_MORFOLOGICO": {
    id: "07_MORFOLOGICO",
    order: 7,
    name: "Estudo Morfológico (Palavras)",
    shortDescription: "Investigue palavras fundamentais no original (grego/hebraico), raízes e frequências.",
    sanctuaryLevel: "lugar_santo",
    sanctuaryLevelLabel: "Lugar Santo",
    timeEstimate: "45 min",
    totalSteps: 8,
    iconName: "SearchCode",
    accentColor: "var(--tabernacle-blue)",
    tagline: "As pepitas das línguas bíblicas originais"
  },
  "08_HISTORICO_CULTURAL": {
    id: "08_HISTORICO_CULTURAL",
    order: 8,
    name: "Histórico-Cultural e Contextual",
    shortDescription: "Descubra como a geografia, a política, os costumes e a história iluminam o texto.",
    sanctuaryLevel: "lugar_santo",
    sanctuaryLevelLabel: "Lugar Santo",
    timeEstimate: "1 hora",
    totalSteps: 8,
    iconName: "Landmark",
    accentColor: "var(--tabernacle-gold)",
    tagline: "Transportando-se para o mundo dos primeiros destinatários"
  },
  "09_INVESTIGATIVO": {
    id: "09_INVESTIGATIVO",
    order: 9,
    name: "Investigativo do Livro",
    shortDescription: "A visão telescópica de um livro inteiro antes da dissecação de detalhes.",
    sanctuaryLevel: "santo_dos_santos",
    sanctuaryLevelLabel: "Santo dos Santos",
    timeEstimate: "2 a 3 horas",
    totalSteps: 6,
    iconName: "Eye",
    accentColor: "var(--tabernacle-purple)",
    tagline: "A grande vista de arranha-céu do livro completo"
  },
  "10_ANALITICO_CAPITULO": {
    id: "10_ANALITICO_CAPITULO",
    order: 10,
    name: "Analítico de Capítulo",
    shortDescription: "Exame microscópico versículo por versículo com observação, interpretação e correlação.",
    sanctuaryLevel: "santo_dos_santos",
    sanctuaryLevelLabel: "Santo dos Santos",
    timeEstimate: "1 a 2 horas",
    totalSteps: 7,
    iconName: "Microscope",
    accentColor: "var(--tabernacle-blue)",
    tagline: "O método supremo de observação minuciosa ('O lápis é o melhor olho')"
  },
  "11_SINTETICO": {
    id: "11_SINTETICO",
    order: 11,
    name: "Sintético do Livro",
    shortDescription: "Remonte o livro após a análise para contemplar a sinfonia inteira e o esboço final.",
    sanctuaryLevel: "santo_dos_santos",
    sanctuaryLevelLabel: "Santo dos Santos",
    timeEstimate: "1 a 2 horas",
    totalSteps: 6,
    iconName: "Puzzle",
    accentColor: "var(--tabernacle-gold)",
    tagline: "Unindo as partes para formar o todo harmonioso"
  },
  "12_VERSICULO_POR_VERSICULO": {
    id: "12_VERSICULO_POR_VERSICULO",
    order: 12,
    name: "Versículo por Versículo",
    shortDescription: "Estudo dinâmico com tabela de 6 colunas (Texto, Paráfrase, P/R/O, Ref., Insights e Aplicação).",
    sanctuaryLevel: "santo_dos_santos",
    sanctuaryLevelLabel: "Santo dos Santos",
    timeEstimate: "Flexível (1 a 5 versículos/dia)",
    totalSteps: 5,
    iconName: "TableProperties",
    accentColor: "var(--tabernacle-crimson)",
    tagline: "Aprofundamento contínuo em doses diárias"
  }
};

