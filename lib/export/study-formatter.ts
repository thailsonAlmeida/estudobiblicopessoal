import { BIBLE_STUDY_METHODS } from "@/lib/constants/methods";
import { Study } from "@/lib/types/study";

export interface FormattedStudyField {
  label: string;
  value: string;
}

export interface FormattedStudySection {
  title: string;
  fields: FormattedStudyField[];
}

export interface FormattedStudyDocument {
  title: string;
  methodId: Study["methodId"];
  methodName: string;
  methodOrder: number;
  sanctuaryZoneLabel: string;
  passage: string;
  statusLabel: string;
  createdAtFormatted: string;
  updatedAtFormatted: string;
  sections: FormattedStudySection[];
  application4P: {
    text: string;
    deadline: string;
    isPersonal: boolean;
    isPractical: boolean;
    isPossible: boolean;
    isMeasurable: boolean;
  };
}

const ZONE_LABELS: Record<string, string> = {
  atrio: "Átrio Exterior",
  lugar_santo: "Lugar Santo",
  santo_dos_santos: "Santo dos Santos",
};

const APPENDIX_F_LABELS: Record<string, string> = {
  repeticoes: "Repetições de palavras e frases-chave",
  contrastes: "Contrastes ('mas', 'porém', luz vs. trevas)",
  comparacoes: "Comparações e metáforas ('como', 'assim como')",
  causa_efeito: "Relações de causa e efeito ('portanto', 'porque')",
  climax: "Clímax e ponto de virada da narrativa",
  verbos_tempos: "Força dos verbos (imperativos, promessas e tempos)",
  conectivos: "Conectivos lógicos e progressão do argumento",
};

const READING_RULE_LABELS: Record<string, string> = {
  "1_de_uma_so_vez": "1. Leitura do livro inteiro de uma só vez",
  "2_traducao_moderna": "2. Uso de tradução contemporânea fluida",
  "3_ignorar_divisoes": "3. Leitura contínua sem divisões de capítulos",
  "4_ritmo_rapido": "4. Ritmo rápido focado no argumento central",
  "5_repetidas_vezes": "5. Releituras sucessivas do livro",
  "6_com_oracao": "6. Leitura em espírito de oração",
  "7_com_lapis_na_mao": "7. Anotação das primeiras impressões",
};

function str(
  fd: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string {
  const val = fd?.[key];
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val);
  return fallback;
}

function pushIfFilled(
  fields: FormattedStudyField[],
  label: string,
  value: string
): void {
  if (value.trim().length > 0) {
    fields.push({ label, value: value.trim() });
  }
}

function formatDatePtBr(isoString: string | undefined): string {
  if (!isoString) return "Não informada";
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return isoString;
  return parsed.toLocaleDateString("pt-BR");
}

export function formatPassageString(study: Study): string {
  const parts: string[] = [];
  if (study.book.trim()) parts.push(study.book.trim());
  if (study.chapter !== undefined && study.chapter > 0) {
    parts.push(`cap. ${study.chapter}`);
  }
  if (study.verses.trim()) {
    parts.push(`v. ${study.verses.trim()}`);
  }
  return parts.length > 0 ? parts.join(" ") : "Passagem geral";
}

