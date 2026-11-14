"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  TableProperties,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  Plus,
  Trash2,
  BookOpen,
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

export interface VerseRow {
  verseRef: string;
  personalParaphrase: string;
  questionsAnswersObservations: string;
  crossReferences: string;
  discoveries: string;
  briefApplication: string;
}

export interface VerseByVerseWizardProps {
  studyId: string;
  initialStudy?: Study;
  onComplete?: (study: Study) => void;
}

const VALIDATION_ERROR_MSG =
  "Para concluir o estudo, marque os 4 critérios da aplicação (Pessoal, Prática, Possível e Provável) e descreva o passo de ação mensurável.";

const EMPTY_VERSE_ROW: VerseRow = {
  verseRef: "",
  personalParaphrase: "",
  questionsAnswersObservations: "",
  crossReferences: "",
  discoveries: "",
  briefApplication: "",
};

const getStringField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string => {
  const val = formData?.[key];
  return typeof val === "string" ? val : fallback;
};

const isVerseRow = (val: unknown): val is VerseRow => {
  if (typeof val !== "object" || val === null) return false;
  const r = val as Record<string, unknown>;
  return (
    typeof r.verseRef === "string" &&
    typeof r.personalParaphrase === "string" &&
    typeof r.questionsAnswersObservations === "string" &&
    typeof r.crossReferences === "string" &&
    typeof r.discoveries === "string" &&
    typeof r.briefApplication === "string"
  );
};

const getVerseRowsField = (
  formData: Record<string, unknown> | undefined
): VerseRow[] => {
  const val = formData?.verseRows;
  if (Array.isArray(val) && val.length > 0 && val.every(isVerseRow)) {
    return val;
  }
  return [{ ...EMPTY_VERSE_ROW }];
};

