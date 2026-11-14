"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  Plus,
  Trash2,
  Columns3,
  BookOpenCheck,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildUpdatedUserProgress } from "@/lib/gamification/progress-calculator";
import { playSoftShofarSound } from "@/lib/gamification/celebration-sound";
import { StudyCompletionCard } from "./study-completion-card";
import {
  Study,
  Application4P,
  Application4PSchema,
} from "@/lib/types/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrincipleDrawer } from "./principle-drawer";

export interface HorizontalSection {
  sectionChapters: string;
  sectionTheme: string;
  keyTopics: string;
}

export interface BookSurveyWizardProps {
  studyId: string;
  initialStudy?: Study;
  onComplete?: (study: Study) => void;
}

const VALIDATION_ERROR_MSG =
  "Para concluir o estudo, marque os 4 critérios da aplicação (Pessoal, Prática, Possível e Provável) e descreva o passo de ação mensurável.";

const READING_RULES = [
  {
    id: "1_de_uma_so_vez",
    label: "1. Leia o livro inteiro de uma só vez (visão do todo)",
  },
  {
    id: "2_traducao_moderna",
    label: "2. Use uma tradução contemporânea de leitura fluida",
  },
  {
    id: "3_ignorar_divisoes",
    label: "3. Ignore temporariamente capítulos e números de versículos",
  },
  {
    id: "4_ritmo_rapido",
    label: "4. Mantenha leitura rápida sem parar em detalhes léxicos",
  },
  {
    id: "5_repetidas_vezes",
    label: "5. Releia o livro várias vezes antes de detalhar",
  },
  {
    id: "6_com_oracao",
    label: "6. Leia em espírito de oração buscando a intenção do autor",
  },
  {
    id: "7_com_lapis_na_mao",
    label: "7. Anote suas primeiras impressões com lápis à mão",
  },
];

const DEFAULT_CHART: HorizontalSection[] = [
  { sectionChapters: "", sectionTheme: "", keyTopics: "" },
];

const getStringField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string => {
  const val = formData?.[key];
  return typeof val === "string" ? val : fallback;
};

const getStringArrayField = (
  formData: Record<string, unknown> | undefined,
  key: string
): string[] => {
  const val = formData?.[key];
  if (Array.isArray(val)) {
    return val.filter((item): item is string => typeof item === "string");
  }
  return [];
};

const isHorizontalSection = (val: unknown): val is HorizontalSection => {
  if (typeof val !== "object" || val === null) return false;
  const r = val as Record<string, unknown>;
  return (
    typeof r.sectionChapters === "string" &&
    typeof r.sectionTheme === "string" &&
    typeof r.keyTopics === "string"
  );
};

const getHorizontalChartField = (
  formData: Record<string, unknown> | undefined
): HorizontalSection[] => {
  const val = formData?.horizontalChart;
  if (Array.isArray(val) && val.length > 0 && val.every(isHorizontalSection)) {
    return val;
  }
  return DEFAULT_CHART;
};