function buildMethodSections(study: Study): FormattedStudySection[] {
  const fd = study.formData as Record<string, unknown> | undefined;
  const sections: FormattedStudySection[] = [];

  switch (study.methodId) {
    case "01_DEVOCIONAL": {
      const step1Fields: FormattedStudyField[] = [
        {
          label: "Oração Inicial de Iluminação",
          value: fd?.prayerDone ? "Realizada com reverência" : "Pendente",
        },
      ];
      sections.push({
        title: "Etapa 1: Oração e Preparação",
        fields: step1Fields,
      });

      const step2Fields: FormattedStudyField[] = [];
      const technique = str(fd, "meditationTechnique");
      if (technique) {
        pushIfFilled(
          step2Fields,
          "Técnica de Meditação",
          technique === "papelmove"
            ? "Acróstico PAPELMOVE"
            : technique === "enfase"
            ? "Leitura com Ênfase Vocal"
            : technique === "parafrase"
            ? "Paráfrase Pessoal"
            : technique === "visualizacao"
            ? "Visualização da Cena Bíblica"
            : technique
        );
      }
      pushIfFilled(
        step2Fields,
        "Anotações de Meditação",
        str(fd, "meditationNotes")
      );

      const papelmoveRaw = fd?.papelmove;
      if (typeof papelmoveRaw === "object" && papelmoveRaw !== null) {
        const pm = papelmoveRaw as Record<string, unknown>;
        const pmLabels: Array<[string, string]> = [
          ["pecado", "P — Pecado a confessar"],
          ["atitude", "A — Atitude a mudar"],
          ["promessa", "P — Promessa a reivindicar"],
          ["exemplo", "E — Exemplo a seguir"],
          ["louvor", "L — Louvor a oferecer"],
          ["mandamento", "M — Mandamento a obedecer"],
          ["oracao", "O — Oração a fazer"],
          ["verdade", "V — Verdade em que crer"],
          ["erro", "E — Erro a evitar"],
        ];
        for (const [k, label] of pmLabels) {
          pushIfFilled(step2Fields, label, str(pm, k));
        }
      }
      if (step2Fields.length > 0) {
        sections.push({
          title: "Etapa 2: Meditação na Passagem",
          fields: step2Fields,
        });
      }

      const step4Fields: FormattedStudyField[] = [];
      pushIfFilled(
        step4Fields,
        "Versículo para Memorização",
        str(fd, "memoryVerse")
      );
      pushIfFilled(
        step4Fields,
        "Referência do Versículo",
        str(fd, "memoryVerseRef")
      );
      if (step4Fields.length > 0) {
        sections.push({
          title: "Etapa 4: Memorização e Guarda no Coração",
          fields: step4Fields,
        });
      }
      break;
    }

    case "02_RESUMO_CAPITULO": {
      const readings = Array.isArray(fd?.readingsCount)
        ? fd.readingsCount.length
        : 0;
      const fields: FormattedStudyField[] = [];
      if (readings > 0) {
        fields.push({
          label: "Leituras Prévias do Capítulo",
          value: `${readings} de 5 leituras concluídas`,
        });
      }
      pushIfFilled(fields, "1. Título (Legenda)", str(fd, "step1Title"));
      pushIfFilled(fields, "2. Conteúdo (Esboço)", str(fd, "step2Content"));
      pushIfFilled(
        fields,
        "3. Pessoas (Personagens Principais)",
        str(fd, "step3People")
      );
      pushIfFilled(
        fields,
        "4. Versículo-Chave Escolhido",
        str(fd, "step4KeyVerse")
      );
      pushIfFilled(fields, "5. Palavras-Chave", str(fd, "step5KeyWords"));
      pushIfFilled(
        fields,
        "6. Desafios e Dificuldades",
        str(fd, "step6Challenges")
      );
      pushIfFilled(
        fields,
        "7. Referências Cruzadas",
        str(fd, "step7CrossReferences")
      );
      pushIfFilled(
        fields,
        "8. Cristo Visto no Capítulo",
        str(fd, "step8Christ")
      );
      pushIfFilled(
        fields,
        "9. Lições Centrais",
        str(fd, "step9CentralLessons")
      );
      if (fields.length > 0) {
        sections.push({
          title: "Os 10 Passos do Resumo de Capítulo",
          fields,
        });
      }
      break;
    }

    case "03_QUALIDADE_CARATER": {
      const f1: FormattedStudyField[] = [];
      pushIfFilled(f1, "Qualidade Estudada", str(fd, "qualityName"));
      pushIfFilled(f1, "Definição da Qualidade", str(fd, "qualityDefinition"));
      pushIfFilled(f1, "Defeito Oposto (Antônimo)", str(fd, "oppositeName"));
      pushIfFilled(
        f1,
        "Definição do Oposto",
        str(fd, "oppositeDefinition")
      );
      pushIfFilled(f1, "Estudo da Palavra e Sinônimos", str(fd, "wordStudy"));
      if (f1.length > 0) {
        sections.push({
          title: "Fase 1: Matriz Comparativa e Definição",
          fields: f1,
        });
      }

      const f2: FormattedStudyField[] = [];
      pushIfFilled(
        f2,
        "Referências Bíblicas e Contexto",
        str(fd, "crossReferences")
      );
      pushIfFilled(
        f2,
        "Personagem Bíblico que Evidencia a Qualidade",
        str(fd, "biographicalCharacter")
      );
      pushIfFilled(
        f2,
        "Lições da Vida do Personagem",
        str(fd, "biographicalLessons")
      );
      pushIfFilled(f2, "Versículo para Memorizar", str(fd, "memoryVerse"));
      pushIfFilled(f2, "Referência do Versículo", str(fd, "memoryVerseRef"));
      if (f2.length > 0) {
        sections.push({
          title: "Fase 2: Escrituras, Biografia e Memorização",
          fields: f2,
        });
      }

      const f3: FormattedStudyField[] = [];
      pushIfFilled(
        f3,
        "Situação ou Relacionamento para Praticar",
        str(fd, "specificSituation")
      );
      pushIfFilled(
        f3,
        "Ilustração Prática Pessoal",
        str(fd, "personalIllustration")
      );
      if (f3.length > 0) {
        sections.push({
          title: "Fase 3: Vivência Prática do Caráter",
          fields: f3,
        });
      }
      break;
    }

    case "04_TEMATICO": {
      const f1: FormattedStudyField[] = [];
      pushIfFilled(
        f1,
        "Referências Bíblicas Selecionadas",
        str(fd, "bibleReferences")
      );
      if (Array.isArray(fd?.questions)) {
        const validQuestions = fd.questions
          .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
          .map((q, idx) => `${idx + 1}. ${q.trim()}`)
          .join("\n");
        pushIfFilled(f1, "Perguntas Investigativas (Atalhos de Kipling)", validQuestions);
      }
      if (f1.length > 0) {
        sections.push({
          title: "Fase 1: Escopo e Perguntas do Tema",
          fields: f1,
        });
      }

      const f2: FormattedStudyField[] = [];
      pushIfFilled(
        f2,
        "Respostas Extraídas das Passagens",
        str(fd, "referenceAnswers")
      );
      pushIfFilled(
        f2,
        "Conclusões e Síntese do Tema",
        str(fd, "conclusions")
      );
      if (f2.length > 0) {
        sections.push({
          title: "Fase 2 e 3: Investigação e Conclusões",
          fields: f2,
        });
      }
      break;
    }

    case "05_BIOGRAFICO": {
      const f1: FormattedStudyField[] = [];
      pushIfFilled(f1, "Personagem Estudado", str(fd, "characterName"));
      pushIfFilled(f1, "Outros Nomes / Significado", str(fd, "alternateNames"));
      pushIfFilled(f1, "Referências Bíblicas Coletadas", str(fd, "referencesList"));
      pushIfFilled(f1, "Primeiras Impressões", str(fd, "firstImpressions"));

      if (Array.isArray(fd?.timelineEvents)) {
        const events = fd.timelineEvents
          .filter(
            (ev): ev is { phase?: string; reference?: string; description?: string } =>
              typeof ev === "object" && ev !== null
          )
          .filter(
            (ev) =>
              Boolean(ev.description?.trim()) || Boolean(ev.reference?.trim())
          )
          .map(
            (ev) =>
              `• ${ev.phase || "Fase"} (${ev.reference || "s/ ref."}): ${
                ev.description || ""
              }`
          )
          .join("\n");
        pushIfFilled(f1, "Linha do Tempo Cronológica", events);
      }
      if (f1.length > 0) {
        sections.push({
          title: "Fase 1: Identidade e Cronologia Biográfica",
          fields: f1,
        });
      }

      const f2: FormattedStudyField[] = [];
      pushIfFilled(f2, "Vida Interior e Motivações", str(fd, "innerLife"));
      pushIfFilled(
        f2,
        "Qualidades e Virtudes de Caráter",
        str(fd, "characterVirtues")
      );
      pushIfFilled(
        f2,
        "Falhas, Pecados e Consequências",
        str(fd, "characterFlaws")
      );
      pushIfFilled(
        f2,
        "Verdades Espirituais Ilustradas",
        str(fd, "illustratedTruths")
      );
      pushIfFilled(f2, "Lição Principal da Vida", str(fd, "centralLesson"));
      pushIfFilled(
        f2,
        "Esboço Comunicável",
        str(fd, "communicableOutline")
      );
      if (f2.length > 0) {
        sections.push({
          title: "Fase 2 e 3: Análise de Caráter e Lição Central",
          fields: f2,
        });
      }
      break;
    }

    case "06_TOPICOS": {
      const f1: FormattedStudyField[] = [];
      pushIfFilled(
        f1,
        "Palavras Relacionadas e Sinônimos",
        str(fd, "relatedWords")
      );
      pushIfFilled(
        f1,
        "Referências Bíblicas Coletadas",
        str(fd, "collectedReferences")
      );
      pushIfFilled(
        f1,
        "Observações e Comparações de Versículos",
        str(fd, "verseObservations")
      );
      if (f1.length > 0) {
        sections.push({
          title: "Fase 1: Levantamento Completo do Tópico",
          fields: f1,
        });
      }

      const f2: FormattedStudyField[] = [];
      pushIfFilled(
        f2,
        "Agrupamento por Categorias",
        str(fd, "categoriesGrouping")
      );
      if (Array.isArray(fd?.outlineItems)) {
        const outlineText = fd.outlineItems
          .filter(
            (item): item is { level?: string; heading?: string; reference?: string } =>
              typeof item === "object" && item !== null
          )
          .filter(
            (item) =>
              Boolean(item.heading?.trim()) || Boolean(item.reference?.trim())
          )
          .map((item) => {
            const indent =
              item.level === "A" ? "  " : item.level === "1" ? "    " : "";
            const ref = item.reference?.trim() ? ` (${item.reference.trim()})` : "";
            return `${indent}[${item.level || "I"}] ${item.heading || ""}${ref}`;
          })
          .join("\n");
        pushIfFilled(f2, "Esboço Hierárquico (I / A / 1)", outlineText);
      }
      pushIfFilled(f2, "Síntese Doutrinária", str(fd, "doctrinalSummary"));
      if (f2.length > 0) {
        sections.push({
          title: "Fase 2 e 3: Esboço Sistemático e Síntese",
          fields: f2,
        });
      }
      break;
    }

    case "07_MORFOLOGICO": {
      const f1: FormattedStudyField[] = [];
      pushIfFilled(f1, "Palavra Estudada", str(fd, "word"));
      pushIfFilled(
        f1,
        "Definição no Dicionário Português",
        str(fd, "vernacularDefinition")
      );
      pushIfFilled(
        f1,
        "Sinônimos e Antônimos",
        str(fd, "synonymsAntonyms")
      );
      pushIfFilled(
        f1,
        "Comparação entre Traduções",
        str(fd, "translationComparison")
      );
      if (f1.length > 0) {
        sections.push({
          title: "Fase 1: Análise Vernácula e Traduções",
          fields: f1,
        });
      }

      const f2: FormattedStudyField[] = [];
      pushIfFilled(f2, "Idioma Original", str(fd, "originalLanguage"));
      pushIfFilled(f2, "Código Strong", str(fd, "strongNumber"));
      pushIfFilled(f2, "Transliteração", str(fd, "transliteration"));
      pushIfFilled(f2, "Significado Literal", str(fd, "literalMeaning"));
      pushIfFilled(
        f2,
        "Total de Ocorrências na Bíblia",
        str(fd, "totalOccurrences")
      );
      pushIfFilled(
        f2,
        "Lei da Primeira Menção",
        str(fd, "firstMention")
      );
      pushIfFilled(f2, "Raiz e Etimologia", str(fd, "rootEtymology"));
      pushIfFilled(
        f2,
        "Uso Contextual nas Escrituras",
        str(fd, "contextualUsage")
      );
      if (f2.length > 0) {
        sections.push({
          title: "Fase 2 e 3: Exegese Léxica (Strong e Etimologia)",
          fields: f2,
        });
      }
      break;
    }

    case "08_HISTORICO_CULTURAL": {
      const f1: FormattedStudyField[] = [];
      pushIfFilled(
        f1,
        "Fontes e Ferramentas Consultadas",
        str(fd, "referenceTools")
      );
      pushIfFilled(
        f1,
        "Cenário Geográfico (Topografia, Clima, Rotas)",
        str(fd, "geographyScenario")
      );
      pushIfFilled(
        f1,
        "Cenário Histórico e Cronológico",
        str(fd, "historyScenario")
      );
      pushIfFilled(
        f1,
        "Cenário Cultural e Costumes da Época",
        str(fd, "cultureScenario")
      );
      pushIfFilled(
        f1,
        "Cenário Político e Religioso",
        str(fd, "politicsScenario")
      );
      pushIfFilled(
        f1,
        "Síntese da Pesquisa Histórica",
        str(fd, "researchSummary")
      );
      if (f1.length > 0) {
        sections.push({
          title: "Os 4 Cenários do Pano de Fundo Histórico-Cultural",
          fields: f1,
        });
      }
      break;
    }

    case "09_INVESTIGATIVO": {
      const f1: FormattedStudyField[] = [];
      if (Array.isArray(fd?.readingRulesChecked) && fd.readingRulesChecked.length > 0) {
        const rules = fd.readingRulesChecked
          .filter((r): r is string => typeof r === "string")
          .map((r) => `• ${READING_RULE_LABELS[r] || r}`)
          .join("\n");
        pushIfFilled(f1, "Regras de Leitura Panorâmica Cumpridas", rules);
      }
      pushIfFilled(f1, "Gênero Literário do Livro", str(fd, "literaryGenre"));
      pushIfFilled(f1, "Primeiras Impressões", str(fd, "firstImpressions"));
      pushIfFilled(f1, "Palavras-Chave Repetidas", str(fd, "keyWords"));
      pushIfFilled(f1, "Versículo-Chave do Livro", str(fd, "keyVerse"));
      pushIfFilled(f1, "Tema Central do Livro", str(fd, "centralTheme"));
      if (f1.length > 0) {
        sections.push({
          title: "Fase 1: Leitura Panorâmica e Observação",
          fields: f1,
        });
      }

      const f2: FormattedStudyField[] = [];
      pushIfFilled(f2, "Autor Humano", str(fd, "author"));
      pushIfFilled(f2, "Destinatários Originais", str(fd, "recipients"));
      pushIfFilled(f2, "Data e Local de Escrita", str(fd, "dateAndPlace"));
      pushIfFilled(f2, "Propósito do Livro", str(fd, "purpose"));

      if (Array.isArray(fd?.horizontalChart)) {
        const chartText = fd.horizontalChart
          .filter(
            (row): row is {
              sectionChapters?: string;
              sectionTheme?: string;
              keyTopics?: string;
            } => typeof row === "object" && row !== null
          )
          .filter(
            (row) =>
              Boolean(row.sectionChapters?.trim()) ||
              Boolean(row.sectionTheme?.trim()) ||
              Boolean(row.keyTopics?.trim())
          )
          .map(
            (row) =>
              `• [${row.sectionChapters || "Seção"}] ${
                row.sectionTheme || ""
              } — ${row.keyTopics || ""}`
          )
          .join("\n");
        pushIfFilled(f2, "Quadro Horizontal das Divisões Naturais", chartText);
      }
      pushIfFilled(f2, "Esboço Experimental", str(fd, "tentativeOutline"));
      if (f2.length > 0) {
        sections.push({
          title: "Fase 2 e 3: Pano de Fundo, Quadro Horizontal e Esboço",
          fields: f2,
        });
      }
      break;
    }

    case "10_ANALITICO_CAPITULO": {
      const f1: FormattedStudyField[] = [];
      pushIfFilled(f1, "Resumo Geral do Capítulo", str(fd, "chapterSummary"));
      if (Array.isArray(fd?.appendixFChecked) && fd.appendixFChecked.length > 0) {
        const targets = fd.appendixFChecked
          .filter((t): t is string => typeof t === "string")
          .map((t) => `• ${APPENDIX_F_LABELS[t] || t}`)
          .join("\n");
        pushIfFilled(f1, "Alvos de Observação Analítica (Apêndice F)", targets);
      }
      pushIfFilled(
        f1,
        "Observações Detalhadas do Texto",
        str(fd, "detailedObservations")
      );
      if (f1.length > 0) {
        sections.push({
          title: "Fase 1: Observação Exegética Detalhada",
          fields: f1,
        });
      }

      const f2: FormattedStudyField[] = [];
      pushIfFilled(
        f2,
        "Perguntas e Respostas de Interpretação",
        str(fd, "interpretationQuestions")
      );
      pushIfFilled(
        f2,
        "Correlação com Outras Passagens Bíblicas",
        str(fd, "scriptureCorrelation")
      );
      pushIfFilled(
        f2,
        "Possíveis Aplicações Identificadas",
        str(fd, "possibleApplications")
      );
      pushIfFilled(
        f2,
        "Considerações Finais",
        str(fd, "finalConsiderations")
      );
      if (f2.length > 0) {
        sections.push({
          title: "Fase 2 e 3: Interpretação, Correlação e Síntese",
          fields: f2,
        });
      }
      break;
    }

    case "11_SINTETICO": {
      const f1: FormattedStudyField[] = [];
      pushIfFilled(
        f1,
        "Quantidade de Releituras",
        str(fd, "readingsCount")
      );
      pushIfFilled(
        f1,
        "Anotações da Releitura Sintética",
        str(fd, "rereadingNotes")
      );

      if (Array.isArray(fd?.finalOutlineItems)) {
        const outline = fd.finalOutlineItems
          .filter(
            (item): item is {
              code?: string;
              heading?: string;
              passageRange?: string;
            } => typeof item === "object" && item !== null
          )
          .filter(
            (item) =>
              Boolean(item.heading?.trim()) || Boolean(item.passageRange?.trim())
          )
          .map((item) => {
            const indent =
              item.code === "A" ? "  " : item.code === "1" ? "    " : "";
            const range = item.passageRange?.trim()
              ? ` (${item.passageRange.trim()})`
              : "";
            return `${indent}[${item.code || "I"}] ${item.heading || ""}${range}`;
          })
          .join("\n");
        pushIfFilled(f1, "Esboço Final e Definitivo do Livro", outline);
      }

      pushIfFilled(
        f1,
        "Resumo Teológico e Tema Central",
        str(fd, "theologicalSummary")
      );
      pushIfFilled(
        f1,
        "Plano de Compartilhamento e Discipulado",
        str(fd, "sharingPlan")
      );
      if (f1.length > 0) {
        sections.push({
          title: "Síntese Magistral do Livro Bíblico",
          fields: f1,
        });
      }
      break;
    }

    case "12_VERSICULO_POR_VERSICULO": {
      const f1: FormattedStudyField[] = [];
      pushIfFilled(
        f1,
        "Visão Geral da Passagem",
        str(fd, "passageOverview")
      );
      if (f1.length > 0) {
        sections.push({
          title: "Fase 1: Escopo e Visão Geral",
          fields: f1,
        });
      }

      if (Array.isArray(fd?.verseRows)) {
        const verseFields: FormattedStudyField[] = [];
        fd.verseRows.forEach((rawRow, idx) => {
          if (typeof rawRow !== "object" || rawRow === null) return;
          const r = rawRow as Record<string, unknown>;
          const ref = str(r, "verseRef") || `Versículo #${idx + 1}`;
          const details: string[] = [];
          if (str(r, "personalParaphrase")) {
            details.push(`Paráfrase: ${str(r, "personalParaphrase")}`);
          }
          if (str(r, "questionsAnswersObservations")) {
            details.push(
              `Perguntas / Respostas / Observações: ${str(
                r,
                "questionsAnswersObservations"
              )}`
            );
          }
          if (str(r, "crossReferences")) {
            details.push(`Referências Cruzadas: ${str(r, "crossReferences")}`);
          }
          if (str(r, "discoveries")) {
            details.push(`Descobertas: ${str(r, "discoveries")}`);
          }
          if (str(r, "briefApplication")) {
            details.push(`Aplicação Breve: ${str(r, "briefApplication")}`);
          }
          if (details.length > 0) {
            verseFields.push({
              label: `Versículo ${ref}`,
              value: details.join("\n"),
            });
          }
        });
        if (verseFields.length > 0) {
          sections.push({
            title: "Fase 2: Análise Versículo por Versículo (6 Colunas)",
            fields: verseFields,
          });
        }
      }
      break;
    }
  }

  return sections;
}