export function VerseByVerseWizard({
  studyId,
  initialStudy,
  onComplete,
}: VerseByVerseWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(
    initialStudy?.currentStep || 1
  );
  // Fase 1: Escopo
  const [title, setTitle] = useState(initialStudy?.title || "");
  const [book, setBook] = useState(initialStudy?.book || "");
  const [chapter, setChapter] = useState(
    initialStudy?.chapter !== undefined ? String(initialStudy.chapter) : ""
  );
  const [verses, setVerses] = useState(initialStudy?.verses || "");
  const [passageOverview, setPassageOverview] = useState(
    getStringField(fd, "passageOverview")
  );

  // Fase 2: Quadro Dinâmico de 6 Colunas (Versículo por Versículo)
  const [verseRows, setVerseRows] = useState<VerseRow[]>(
    getVerseRowsField(fd)
  );

  // Fase 3: Síntese & Aplicação Final 4Ps
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
        setTitle(existing.title || "");
        setBook(existing.book || "");
        setChapter(
          existing.chapter !== undefined ? String(existing.chapter) : ""
        );
        setVerses(existing.verses || "");
        setPassageOverview(getStringField(data, "passageOverview"));
        setVerseRows(getVerseRowsField(data));
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
        ? `Versículo por Versículo: ${book.trim()}${chapter ? ` ${chapter}` : ""}`
        : "Estudo Versículo por Versículo");

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
      methodId: "12_VERSICULO_POR_VERSICULO",
      title: resolvedTitle,
      book,
      chapter: parseChapterNum(chapter),
      verses,
      status,
      currentStep,
      formData: {
        passageOverview,
        verseRows,
      },
      application4P: app4P,
      tags: ["versiculo-por-versiculo", "6-colunas"],
      createdAt: createdAtRef || now,
      updatedAt: now,
      completedAt: resolvedCompletedAt,
    };
  };

  // Auto-save com debounce de 600ms quando título ou livro estiver preenchido
  useEffect(() => {
    if (title.trim() === "" && book.trim() === "") {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const now = new Date().toISOString();
        const resolvedTitle =
          title.trim() ||
          `Versículo por Versículo: ${book.trim()}${
            chapter ? ` ${chapter}` : ""
          }`;
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
          methodId: "12_VERSICULO_POR_VERSICULO",
          title: resolvedTitle,
          book,
          chapter:
            Number.isFinite(parsedChapter) && parsedChapter > 0
              ? parsedChapter
              : undefined,
          verses,
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            passageOverview,
            verseRows,
          },
          application4P: app4P,
          tags: ["versiculo-por-versiculo", "6-colunas"],
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
    title,
    book,
    chapter,
    verses,
    passageOverview,
    verseRows,
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

  const handleAddVerseRow = () => {
    markDirty();
    setVerseRows((prev) => [...prev, { ...EMPTY_VERSE_ROW }]);
  };

  const handleUpdateVerseRow = (
    index: number,
    field: keyof VerseRow,
    value: string
  ) => {
    markDirty();
    setVerseRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleInsertPROTag = (index: number, tag: "[P]" | "[R]" | "[O]") => {
    markDirty();
    setVerseRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const current = row.questionsAnswersObservations;
        const separator =
          current.trim().length > 0 && !current.endsWith("\n") ? "\n" : "";
        return {
          ...row,
          questionsAnswersObservations: `${current}${separator}${tag} `,
        };
      })
    );
  };

  const handleRemoveVerseRow = (index: number) => {
    if (verseRows.length <= 1) return;
    markDirty();
    setVerseRows((prev) => prev.filter((_, idx) => idx !== index));
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
            "12_VERSICULO_POR_VERSICULO",
            now.split("T")[0]
          )
        );
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error("Erro ao concluir método versículo por versículo:", err);
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
            <Badge variant="gold">Método 12</Badge>
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
            Método Analítico Versículo por Versículo
          </h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Passagem & Escopo" },
            { num: 2, label: "2. Quadro de 6 Colunas (V. por V.)" },
            { num: 3, label: "3. Aplicação Final (4Ps)" },
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

      {/* FASE 1: PASSAGEM & ESCOPO */}
      {currentStep === 1 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Fase 1: Seleção da Passagem & Ritmo Diário
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Flexível, Mas Sem Perder a Profundidade"
                theologicalPrinciple="Este método combina cinco perspectivas analíticas (Paráfrase, Perguntas/Respostas/Observações, Referências, Revelações e Aplicação) para cada versículo individual."
                whyThisStep="Definir um trecho curto (ex.: 3 a 6 versículos ou um Salmo) permite manter a consistência mesmo nos dias mais corridos."
                goldenTip="Não precisa estudar muitos versículos de uma vez — aprofundar 2 ou 3 versículos com as 6 colunas vale mais que correr por um capítulo inteiro."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label
                htmlFor="vbv-title"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Título do Estudo Analítico
              </label>
              <Input
                id="vbv-title"
                value={title}
                onChange={(e) => {
                  markDirty();
                  setTitle(e.target.value);
                }}
                placeholder="Ex.: O Bom Pastor em Ação (Salmo 23)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="vbv-book"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Livro Bíblico
                </label>
                <Input
                  id="vbv-book"
                  value={book}
                  onChange={(e) => {
                    markDirty();
                    setBook(e.target.value);
                  }}
                  placeholder="Ex.: Salmos / Tiago"
                />
              </div>

              <div>
                <label
                  htmlFor="vbv-chapter"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Capítulo
                </label>
                <Input
                  id="vbv-chapter"
                  type="number"
                  min={1}
                  value={chapter}
                  onChange={(e) => {
                    markDirty();
                    setChapter(e.target.value);
                  }}
                  placeholder="Ex.: 23"
                />
              </div>

              <div>
                <label
                  htmlFor="vbv-verses"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Intervalo de Versículos
                </label>
                <Input
                  id="vbv-verses"
                  value={verses}
                  onChange={(e) => {
                    markDirty();
                    setVerses(e.target.value);
                  }}
                  placeholder="Ex.: 1-6"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="vbv-overview"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Contexto Imediato da Passagem (Opcional)
              </label>
              <Textarea
                id="vbv-overview"
                rows={3}
                value={passageOverview}
                onChange={(e) => {
                  markDirty();
                  setPassageOverview(e.target.value);
                }}
                placeholder="O que vem imediatamente antes e depois desta perícope?"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="gap-2 cursor-pointer"
              >
                <span>Avançar: Quadro de 6 Colunas</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: QUADRO DINÂMICO DE 6 COLUNAS (V. POR V.) */}
      {currentStep === 2 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TableProperties className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Fase 2: Quadro Dinâmico de 6 Colunas (Versículo por Versículo)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="As 6 Colunas de Rick Warren"
                theologicalPrinciple="Parafrasear força você a compreender a ideia central com palavras próprias; marcar [P], [R] e [O] separa dúvida de observação objetiva."
                whyThisStep="Cada linha corresponde a um versículo (ou metade de um versículo longo) atravessando as 6 colunas da ficha clássica."
                goldenTip="Use os botões '+ [P]', '+ [R]' e '+ [O]' na Coluna 3 para classificar perguntas, respostas encontradas e observações gramaticais."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Adicione uma linha para cada versículo analisado e percorra as 6
                colunas.
              </span>
              <Badge variant="gold">
                {verseRows.length}{" "}
                {verseRows.length === 1 ? "Versículo" : "Versículos"}
              </Badge>
            </div>

            <div className="space-y-4">
              {verseRows.map((row, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-secondary/30 p-4 space-y-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--tabernacle-gold)]">
                      Linha {idx + 1} — Análise de Versículo
                    </span>
                    {verseRows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Remover linha ${idx + 1}`}
                        onClick={() => handleRemoveVerseRow(idx)}
                        className="h-7 px-2 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Coluna 1: Versículo */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Coluna 1: Versículo / Texto Bíblico
                      </label>
                      <Textarea
                        aria-label={`Versículo da linha ${idx + 1}`}
                        rows={2}
                        value={row.verseRef}
                        onChange={(e) =>
                          handleUpdateVerseRow(idx, "verseRef", e.target.value)
                        }
                        placeholder="Ex.: v. 1 — O Senhor é o meu pastor; nada me faltará."
                      />
                    </div>

                    {/* Coluna 2: Paráfrase Pessoal */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Coluna 2: Paráfrase Pessoal (Etapa 1)
                      </label>
                      <Textarea
                        aria-label={`Paráfrase da linha ${idx + 1}`}
                        rows={2}
                        value={row.personalParaphrase}
                        onChange={(e) =>
                          handleUpdateVerseRow(
                            idx,
                            "personalParaphrase",
                            e.target.value
                          )
                        }
                        placeholder="Reescreva o versículo com suas próprias palavras, mantendo o sentido original..."
                      />
                    </div>

                    {/* Coluna 3: Perguntas [P], Respostas [R] e Observações [O] */}
                    <div className="md:col-span-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Coluna 3: Perguntas [P], Respostas [R] e Observações
                          [O] (Etapa 2)
                        </label>
                        <div className="flex items-center gap-1">
                          {(["[P]", "[R]", "[O]"] as const).map((tag) => (
                            <Button
                              key={tag}
                              type="button"
                              variant="outline"
                              size="sm"
                              aria-label={`Inserir ${tag} na linha ${idx + 1}`}
                              onClick={() => handleInsertPROTag(idx, tag)}
                              className="h-6 px-2 text-[10px] font-bold cursor-pointer"
                            >
                              + {tag}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        aria-label={`Perguntas e observações da linha ${idx + 1}`}
                        rows={3}
                        value={row.questionsAnswersObservations}
                        onChange={(e) =>
                          handleUpdateVerseRow(
                            idx,
                            "questionsAnswersObservations",
                            e.target.value
                          )
                        }
                        placeholder={"[P] O que significa o pastor guiar?\n[R] Proteção e direção pessoal.\n[O] Pronome possessivo 'meu'."}
                      />
                    </div>

                    {/* Coluna 4: Referências Cruzadas */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Coluna 4: Referências Cruzadas (Etapa 3)
                      </label>
                      <Input
                        aria-label={`Referências cruzadas da linha ${idx + 1}`}
                        value={row.crossReferences}
                        onChange={(e) =>
                          handleUpdateVerseRow(
                            idx,
                            "crossReferences",
                            e.target.value
                          )
                        }
                        placeholder="Ex.: Jo 10:11; Fp 4:19"
                      />
                    </div>

                    {/* Coluna 5: Revelações e Descobertas */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Coluna 5: Revelações e Descobertas (Etapa 4)
                      </label>
                      <Input
                        aria-label={`Descobertas da linha ${idx + 1}`}
                        value={row.discoveries}
                        onChange={(e) =>
                          handleUpdateVerseRow(
                            idx,
                            "discoveries",
                            e.target.value
                          )
                        }
                        placeholder="Principais verdades aprendidas neste versículo"
                      />
                    </div>

                    {/* Coluna 6: Breve Aplicação Pessoal */}
                    <div className="md:col-span-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                        Coluna 6: Breve Aplicação do Versículo (Etapa 5)
                      </label>
                      <Input
                        aria-label={`Breve aplicação da linha ${idx + 1}`}
                        value={row.briefApplication}
                        onChange={(e) =>
                          handleUpdateVerseRow(
                            idx,
                            "briefApplication",
                            e.target.value
                          )
                        }
                        placeholder="Como este versículo específico fala diretamente ao meu dia de hoje?"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddVerseRow}
              className="w-full gap-2 border-dashed cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Versículo à Análise</span>
            </Button>

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
                <span>Avançar: Aplicação Final (4Ps)</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: APLICAÇÃO FINAL (4PS) */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Aplicação Prática Selecionada (Regra dos 4Ps)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Coroando a Jornada dos 12 Métodos"
                theologicalPrinciple="De Gênesis ao Apocalipse, todo estudo bíblico verdadeiro termina aos pés da obediência amorosa à Palavra."
                whyThisStep="Revise a Coluna 6 dos versículos analisados e eleja a aplicação prioritária para transformar em compromisso verificável."
                goldenTip="Compartilhe seu estudo completo e celebre cada lâmpada acesa no Tabernáculo!"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="vbv-application"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Aplicação Prática Selecionada da Passagem (Regra dos 4Ps)
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
                id="vbv-application"
                rows={4}
                value={applicationText}
                onChange={(e) => {
                  markDirty();
                  setApplicationText(e.target.value);
                }}
                placeholder="Escolha o insight mais transformador da Coluna 6 e redija sua ação em primeira pessoa..."
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
                  htmlFor="vbv-deadline"
                  className="text-[11px] font-semibold text-muted-foreground block mb-1"
                >
                  Prazo para Cumprimento:
                </label>
                <Input
                  id="vbv-deadline"
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => {
                    markDirty();
                    setDeadline(e.target.value);
                  }}
                  placeholder="Ex.: Hoje antes de dormir / Até sábado"
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
                methodId="12_VERSICULO_POR_VERSICULO"
                title="Estudo Versículo por Versículo Concluído!"
                subtitle={`Suas ${verseRows.length} ${
                  verseRows.length === 1
                    ? "linha analítica foi salva"
                    : "linhas analíticas foram salvas"
                } no Santo dos Santos.`}
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
