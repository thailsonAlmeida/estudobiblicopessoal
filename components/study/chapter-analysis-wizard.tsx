"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Microscope,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  Search,
  Link2,
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

export interface ChapterAnalysisWizardProps {
  studyId: string;
  initialStudy?: Study;
  onComplete?: (study: Study) => void;
}

const VALIDATION_ERROR_MSG =
  "Para concluir o estudo, marque os 4 critérios da aplicação (Pessoal, Prática, Possível e Provável) e descreva o passo de ação mensurável.";

const APPENDIX_F_TARGETS = [
  { id: "repeticoes", label: "Repetições de palavras e frases-chave" },
  { id: "contrastes", label: "Contrastes ('mas', 'porém', luz vs. trevas)" },
  { id: "comparacoes", label: "Comparações e metáforas ('como', 'assim como')" },
  {
    id: "causa_efeito",
    label: "Relações de causa e efeito ('portanto', 'porque')",
  },
  { id: "climax", label: "Clímax e ponto de virada da narrativa" },
  {
    id: "verbos_tempos",
    label: "Força dos verbos (imperativos, promessas e tempos)",
  },
  { id: "conectivos", label: "Conectivos lógicos e progressão do argumento" },
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

export function ChapterAnalysisWizard({
  studyId,
  initialStudy,
  onComplete,
}: ChapterAnalysisWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(
    initialStudy?.currentStep || 1
  );
  const [book, setBook] = useState(initialStudy?.book || "");
  const [chapter, setChapter] = useState(
    initialStudy?.chapter !== undefined ? String(initialStudy.chapter) : ""
  );
  const [title, setTitle] = useState(initialStudy?.title || "");

  // Fase 1: Etapa 1 (Resumo) + Etapa 2 (Apêndice F e Observações Detalhadas)
  const [chapterSummary, setChapterSummary] = useState(
    getStringField(fd, "chapterSummary")
  );
  const [appendixFChecked, setAppendixFChecked] = useState<string[]>(
    getStringArrayField(fd, "appendixFChecked")
  );
  const [detailedObservations, setDetailedObservations] = useState(
    getStringField(fd, "detailedObservations")
  );

  // Fase 2: Etapa 3 (Interpretação) + Etapa 4 (Correlação)
  const [interpretationQuestions, setInterpretationQuestions] = useState(
    getStringField(fd, "interpretationQuestions")
  );
  const [scriptureCorrelation, setScriptureCorrelation] = useState(
    getStringField(fd, "scriptureCorrelation")
  );

  // Fase 3: Etapa 5 (Possíveis Aplicações) + Etapa 6 (Considerações Finais) + Etapa 7 (4Ps)
  const [possibleApplications, setPossibleApplications] = useState(
    getStringField(fd, "possibleApplications")
  );
  const [finalConsiderations, setFinalConsiderations] = useState(
    getStringField(fd, "finalConsiderations")
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
        setChapter(
          existing.chapter !== undefined ? String(existing.chapter) : ""
        );
        setTitle(existing.title || "");
        setChapterSummary(getStringField(data, "chapterSummary"));
        setAppendixFChecked(getStringArrayField(data, "appendixFChecked"));
        setDetailedObservations(getStringField(data, "detailedObservations"));
        setInterpretationQuestions(
          getStringField(data, "interpretationQuestions")
        );
        setScriptureCorrelation(getStringField(data, "scriptureCorrelation"));
        setPossibleApplications(getStringField(data, "possibleApplications"));
        setFinalConsiderations(getStringField(data, "finalConsiderations"));
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

  const parseChapterNum = (val: string): number | undefined => {
    const parsed = Number.parseInt(val, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  const buildStudyRecord = (completedOverride?: {
    status: "draft" | "completed";
    completedAt?: string;
  }): Study => {
    const now = new Date().toISOString();
    const resolvedTitle =
      title.trim() ||
      (book.trim()
        ? `Análise de Capítulo: ${book.trim()}${chapter ? ` ${chapter}` : ""}`
        : "Método Analítico de Capítulo");

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
      methodId: "10_ANALITICO_CAPITULO",
      title: resolvedTitle,
      book,
      chapter: parseChapterNum(chapter),
      verses: "",
      status,
      currentStep,
      formData: {
        chapterSummary,
        appendixFChecked,
        detailedObservations,
        interpretationQuestions,
        scriptureCorrelation,
        possibleApplications,
        finalConsiderations,
      },
      application4P: app4P,
      tags: ["analitico-capitulo", "observacao", "trilogia"],
      createdAt: createdAtRef || now,
      updatedAt: now,
      completedAt: resolvedCompletedAt,
    };
  };

  // Auto-save com debounce de 600ms quando livro ou título estiver preenchido
  useEffect(() => {
    if (book.trim() === "" && title.trim() === "") {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const now = new Date().toISOString();
        const resolvedTitle =
          title.trim() ||
          `Análise de Capítulo: ${book.trim()}${chapter ? ` ${chapter}` : ""}`;
        const parsedChapter = Number.parseInt(chapter, 10);

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
          methodId: "10_ANALITICO_CAPITULO",
          title: resolvedTitle,
          book,
          chapter:
            Number.isFinite(parsedChapter) && parsedChapter > 0
              ? parsedChapter
              : undefined,
          verses: "",
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            chapterSummary,
            appendixFChecked,
            detailedObservations,
            interpretationQuestions,
            scriptureCorrelation,
            possibleApplications,
            finalConsiderations,
          },
          application4P: app4P,
          tags: ["analitico-capitulo", "observacao", "trilogia"],
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
    chapter,
    title,
    chapterSummary,
    appendixFChecked,
    detailedObservations,
    interpretationQuestions,
    scriptureCorrelation,
    possibleApplications,
    finalConsiderations,
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

  const toggleAppendixTarget = (targetId: string) => {
    markDirty();
    setAppendixFChecked((prev) =>
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId]
    );
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
            "10_ANALITICO_CAPITULO",
            now.split("T")[0]
          )
        );
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error("Erro ao concluir análise de capítulo:", err);
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
            <Badge variant="gold">Método 10</Badge>
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
            Método Analítico de Capítulo
          </h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Resumo & Observação (Apêndice F)" },
            { num: 2, label: "2. Interpretação & Correlação" },
            { num: 3, label: "3. Síntese & 4Ps" },
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

      {/* FASE 1: RESUMO & OBSERVAÇÃO (APÊNDICE F) */}
      {currentStep === 1 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Microscope className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Fase 1: O Microscópio — Observação Detalhada
              </CardTitle>
              <PrincipleDrawer
                stepTitle="O Lápis é o Melhor Olho (Grande Trilogia — Passo 2)"
                theologicalPrinciple="Quanto mais tempo você gasta observando o que o texto realmente diz, mais precisas e profundas serão sua interpretação e aplicação."
                whyThisStep="Não interprete antes de observar! Use os alvos do Apêndice F para enxergar detalhes gramaticais que leitores apressados ignoram."
                goldenTip="Anote cada observação, mesmo as aparentemente óbvias — frequentemente são elas que abrem a porta do capítulo."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="ch-analysis-book"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Livro Bíblico
                </label>
                <Input
                  id="ch-analysis-book"
                  value={book}
                  onChange={(e) => {
                    markDirty();
                    setBook(e.target.value);
                  }}
                  placeholder="Ex.: Romanos"
                />
              </div>

              <div>
                <label
                  htmlFor="ch-analysis-chapter"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Capítulo
                </label>
                <Input
                  id="ch-analysis-chapter"
                  type="number"
                  min={1}
                  value={chapter}
                  onChange={(e) => {
                    markDirty();
                    setChapter(e.target.value);
                  }}
                  placeholder="Ex.: 8"
                />
              </div>

              <div>
                <label
                  htmlFor="ch-analysis-title"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Título Descritivo
                </label>
                <Input
                  id="ch-analysis-title"
                  value={title}
                  onChange={(e) => {
                    markDirty();
                    setTitle(e.target.value);
                  }}
                  placeholder="Ex.: Vida no Espírito"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="ch-analysis-summary"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Descrição Resumida do Capítulo (Etapa 1)
              </label>
              <Textarea
                id="ch-analysis-summary"
                rows={3}
                value={chapterSummary}
                onChange={(e) => {
                  markDirty();
                  setChapterSummary(e.target.value);
                }}
                placeholder="Resuma o fluxo e os principais eventos ou argumentos deste capítulo..."
              />
            </div>

            {/* Checklist do Apêndice F */}
            <div className="rounded-2xl border border-[var(--tabernacle-gold)]/30 bg-[var(--tabernacle-gold)]/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Search className="h-4 w-4 text-[var(--tabernacle-gold)]" />
                  Inspeção do Apêndice F — O que observar no texto
                </span>
                <Badge variant="gold" className="text-[10px]">
                  {appendixFChecked.length} de {APPENDIX_F_TARGETS.length} itens
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {APPENDIX_F_TARGETS.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={appendixFChecked.includes(item.id)}
                      onChange={() => toggleAppendixTarget(item.id)}
                      className="mt-0.5 h-4 w-4 rounded border-border text-[var(--tabernacle-gold)] cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="ch-analysis-observations"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Observações Detalhadas — O que o texto diz? (Etapa 2)
              </label>
              <Textarea
                id="ch-analysis-observations"
                rows={4}
                value={detailedObservations}
                onChange={(e) => {
                  markDirty();
                  setDetailedObservations(e.target.value);
                }}
                placeholder="Liste versículo a versículo tudo o que você enxergou usando a lista do Apêndice F..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="gap-2 cursor-pointer"
              >
                <span>Avançar: Interpretação & Correlação</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: INTERPRETAÇÃO & CORRELAÇÃO */}
      {currentStep === 2 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Link2 className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Fase 2: Interpretação & Correlação Bíblica
              </CardTitle>
              <PrincipleDrawer
                stepTitle="A Escritura Interpreta a Escritura"
                theologicalPrinciple="Depois de observar o que o texto DIZ, investigue o que ele SIGNIFICA comparando-o com o restante da Palavra de Deus."
                whyThisStep="Responder às perguntas de significado (Etapa 3) e conectar referências cruzadas paralelas (Etapa 4) impede interpretações particulares isoladas."
                goldenTip="Pergunte sempre: por que o autor disse isto? O que significou para seus leitores? Há outra passagem que esclarece este ponto?"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label
                htmlFor="ch-analysis-interpretation"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Interpretação — O que o texto significa? (Etapa 3)
              </label>
              <Textarea
                id="ch-analysis-interpretation"
                rows={5}
                value={interpretationQuestions}
                onChange={(e) => {
                  markDirty();
                  setInterpretationQuestions(e.target.value);
                }}
                placeholder="Liste suas perguntas interpretativas ('Por quê?', 'O que significa?') e as respostas extraídas do texto..."
              />
            </div>

            <div>
              <label
                htmlFor="ch-analysis-correlation"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Correlação com Outras Escrituras (Etapa 4)
              </label>
              <Textarea
                id="ch-analysis-correlation"
                rows={5}
                value={scriptureCorrelation}
                onChange={(e) => {
                  markDirty();
                  setScriptureCorrelation(e.target.value);
                }}
                placeholder="Conecte referências cruzadas, citações do Antigo Testamento e passagens paralelas que iluminam este capítulo..."
              />
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
                <span>Avançar: Síntese & 4Ps</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: POSSÍVEIS APLICAÇÕES, CONSIDERAÇÕES & 4PS */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Considerações Finais & Aplicação Pessoal (4Ps)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Da Mente para a Vida Diária"
                theologicalPrinciple="Não devemos apenas acumular dezenas de possíveis lições sem escolher pelo menos uma para praticar imediatamente."
                whyThisStep="A Etapa 5 lista todas as aplicações potenciais; a Etapa 6 guarda dúvidas para pesquisa futura; a Etapa 7 seleciona UMA ação 4Ps para hoje."
                goldenTip="Escolha a aplicação mais urgente para sua semana e marque um prazo verificável."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="ch-analysis-possible-apps"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Possíveis Aplicações Identificadas (Etapa 5)
              </label>
              <Textarea
                id="ch-analysis-possible-apps"
                rows={3}
                value={possibleApplications}
                onChange={(e) => {
                  markDirty();
                  setPossibleApplications(e.target.value);
                }}
                placeholder="Liste atitudes a mudar, promessas a crer, pecados a abandonar e ordens a obedecer neste capítulo..."
              />
            </div>

            <div>
              <label
                htmlFor="ch-analysis-final"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Considerações Finais e Dúvidas Futuras (Etapa 6)
              </label>
              <Textarea
                id="ch-analysis-final"
                rows={3}
                value={finalConsiderations}
                onChange={(e) => {
                  markDirty();
                  setFinalConsiderations(e.target.value);
                }}
                placeholder="Quais pontos precisam de pesquisa adicional (morfologia, comentário ou estudo histórico)?"
              />
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="ch-analysis-application"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Aplicação Pessoal Definitiva (Etapa 7 — Regra dos 4Ps)
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
                id="ch-analysis-application"
                rows={3}
                value={applicationText}
                onChange={(e) => {
                  markDirty();
                  setApplicationText(e.target.value);
                }}
                placeholder="Redija o seu compromisso prático selecionado para viver esta semana..."
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
                  htmlFor="ch-analysis-deadline"
                  className="text-[11px] font-semibold text-muted-foreground block mb-1"
                >
                  Prazo para Cumprimento:
                </label>
                <Input
                  id="ch-analysis-deadline"
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => {
                    markDirty();
                    setDeadline(e.target.value);
                  }}
                  placeholder="Ex.: Nos próximos 7 dias"
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
                methodId="10_ANALITICO_CAPITULO"
                title="Análise de Capítulo Concluída!"
                subtitle={`Suas observações e interpretações de "${book || "Capítulo"} ${chapter}" foram gravadas no diário.`}
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