/**
 * Constrói um documento estruturado com todas as seções do estudo conforme o método utilizado.
 */
export function formatStudyToDocument(study: Study): FormattedStudyDocument {
  const methodInfo = BIBLE_STUDY_METHODS[study.methodId];
  const methodName = methodInfo?.name || study.methodId;
  const methodOrder = methodInfo?.order || 1;
  const sanctuaryZoneLabel =
    methodInfo?.sanctuaryLevelLabel ||
    ZONE_LABELS[methodInfo?.sanctuaryLevel || "atrio"] ||
    "Átrio Exterior";

  return {
    title: study.title || "Estudo Bíblico",
    methodId: study.methodId,
    methodName,
    methodOrder,
    sanctuaryZoneLabel,
    passage: formatPassageString(study),
    statusLabel: study.status === "completed" ? "Concluído" : "Rascunho",
    createdAtFormatted: formatDatePtBr(study.createdAt),
    updatedAtFormatted: formatDatePtBr(study.updatedAt),
    sections: buildMethodSections(study),
    application4P: {
      text: study.application4P?.text?.trim() || "Nenhuma aplicação registrada.",
      deadline: study.application4P?.deadline?.trim() || "Não informado",
      isPersonal: Boolean(study.application4P?.isPersonal),
      isPractical: Boolean(study.application4P?.isPractical),
      isPossible: Boolean(study.application4P?.isPossible),
      isMeasurable: Boolean(study.application4P?.isMeasurable),
    },
  };
}