export function BookSurveyWizard({
  studyId,
  initialStudy,
  onComplete,
}: BookSurveyWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(
    initialStudy?.currentStep || 1
  );
  const [book, setBook] = useState(initialStudy?.book || "");
  const [title, setTitle] = useState(initialStudy?.title || "");

  // Fase 1: Etapa 1 (7 Regras) + Etapa 2 (Itens de Observação)
  const [readingRulesChecked, setReadingRulesChecked] = useState<string[]>(
    getStringArrayField(fd, "readingRulesChecked")
  );
  const [literaryGenre, setLiteraryGenre] = useState(
    getStringField(fd, "literaryGenre")
  );
  const [firstImpressions, setFirstImpressions] = useState(
    getStringField(fd, "firstImpressions")
  );
  const [keyWords, setKeyWords] = useState(getStringField(fd, "keyWords"));
  const [keyVerse, setKeyVerse] = useState(getStringField(fd, "keyVerse"));
  const [centralTheme, setCentralTheme] = useState(
    getStringField(fd, "centralTheme")
  );

  // Fase 2: Etapa 3 (Pano de Fundo) + Etapa 4 (Quadro Horizontal)
  const [author, setAuthor] = useState(getStringField(fd, "author"));
  const [recipients, setRecipients] = useState(
    getStringField(fd, "recipients")
  );
  const [dateAndPlace, setDateAndPlace] = useState(
    getStringField(fd, "dateAndPlace")
  );
  const [purpose, setPurpose] = useState(getStringField(fd, "purpose"));
  const [horizontalChart, setHorizontalChart] = useState<HorizontalSection[]>(
    getHorizontalChartField(fd)
  );

  // Fase 3: Etapa 5 (Esboço Experimental) + Etapa 6 (Aplicação 4Ps)
  const [tentativeOutline, setTentativeOutline] = useState(
    getStringField(fd, "tentativeOutline")
  );

  const [applicationText, setApplicationText] = useState(
    initialStudy?.application4P?.text || ""
  );
  const [isPersonal, setIsPersonal] = useState(
    initialStudy?.application4P?.isPersonal || false
  );
  const [isPractical, setIsPractical] = useState(
    initialStudy?.application4P?.isPractical || false
  );
  const [isPossible, setIsPossible] = useState(
    initialStudy?.application4P?.isPossible || false
  );
  const [isMeasurable, setIsMeasurable] = useState(
    initialStudy?.application4P?.isMeasurable || false
  );
  const [deadline, setDeadline] = useState(
    initialStudy?.application4P?.deadline || ""
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [isCompleted, setIsCompleted] = useState(
    initialStudy?.status === "completed"
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdAtRef, setCreatedAtRef] = useState<string | undefined>(
    initialStudy?.createdAt
  );
  const [completedAtRef, setCompletedAtRef] = useState<string | undefined>(
    initialStudy?.completedAt
  );

  const [hydrated, setHydrated] = useState(Boolean(initialStudy));
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const markDirty = () => {
    if (!hasUserEdited) {
      setHasUserEdited(true);
    }
  };

  useEffect(() => {
    if (hydrated || hasUserEdited) {
      return;
    }

    let active = true;
    const loader = initialStudy
      ? Promise.resolve(initialStudy)
      : db.studies.get(studyId);

    loader
      .then((existing) => {
        if (!active || !existing || hasUserEdited) return;
        const data = existing.formData;
        setCurrentStep(existing.currentStep || 1);
        setBook(existing.book || "");
        setTitle(existing.title || "");
        setReadingRulesChecked(getStringArrayField(data, "readingRulesChecked"));
        setLiteraryGenre(getStringField(data, "literaryGenre"));
        setFirstImpressions(getStringField(data, "firstImpressions"));
        setKeyWords(getStringField(data, "keyWords"));
        setKeyVerse(getStringField(data, "keyVerse"));
        setCentralTheme(getStringField(data, "centralTheme"));
        setAuthor(getStringField(data, "author"));
        setRecipients(getStringField(data, "recipients"));
        setDateAndPlace(getStringField(data, "dateAndPlace"));
        setPurpose(getStringField(data, "purpose"));
        setHorizontalChart(getHorizontalChartField(data));
        setTentativeOutline(getStringField(data, "tentativeOutline"));
        setApplicationText(existing.application4P?.text || "");
        setIsPersonal(Boolean(existing.application4P?.isPersonal));
        setIsPractical(Boolean(existing.application4P?.isPractical));
        setIsPossible(Boolean(existing.application4P?.isPossible));
        setIsMeasurable(Boolean(existing.application4P?.isMeasurable));
        setDeadline(existing.application4P?.deadline || "");
        setIsCompleted(existing.status === "completed");
        setCreatedAtRef(existing.createdAt);
        setCompletedAtRef(existing.completedAt);
        setHydrated(true);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [initialStudy, studyId, hydrated, hasUserEdited]);

  const buildStudyRecord = (completedOverride?: {
    status: "draft" | "completed";
    completedAt?: string;
  }): Study => {
    const now = new Date().toISOString();
    const resolvedTitle =
      title.trim() ||
      (book.trim()
        ? `Investigação Panorâmica: ${book.trim()}`
        : "Estudo Investigativo do Livro");

    const app4P: Application4P = {
      text: applicationText,
      isPersonal,
      isPractical,
      isPossible,
      isMeasurable,
      deadline,
    };

    const status = completedOverride
      ? completedOverride.status
      : isCompleted
      ? "completed"
      : "draft";

    const resolvedCompletedAt = completedOverride
      ? completedOverride.completedAt
      : isCompleted
      ? completedAtRef || now
      : undefined;

    return {
      id: studyId,
      methodId: "09_INVESTIGATIVO",
      title: resolvedTitle,
      book,
      verses: "",
      status,
      currentStep,
      formData: {
        readingRulesChecked,
        literaryGenre,
        firstImpressions,
        keyWords,
        keyVerse,
        centralTheme,
        author,
        recipients,
        dateAndPlace,
        purpose,
        horizontalChart,
        tentativeOutline,
      },
      application4P: app4P,
      tags: ["investigativo", "panoramico", "trilogia"],
      createdAt: createdAtRef || now,
      updatedAt: now,
      completedAt: resolvedCompletedAt,
    };
  };

  // Auto-save com debounce de 600ms após preenchimento do livro ou título
  useEffect(() => {
    if (book.trim() === "" && title.trim() === "") {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const now = new Date().toISOString();
        const resolvedTitle =
          title.trim() || `Investigação Panorâmica: ${book.trim()}`;
        const app4P: Application4P = {
          text: applicationText,
          isPersonal,
          isPractical,
          isPossible,
          isMeasurable,
          deadline,
        };

        const record: Study = {
          id: studyId,
          methodId: "09_INVESTIGATIVO",
          title: resolvedTitle,
          book,
          verses: "",
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            readingRulesChecked,
            literaryGenre,
            firstImpressions,
            keyWords,
            keyVerse,
            centralTheme,
            author,
            recipients,
            dateAndPlace,
            purpose,
            horizontalChart,
            tentativeOutline,
          },
          application4P: app4P,
          tags: ["investigativo", "panoramico", "trilogia"],
          createdAt: createdAtRef || now,
          updatedAt: now,
          completedAt: isCompleted ? completedAtRef || now : undefined,
        };

        if (!createdAtRef) {
          setCreatedAtRef(now);
        }
        await db.studies.put(record);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Erro no auto-save:", err);
        setSaveStatus("idle");
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    studyId,
    currentStep,
    book,
    title,
    readingRulesChecked,
    literaryGenre,
    firstImpressions,
    keyWords,
    keyVerse,
    centralTheme,
    author,
    recipients,
    dateAndPlace,
    purpose,
    horizontalChart,
    tentativeOutline,
    applicationText,
    isPersonal,
    isPractical,
    isPossible,
    isMeasurable,
    deadline,
    isCompleted,
    createdAtRef,
    completedAtRef,
  ]);

  const toggleReadingRule = (ruleId: string) => {
    markDirty();
    setReadingRulesChecked((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleAddSection = () => {
    markDirty();
    setHorizontalChart((prev) => [
      ...prev,
      { sectionChapters: "", sectionTheme: "", keyTopics: "" },
    ]);
  };

  const handleUpdateSection = (
    index: number,
    field: keyof HorizontalSection,
    value: string
  ) => {
    markDirty();
    setHorizontalChart((prev) =>
      prev.map((sec, idx) => (idx === index ? { ...sec, [field]: value } : sec))
    );
  };

  const handleRemoveSection = (index: number) => {
    if (horizontalChart.length <= 1) return;
    markDirty();
    setHorizontalChart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const all4PsChecked =
    isPersonal && isPractical && isPossible && isMeasurable;

  const handleFinalize = async () => {
    const parsed4P = Application4PSchema.safeParse({
      text: applicationText.trim(),
      isPersonal,
      isPractical,
      isPossible,
      isMeasurable,
      deadline,
    });

    if (
      !parsed4P.success ||
      !all4PsChecked ||
      applicationText.trim().length === 0
    ) {
      setValidationError(VALIDATION_ERROR_MSG);
      return;
    }

    setValidationError(null);
    const now = new Date().toISOString();
    setCompletedAtRef(now);
    setIsCompleted(true);
    playSoftShofarSound();

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#5C2A6B", "#1B4965"],
    });

    const completedRecord = buildStudyRecord({
      status: "completed",
      completedAt: now,
    });

    try {
      await db.transaction("rw", db.studies, db.progress, async () => {
        await db.studies.put(completedRecord);

        const currentProg = await db.progress.get("progress");
        await db.progress.put(
          buildUpdatedUserProgress(
            currentProg,
            "09_INVESTIGATIVO",
            now.split("T")[0]
          )
        );
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error("Erro ao concluir método investigativo:", err);
    }

    onComplete?.(completedRecord);
  };

  const fourPsItems = [
    {
      id: "personal",
      label: '1. Pessoal (usei "Eu", "Mim")',
      checked: isPersonal,
      onChange: (val: boolean) => {
        markDirty();
        setIsPersonal(val);
      },
    },
    {
      id: "practical",
      label: "2. Prático (ação definida)",
      checked: isPractical,
      onChange: (val: boolean) => {
        markDirty();
        setIsPractical(val);
      },
    },
    {
      id: "possible",
      label: "3. Possível (viável pela graça)",
      checked: isPossible,
      onChange: (val: boolean) => {
        markDirty();
        setIsPossible(val);
      },
    },
    {
      id: "measurable",
      label: "4. Provável / Mensurável (prazo definido)",
      checked: isMeasurable,
      onChange: (val: boolean) => {
        markDirty();
        setIsMeasurable(val);
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="gold">Método 09</Badge>
            <Badge variant="gold">Santo dos Santos</Badge>
            <span
              aria-live="polite"
              className="text-[11px] text-muted-foreground font-medium"
            >
              {saveStatus === "saving" && "• Salvando..."}
              {saveStatus === "saved" && "✓ Salvo automaticamente"}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            Método Investigativo do Livro
          </h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Leitura & 9 Observações" },
            { num: 2, label: "2. Fundo & Quadro Horizontal" },
            { num: 3, label: "3. Esboço & 4Ps" },
          ].map((fase) => (
            <button
              key={fase.num}
              type="button"
              onClick={() => setCurrentStep(fase.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStep === fase.num
                  ? "bg-[var(--tabernacle-gold)] text-stone-950 shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {fase.label}
            </button>
          ))}
        </div>
      </div>

      {/* FASE 1: LEITURA PANORÂMICA & OBSERVAÇÕES */}
      {currentStep === 1 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Eye className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Fase 1: Visão Telescópica & As 7 Regras de Leitura
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Visão do Arranha-Céu (Grande Trilogia — Passo 1)"
                theologicalPrinciple="Antes de usar o microscópio (Método 10) para examinar versículos isolados, suba ao alto do edifício e veja como todas as ruas se conectam."
                whyThisStep="A leitura contínua sem pausas revela a emoção, o ritmo argumentativo e o fio condutor do livro bíblico inteiro."
                goldenTip="Para cartas menores (Filipenses, Efésios, Tiago, 1 João), leia o livro inteiro em voz alta em menos de 20 minutos."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="survey-book"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Livro Investigado
                </label>
                <Input
                  id="survey-book"
                  value={book}
                  onChange={(e) => {
                    markDirty();
                    setBook(e.target.value);
                  }}
                  placeholder="Ex.: Filipenses, Jonas, Habacuque..."
                />
              </div>

              <div>
                <label
                  htmlFor="survey-title"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Título do Estudo Investigativo
                </label>
                <Input
                  id="survey-title"
                  value={title}
                  onChange={(e) => {
                    markDirty();
                    setTitle(e.target.value);
                  }}
                  placeholder="Ex.: A Alegria Inabalável em Cristo (Filipenses)"
                />
              </div>
            </div>

            {/* Checklist das 7 Regras de Leitura */}
            <div className="rounded-2xl border border-[var(--tabernacle-gold)]/30 bg-[var(--tabernacle-gold)]/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <BookOpenCheck className="h-4 w-4 text-[var(--tabernacle-gold)]" />
                  Checklist das 7 Regras da Leitura Panorâmica (Etapa 1)
                </span>
                <Badge variant="gold" className="text-[10px]">
                  {readingRulesChecked.length} de 7 marcadas
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {READING_RULES.map((rule) => (
                  <label
                    key={rule.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={readingRulesChecked.includes(rule.id)}
                      onChange={() => toggleReadingRule(rule.id)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-[var(--tabernacle-gold)] cursor-pointer"
                    />
                    <span>{rule.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Itens de Observação Panorâmica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="survey-genre"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Gênero Literário (Etapa 2)
                </label>
                <Input
                  id="survey-genre"
                  value={literaryGenre}
                  onChange={(e) => {
                    markDirty();
                    setLiteraryGenre(e.target.value);
                  }}
                  placeholder="Ex.: Epístola pastoral, Poesia, Profecia, Evangelho..."
                />
              </div>

              <div>
                <label
                  htmlFor="survey-keyverse"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Versículo-Chave do Livro (Etapa 2)
                </label>
                <Input
                  id="survey-keyverse"
                  value={keyVerse}
                  onChange={(e) => {
                    markDirty();
                    setKeyVerse(e.target.value);
                  }}
                  placeholder="Ex.: Fp 1:21 — O viver é Cristo..."
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="survey-impressions"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Primeiras Impressões e Emoção/Tom (Etapa 2)
              </label>
              <Textarea
                id="survey-impressions"
                rows={3}
                value={firstImpressions}
                onChange={(e) => {
                  markDirty();
                  setFirstImpressions(e.target.value);
                }}
                placeholder="Qual o tom predominante (alegria, urgência, lamento, louvor)? Quais personagens e problemas saltaram aos olhos?"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="survey-keywords"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Palavras-Chave Repetidas (Etapa 2)
                </label>
                <Input
                  id="survey-keywords"
                  value={keyWords}
                  onChange={(e) => {
                    markDirty();
                    setKeyWords(e.target.value);
                  }}
                  placeholder="Ex.: Alegria, regozijo, evangelho, mente..."
                />
              </div>

              <div>
                <label
                  htmlFor="survey-theme"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Tema Central (Etapa 2)
                </label>
                <Input
                  id="survey-theme"
                  value={centralTheme}
                  onChange={(e) => {
                    markDirty();
                    setCentralTheme(e.target.value);
                  }}
                  placeholder="Em uma frase: do que trata este livro?"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="gap-2 cursor-pointer"
              >
                <span>Avançar: Fundo & Quadro Horizontal</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: PANO DE FUNDO & QUADRO HORIZONTAL */}
      {currentStep === 2 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Columns3 className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Fase 2: Pano de Fundo & Quadro Horizontal do Livro
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Mapeando o Terreno em Colunas"
                theologicalPrinciple="Um Quadro Horizontal coloca todo o livro em uma única folha panorâmica, mostrando transições de assunto e divisões naturais."
                whyThisStep="Combinar quem escreveu, para quem e por que (Etapa 3) com o Quadro Horizontal (Etapa 4) revela a arquitetura pensada pelo autor."
                goldenTip="Crie uma seção no Quadro Horizontal para cada grande bloco ou mudança de assunto no livro (geralmente de 3 a 6 seções)."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Etapa 3: Pano de Fundo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="survey-author"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Autor (Etapa 3)
                </label>
                <Input
                  id="survey-author"
                  value={author}
                  onChange={(e) => {
                    markDirty();
                    setAuthor(e.target.value);
                  }}
                  placeholder="Quem escreveu e qual era sua condição?"
                />
              </div>

              <div>
                <label
                  htmlFor="survey-recipients"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Destinatários (Etapa 3)
                </label>
                <Input
                  id="survey-recipients"
                  value={recipients}
                  onChange={(e) => {
                    markDirty();
                    setRecipients(e.target.value);
                  }}
                  placeholder="Para quem o livro foi endereçado?"
                />
              </div>

              <div>
                <label
                  htmlFor="survey-date"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Data e Local (Etapa 3)
                </label>
                <Input
                  id="survey-date"
                  value={dateAndPlace}
                  onChange={(e) => {
                    markDirty();
                    setDateAndPlace(e.target.value);
                  }}
                  placeholder="Ex.: Cerca de 61 d.C., prisão em Roma"
                />
              </div>

              <div>
                <label
                  htmlFor="survey-purpose"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Propósito do Autor (Etapa 3)
                </label>
                <Input
                  id="survey-purpose"
                  value={purpose}
                  onChange={(e) => {
                    markDirty();
                    setPurpose(e.target.value);
                  }}
                  placeholder="Por que este livro foi escrito naquela ocasião?"
                />
              </div>
            </div>

            {/* Etapa 4: Quadro Horizontal Dinâmico */}
            <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Quadro Horizontal do Livro (Etapa 4)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Divida o livro horizontalmente por blocos de capítulos e
                    resuma seu foco central.
                  </p>
                </div>
                <Badge variant="gold">
                  {horizontalChart.length}{" "}
                  {horizontalChart.length === 1 ? "Seção" : "Seções"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {horizontalChart.map((section, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border bg-card p-3 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--tabernacle-gold)]">
                        Seção {idx + 1}
                      </span>
                      {horizontalChart.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remover seção ${idx + 1}`}
                          onClick={() => handleRemoveSection(idx)}
                          className="h-7 px-2 text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <Input
                      aria-label={`Capítulos da seção ${idx + 1}`}
                      value={section.sectionChapters}
                      onChange={(e) =>
                        handleUpdateSection(
                          idx,
                          "sectionChapters",
                          e.target.value
                        )
                      }
                      placeholder="Capítulos / Divisão (ex.: Cap. 1-2)"
                    />

                    <Input
                      aria-label={`Tema da seção ${idx + 1}`}
                      value={section.sectionTheme}
                      onChange={(e) =>
                        handleUpdateSection(idx, "sectionTheme", e.target.value)
                      }
                      placeholder="Tema principal da seção"
                    />

                    <Textarea
                      aria-label={`Tópicos da seção ${idx + 1}`}
                      rows={2}
                      value={section.keyTopics}
                      onChange={(e) =>
                        handleUpdateSection(idx, "keyTopics", e.target.value)
                      }
                      placeholder="Palavras-chave e acontecimentos da seção..."
                    />
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddSection}
                className="w-full gap-2 border-dashed cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Seção ao Quadro</span>
              </Button>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="gap-2 cursor-pointer"
              >
                <span>Avançar: Esboço & 4Ps</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: ESBOÇO EXPERIMENTAL & 4PS */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Esboço Experimental & Aplicação Pessoal (4Ps)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Esboço Provisório — Pronto para o Método 10"
                theologicalPrinciple="No Método Investigativo seu esboço ainda é experimental; após analisar cada capítulo no Método 10, você o refinará no Método Sintético (11)."
                whyThisStep="Mesmo um estudo panorâmico precisa resultar em obediência prática imediata pela Regra dos 4Ps."
                goldenTip="Organize o esboço experimental usando as divisões que você acabou de descobrir no Quadro Horizontal."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="survey-outline"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Esboço Experimental do Livro (Etapa 5)
              </label>
              <Textarea
                id="survey-outline"
                rows={5}
                value={tentativeOutline}
                onChange={(e) => {
                  markDirty();
                  setTentativeOutline(e.target.value);
                }}
                placeholder={"I. Introdução e Propósito (Cap. 1)\nII. Desenvolvimento Central...\nIII. Chamado Final..."}
              />
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="survey-application"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Aplicação Pessoal (Etapa 6 — Regra dos 4Ps)
                </label>
                {all4PsChecked ? (
                  <Badge variant="blue" className="text-[10px]">
                    4Ps Validados ✓
                  </Badge>
                ) : (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                    Marque os 4 critérios para concluir
                  </span>
                )}
              </div>

              <Textarea
                id="survey-application"
                rows={3}
                value={applicationText}
                onChange={(e) => {
                  markDirty();
                  setApplicationText(e.target.value);
                }}
                placeholder="Qual verdade panorâmica deste livro exige obediência imediata minha?"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {fourPsItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-[var(--tabernacle-gold)] cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label
                  htmlFor="survey-deadline"
                  className="text-[11px] font-semibold text-muted-foreground block mb-1"
                >
                  Prazo para Cumprimento:
                </label>
                <Input
                  id="survey-deadline"
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => {
                    markDirty();
                    setDeadline(e.target.value);
                  }}
                  placeholder="Ex.: Até domingo"
                />
              </div>
            </div>

            {validationError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {isCompleted ? (
              <StudyCompletionCard
                methodId="09_INVESTIGATIVO"
                title="Investigação Panorâmica Concluída!"
                subtitle={`O Quadro Horizontal e o esboço experimental de "${book || title}" estão salvos no seu diário.`}
                onEdit={() => setIsCompleted(false)}
              />
            ) : (
              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="gap-2 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>
                <Button
                  type="button"
                  variant="gold"
                  onClick={handleFinalize}
                  className="gap-2 font-bold cursor-pointer"
                >
                  <Flame className="h-4 w-4 fill-current" />
                  <span>Concluir e Acender Menorá</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