/**
 * Formata o estudo em texto limpo e legível para leitura ou cópia no modal.
 */
export function formatStudyPlainText(study: Study): string {
  const doc = formatStudyToDocument(study);
  const lines: string[] = [
    `============================================================`,
    `${doc.title.toUpperCase()}`,
    `============================================================`,
    `Método #${doc.methodOrder}: ${doc.methodName} (${doc.sanctuaryZoneLabel})`,
    `Passagem: ${doc.passage}`,
    `Status: ${doc.statusLabel} | Atualizado em: ${doc.updatedAtFormatted}`,
    `------------------------------------------------------------`,
    ``,
  ];

  if (doc.sections.length === 0) {
    lines.push(
      `[Etapas do Estudo]`,
      `Nenhum campo específico preenchido nas etapas intermediárias deste estudo.`,
      ``
    );
  } else {
    for (const section of doc.sections) {
      lines.push(`## ${section.title}`);
      for (const field of section.fields) {
        lines.push(`• ${field.label}:`);
        const indented = field.value
          .split("\n")
          .map((l) => `  ${l}`)
          .join("\n");
        lines.push(indented);
      }
      lines.push(``);
    }
  }

  lines.push(
    `------------------------------------------------------------`,
    `## APLICAÇÃO PESSOAL (REGRA DOS 4Ps)`,
    `${doc.application4P.text}`,
    ``,
    `• Prazo: ${doc.application4P.deadline}`,
    `• Pessoal: ${doc.application4P.isPersonal ? "Sim" : "Não"} | Prático: ${
      doc.application4P.isPractical ? "Sim" : "Não"
    } | Possível: ${doc.application4P.isPossible ? "Sim" : "Não"} | Mensurável: ${
      doc.application4P.isMeasurable ? "Sim" : "Não"
    }`,
    `============================================================`,
    `Gerado por Estudo Bíblico Pessoal PWA - Métodos de Rick Warren`
  );

  return lines.join("\n");
}

/**
 * Converte uma string UTF-8 para sequência escapada compatível com PDF WinAnsiEncoding (Windows-1252 / Latin-1).
 * Preserva 100% da acentuação em português (á, é, í, ó, ú, ã, õ, â, ê, ô, ç, etc.).
 */
function encodePdfWinAnsiLiteral(input: string): string {
  const normalized = input
    .replace(/\u2713|\u2714/g, "[Sim]")
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u2022/g, "-")
    .replace(/\u2026/g, "...");

  let out = "(";
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if (code === 0x28 || code === 0x29 || code === 0x5c) {
      // Escapa '(', ')', '\'
      out += "\\" + String.fromCharCode(code);
    } else if (code >= 0x20 && code <= 0x7e) {
      out += String.fromCharCode(code);
    } else if (code >= 0xa0 && code <= 0xff) {
      // Caracteres acentuados Latin-1 (ex: ã, ç, é, ê, ó) em octal PDF
      out += "\\" + code.toString(8).padStart(3, "0");
    } else {
      out += " ";
    }
  }
  out += ")";
  return out;
}

function wrapTextLines(text: string, maxCharsPerLine: number): string[] {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trimEnd();
    if (!trimmed) {
      lines.push("");
      continue;
    }
    const words = trimmed.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines.length > 0 ? lines : [""];
}

/**
 * Gera os bytes de um arquivo PDF 1.4 válido, multipágina, formatado segundo a paleta do Tabernáculo
 * e contendo todos os dados do estudo bíblico (sem depender de bibliotecas externas pesadas).
 */
export function generateStudyPdfBytes(study: Study): Uint8Array {
  const doc = formatStudyToDocument(study);

  const PAGE_WIDTH = 595.28; // A4 pt
  const PAGE_HEIGHT = 841.89; // A4 pt
  const MARGIN_X = 48;
  const TOP_Y = PAGE_HEIGHT - 56;
  const BOTTOM_Y = 58;

  const pagesCommands: string[][] = [];
  let currentCommands: string[] = [];
  let cursorY = TOP_Y;

  const startNewPage = (isFirstPage: boolean) => {
    if (currentCommands.length > 0) {
      pagesCommands.push(currentCommands);
    }
    currentCommands = [];
    cursorY = TOP_Y;

    // Cabeçalho decorativo na primeira página
    if (isFirstPage) {
      // Faixa azul-marinho do Tabernáculo (#1B2A4A -> 0.106, 0.165, 0.290)
      currentCommands.push(
        `0.106 0.165 0.290 rg`,
        `${MARGIN_X} ${PAGE_HEIGHT - 108} ${PAGE_WIDTH - MARGIN_X * 2} 62 re f`,
        // Linha dourada (#C5A059 -> 0.773, 0.627, 0.349)
        `0.773 0.627 0.349 RG 2 w`,
        `${MARGIN_X} ${PAGE_HEIGHT - 108} m ${PAGE_WIDTH - MARGIN_X} ${
          PAGE_HEIGHT - 108
        } l S`
      );

      // Subtítulo do Método em Dourado
      const methodHeader = `METODO #${doc.methodOrder}: ${doc.methodName.toUpperCase()} (${doc.sanctuaryZoneLabel.toUpperCase()})`;
      currentCommands.push(
        `BT /F2 8.5 Tf 0.898 0.784 0.525 rg ${MARGIN_X + 14} ${
          PAGE_HEIGHT - 66
        } Td ${encodePdfWinAnsiLiteral(methodHeader)} Tj ET`
      );

      // Título Principal em Branco
      const safeTitle =
        doc.title.length > 62 ? doc.title.slice(0, 59) + "..." : doc.title;
      currentCommands.push(
        `BT /F2 15 Tf 1 1 1 rg ${MARGIN_X + 14} ${
          PAGE_HEIGHT - 86
        } Td ${encodePdfWinAnsiLiteral(safeTitle)} Tj ET`
      );

      // Metadados (Passagem, Status e Data)
      const metaLine = `Passagem: ${doc.passage}   |   Status: ${doc.statusLabel}   |   Data: ${doc.updatedAtFormatted}`;
      currentCommands.push(
        `BT /F1 9 Tf 0.88 0.90 0.94 rg ${MARGIN_X + 14} ${
          PAGE_HEIGHT - 101
        } Td ${encodePdfWinAnsiLiteral(metaLine)} Tj ET`
      );

      cursorY = PAGE_HEIGHT - 132;
    } else {
      // Cabeçalho compacto para páginas seguintes
      currentCommands.push(
        `0.773 0.627 0.349 RG 0.8 w`,
        `${MARGIN_X} ${PAGE_HEIGHT - 48} m ${PAGE_WIDTH - MARGIN_X} ${
          PAGE_HEIGHT - 48
        } l S`,
        `BT /F1 8.5 Tf 0.45 0.45 0.45 rg ${MARGIN_X} ${
          PAGE_HEIGHT - 42
        } Td ${encodePdfWinAnsiLiteral(
          `${doc.title} - ${doc.methodName} (${doc.passage})`
        )} Tj ET`
      );
      cursorY = PAGE_HEIGHT - 68;
    }
  };

  const ensureSpace = (neededPt: number) => {
    if (cursorY - neededPt < BOTTOM_Y) {
      startNewPage(false);
    }
  };

  const drawSectionHeading = (heading: string) => {
    ensureSpace(34);
    cursorY -= 8;
    currentCommands.push(
      `0.965 0.949 0.910 rg`,
      `${MARGIN_X} ${cursorY - 16} ${PAGE_WIDTH - MARGIN_X * 2} 22 re f`,
      `0.773 0.627 0.349 RG 1.5 w`,
      `${MARGIN_X} ${cursorY + 6} m ${MARGIN_X} ${cursorY - 16} l S`,
      `BT /F2 11 Tf 0.106 0.165 0.290 rg ${MARGIN_X + 8} ${
        cursorY - 9
      } Td ${encodePdfWinAnsiLiteral(heading)} Tj ET`
    );
    cursorY -= 28;
  };

  const drawField = (label: string, value: string) => {
    const wrapped = wrapTextLines(value, 84);
    ensureSpace(28);

    // Rótulo em negrito
    currentCommands.push(
      `BT /F2 9.5 Tf 0.18 0.22 0.30 rg ${MARGIN_X + 4} ${cursorY} Td ${encodePdfWinAnsiLiteral(
        label + ":"
      )} Tj ET`
    );
    cursorY -= 14;

    // Linhas do conteúdo
    for (const line of wrapped) {
      ensureSpace(15);
      if (line.trim().length > 0) {
        currentCommands.push(
          `BT /F1 10 Tf 0.15 0.15 0.15 rg ${MARGIN_X + 10} ${cursorY} Td ${encodePdfWinAnsiLiteral(
            line
          )} Tj ET`
        );
      }
      cursorY -= 13.5;
    }
    cursorY -= 5;
  };

  // Inicia a Página 1
  startNewPage(true);

  if (doc.sections.length === 0) {
    drawSectionHeading("Conteúdo do Estudo");
    drawField(
      "Etapas do Método",
      "Nenhum campo específico foi registrado nas etapas intermediárias deste estudo."
    );
  } else {
    for (const section of doc.sections) {
      drawSectionHeading(section.title);
      for (const field of section.fields) {
        drawField(field.label, field.value);
      }
    }
  }

  // Seção da Regra dos 4Ps
  drawSectionHeading("Aplicação Pessoal (Regra dos 4Ps)");
  drawField("Passo de Ação Prático", doc.application4P.text);
  drawField("Prazo de Cumprimento", doc.application4P.deadline);
  drawField(
    "Critérios Validados (4Ps)",
    `Pessoal: ${doc.application4P.isPersonal ? "Sim" : "Não"}   |   Prático: ${
      doc.application4P.isPractical ? "Sim" : "Não"
    }   |   Possível: ${
      doc.application4P.isPossible ? "Sim" : "Não"
    }   |   Mensurável: ${doc.application4P.isMeasurable ? "Sim" : "Não"}`
  );

  if (currentCommands.length > 0) {
    pagesCommands.push(currentCommands);
  }

  const totalPages = pagesCommands.length;
  // Adiciona rodapé em todas as páginas
  pagesCommands.forEach((cmds, idx) => {
    const footerLeft =
      "Estudo Bíblico Pessoal PWA • 12 Métodos de Estudo Bíblico (Rick Warren)";
    const footerRight = `Página ${idx + 1} de ${totalPages}`;
    cmds.push(
      `0.82 0.80 0.75 RG 0.5 w`,
      `${MARGIN_X} 42 m ${PAGE_WIDTH - MARGIN_X} 42 l S`,
      `BT /F1 8 Tf 0.45 0.45 0.45 rg ${MARGIN_X} 29 Td ${encodePdfWinAnsiLiteral(
        footerLeft
      )} Tj ET`,
      `BT /F1 8 Tf 0.45 0.45 0.45 rg ${
        PAGE_WIDTH - MARGIN_X - 65
      } 29 Td ${encodePdfWinAnsiLiteral(footerRight)} Tj ET`
    );
  });

  // Monta os objetos PDF 1.4
  // Objeto 1: Catalog
  // Objeto 2: Pages
  // Objeto 3: Font F1 (Helvetica WinAnsiEncoding)
  // Objeto 4: Font F2 (Helvetica-Bold WinAnsiEncoding)
  // Objetos 5..(4 + totalPages * 2): pares (Page, ContentStream)
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    pageObjectIds.push(5 + i * 2);
  }

  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${totalPages} >>\nendobj`
  );
  objects.push(
    `3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj`
  );
  objects.push(
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj`
  );

  for (let i = 0; i < totalPages; i++) {
    const pageObjId = 5 + i * 2;
    const contentObjId = pageObjId + 1;
    const streamData = pagesCommands[i].join("\n");

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream\nendobj`
    );
  }

  let pdfText = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdfText.length);
    pdfText += obj + "\n";
  }

  const xrefOffset = pdfText.length;
  pdfText += `xref\n0 ${objects.length + 1}\n`;
  pdfText += `0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdfText += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdfText += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(pdfText.length);
  for (let i = 0; i < pdfText.length; i++) {
    bytes[i] = pdfText.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/**
 * Dispara o download direto do estudo em formato .pdf no navegador.
 */
export function downloadStudyPdf(study: Study): void {
  const bytes = generateStudyPdfBytes(study);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${study.book || "estudo"}-${study.chapter || "geral"}-${
    study.methodId
  }.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
