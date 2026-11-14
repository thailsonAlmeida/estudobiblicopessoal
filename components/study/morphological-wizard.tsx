"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  SearchCode,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  BookA,
  Languages,
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

export type OriginalLanguage = "Hebraico" | "Aramaico" | "Grego";

export interface MorphologicalWizardProps {
  studyId: string;
  initialStudy?: Study;
  onComplete?: (study: Study) => void;
}

const VALIDATION_ERROR_MSG =
  "Para concluir o estudo, marque os 4 critérios da aplicação (Pessoal, Prática, Possível e Provável) e descreva o passo de ação mensurável.";

const getStringField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string => {
  const val = formData?.[key];
  return typeof val === "string" ? val : fallback;
};

const getOriginalLanguageField = (
  formData: Record<string, unknown> | undefined
): OriginalLanguage => {
  const val = formData?.originalLanguage;
  if (val === "Hebraico" || val === "Aramaico" || val === "Grego") {
    return val;
  }
  return "Grego";
};

const LANGUAGES: OriginalLanguage[] = ["Hebraico", "Aramaico", "Grego"];

export function MorphologicalWizard({
  studyId,
  initialStudy,
  onComplete,
}: MorphologicalWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(
    initialStudy?.currentStep || 1
  );
  const [book, setBook] = useState(initialStudy?.book || "");
  const [verses, setVerses] = useState(initialStudy?.verses || "");

  // Fase 1: Etapas 1 a 3 (Palavra em Português, Dicionário e Traduções)
  const [word, setWord] = useState(getStringField(fd, "word"));
  const [vernacularDefinition, setVernacularDefinition] = useState(
    getStringField(fd, "vernacularDefinition")
  );
  const [synonymsAntonyms, setSynonymsAntonyms] = useState(
    getStringField(fd, "synonymsAntonyms")
  );
  const [translationComparison, setTranslationComparison] = useState(
    getStringField(fd, "translationComparison")
  );

  // Fase 2: Etapas 4 a 6 (Original, Strong, Ocorrências e Etimologia)
  const [originalLanguage, setOriginalLanguage] = useState<OriginalLanguage>(
    getOriginalLanguageField(fd)
  );
  const [strongNumber, setStrongNumber] = useState(
    getStringField(fd, "strongNumber")
  );
  const [transliteration, setTransliteration] = useState(
    getStringField(fd, "transliteration")
  );
  const [literalMeaning, setLiteralMeaning] = useState(
    getStringField(fd, "literalMeaning")
  );
  const [totalOccurrences, setTotalOccurrences] = useState(
    getStringField(fd, "totalOccurrences")
  );
  const [firstMention, setFirstMention] = useState(
    getStringField(fd, "firstMention")
  );
  const [rootEtymology, setRootEtymology] = useState(
    getStringField(fd, "rootEtymology")
  );

  // Fase 3: Etapas 7 e 8 (Uso Contextual + 4Ps)
  const [contextualUsage, setContextualUsage] = useState(
    getStringField(fd, "contextualUsage")
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

  // Hidrata estado se initialStudy chegar assincronamente (ex.: useLiveQuery) ou via db.studies.get
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
        setVerses(existing.verses || "");
        setWord(getStringField(data, "word"));
        setVernacularDefinition(getStringField(data, "vernacularDefinition"));
        setSynonymsAntonyms(getStringField(data, "synonymsAntonyms"));
        setTranslationComparison(getStringField(data, "translationComparison"));
        setOriginalLanguage(getOriginalLanguageField(data));
        setStrongNumber(getStringField(data, "strongNumber"));
        setTransliteration(getStringField(data, "transliteration"));
        setLiteralMeaning(getStringField(data, "literalMeaning"));
        setTotalOccurrences(getStringField(data, "totalOccurrences"));
        setFirstMention(getStringField(data, "firstMention"));
        setRootEtymology(getStringField(data, "rootEtymology"));
        setContextualUsage(getStringField(data, "contextualUsage"));
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
      .catch(() => {
        // Ignora falha silenciosa de leitura inicial
      });

    return () => {
      active = false;
    };
  }, [initialStudy, studyId, hydrated, hasUserEdited]);

  const buildStudyRecord = (completedOverride?: {
    status: "draft" | "completed";
    completedAt?: string;
  }): Study => {
    const now = new Date().toISOString();
    const trimmedWord = word.trim();
    const computedTitle = trimmedWord
      ? `Estudo Morfológico: ${trimmedWord}`
      : "Estudo Morfológico";

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
      methodId: "07_MORFOLOGICO",
      title: computedTitle,
      book,
      verses,
      status,
      currentStep,
      formData: {
        word,
        vernacularDefinition,
        synonymsAntonyms,
        translationComparison,
        originalLanguage,
        strongNumber,
        transliteration,
        literalMeaning,
        totalOccurrences,
        firstMention,
        rootEtymology,
        contextualUsage,
      },
      application4P: app4P,
      tags: ["morfologico", "palavras", originalLanguage.toLowerCase()],
      createdAt: createdAtRef || now,
      updatedAt: now,
      completedAt: resolvedCompletedAt,
    };
  };

  // Auto-save no IndexedDB com debounce de 600ms (só grava após preenchimento do campo principal)
  useEffect(() => {
    if (word.trim() === "") {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const now = new Date().toISOString();
        const computedTitle = `Estudo Morfológico: ${word.trim()}`;
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
          methodId: "07_MORFOLOGICO",
          title: computedTitle,
          book,
          verses,
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            word,
            vernacularDefinition,
            synonymsAntonyms,
            translationComparison,
            originalLanguage,
            strongNumber,
            transliteration,
            literalMeaning,
            totalOccurrences,
            firstMention,
            rootEtymology,
            contextualUsage,
          },
          application4P: app4P,
          tags: ["morfologico", "palavras", originalLanguage.toLowerCase()],
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
    verses,
    word,
    vernacularDefinition,
    synonymsAntonyms,
    translationComparison,
    originalLanguage,
    strongNumber,
    transliteration,
    literalMeaning,
    totalOccurrences,
    firstMention,
    rootEtymology,
    contextualUsage,
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
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#5C2A6B", "#D4AF37", "#1B4965"],
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
            "07_MORFOLOGICO",
            now.split("T")[0]
          )
        );
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error("Erro ao concluir estudo morfológico:", err);
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
      {/* Cabeçalho do Estudo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="purple">Método 07</Badge>
            <Badge variant="purple">Lugar Santo</Badge>
            <span
              aria-live="polite"
              className="text-[11px] text-muted-foreground font-medium"
            >
              {saveStatus === "saving" && "• Salvando..."}
              {saveStatus === "saved" && "✓ Salvo automaticamente"}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            Estudo Morfológico (Palavras)
          </h1>
        </div>

        {/* Stepper das 3 Fases */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Vernáculo & Traduções" },
            { num: 2, label: "2. Original, Strong & Léxico" },
            { num: 3, label: "3. Uso Contextual & 4Ps" },
          ].map((fase) => (
            <button
              key={fase.num}
              type="button"
              onClick={() => setCurrentStep(fase.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStep === fase.num
                  ? "bg-[var(--tabernacle-purple)] text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {fase.label}
            </button>
          ))}
        </div>
      </div>

      {/* FASE 1: VERNÁCULO E TRADUÇÕES */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookA className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 1: Palavra em Português & Traduções
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Evite a Armadilha da Etimologia Isolada"
                theologicalPrinciple="As línguas originais são como pepitas escondidas na mina do texto bíblico, mas uma palavra só tem significado real dentro da frase e do propósito do autor."
                whyThisStep="Antes de consultar léxicos gregos ou hebraicos, domine como a palavra soa em sua língua materna e como diferentes traduções modernas a verteram."
                goldenTip="Compare traduções formais (ARA/ACF) com traduções dinâmicas (NVI/NVT) para perceber nuances de ação e intenção."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="morph-word"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Palavra em Português (Etapa 1)
                </label>
                <Input
                  id="morph-word"
                  value={word}
                  onChange={(e) => {
                    markDirty();
                    setWord(e.target.value);
                  }}
                  placeholder="Ex.: Arrependimento, Graça, Misericórdia..."
                />
              </div>

              <div>
                <label
                  htmlFor="morph-book"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Livro Principal
                </label>
                <Input
                  id="morph-book"
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
                  htmlFor="morph-verses"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Versículos-Base
                </label>
                <Input
                  id="morph-verses"
                  value={verses}
                  onChange={(e) => {
                    markDirty();
                    setVerses(e.target.value);
                  }}
                  placeholder="Ex.: 12:1-2"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="morph-vernacular"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Definição no Dicionário Vernáculo (Etapa 2)
              </label>
              <Textarea
                id="morph-vernacular"
                rows={3}
                value={vernacularDefinition}
                onChange={(e) => {
                  markDirty();
                  setVernacularDefinition(e.target.value);
                }}
                placeholder="Anote a definição formal no dicionário de língua portuguesa..."
              />
            </div>

            <div>
              <label
                htmlFor="morph-synonyms"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Sinônimos e Antônimos (Etapa 2)
              </label>
              <Input
                id="morph-synonyms"
                value={synonymsAntonyms}
                onChange={(e) => {
                  markDirty();
                  setSynonymsAntonyms(e.target.value);
                }}
                placeholder="Sinônimos: conversão, mudança de mente | Antônimos: obstinação..."
              />
            </div>

            <div>
              <label
                htmlFor="morph-translations"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Comparação de Traduções (Etapa 3)
              </label>
              <Textarea
                id="morph-translations"
                rows={3}
                value={translationComparison}
                onChange={(e) => {
                  markDirty();
                  setTranslationComparison(e.target.value);
                }}
                placeholder="ARA vs. NVI vs. NVT: Quais palavras distintas foram usadas para traduzir este termo?"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="gap-2 cursor-pointer"
              >
                <span>Avançar: Original & Strong</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: ORIGINAL, STRONG E LÉXICO */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Languages className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 2: Idioma Original, Strong & Léxico
              </CardTitle>
              <PrincipleDrawer
                stepTitle="A Lei da Primeira Menção e a Raiz"
                theologicalPrinciple="Na Bíblia, o primeiro lugar em que uma palavra aparece frequentemente estabelece um padrão teológico que ecoa por toda a revelação progressiva."
                whyThisStep="Identificar o número de Strong evita confundir palavras portuguesas iguais que vêm de termos gregos ou hebraicos completamente diferentes (ex.: ágape vs. fileo)."
                goldenTip="Procure também palavras derivadas da mesma raiz para enxergar a 'família semântica' original."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Cartão de Etimologia Hebraica/Grega & Strong */}
            <div className="rounded-2xl border border-[var(--tabernacle-purple)]/30 bg-[var(--tabernacle-purple)]/5 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <SearchCode className="h-4 w-4 text-[var(--tabernacle-purple)]" />
                    Cartão de Etimologia & Strong (Etapa 4)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Selecione o idioma bíblico original e registre o código de
                    referência.
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="Idioma Original"
                  className="flex items-center gap-1.5"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      aria-pressed={originalLanguage === lang}
                      onClick={() => {
                        markDirty();
                        setOriginalLanguage(lang);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        originalLanguage === lang
                          ? "bg-[var(--tabernacle-purple)] text-white border-[var(--tabernacle-purple)]"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="morph-strong"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                  >
                    Número de Strong
                  </label>
                  <Input
                    id="morph-strong"
                    value={strongNumber}
                    onChange={(e) => {
                      markDirty();
                      setStrongNumber(e.target.value);
                    }}
                    placeholder={
                      originalLanguage === "Hebraico" ? "Ex.: H2617" : "Ex.: G3341"
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="morph-transliteration"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                  >
                    Transliteração
                  </label>
                  <Input
                    id="morph-transliteration"
                    value={transliteration}
                    onChange={(e) => {
                      markDirty();
                      setTransliteration(e.target.value);
                    }}
                    placeholder="Ex.: metanoia / chesed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="morph-literal"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                  >
                    Significado Literal
                  </label>
                  <Input
                    id="morph-literal"
                    value={literalMeaning}
                    onChange={(e) => {
                      markDirty();
                      setLiteralMeaning(e.target.value);
                    }}
                    placeholder="Ex.: Mudança profunda de mente"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="morph-occurrences"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Ocorrências na Bíblia (Etapa 5)
                </label>
                <Input
                  id="morph-occurrences"
                  value={totalOccurrences}
                  onChange={(e) => {
                    markDirty();
                    setTotalOccurrences(e.target.value);
                  }}
                  placeholder="Ex.: 22 vezes no NT (especialmente Atos e Lucas)"
                />
              </div>

              <div>
                <label
                  htmlFor="morph-first-mention"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Lei da Primeira Menção (Etapa 5)
                </label>
                <Input
                  id="morph-first-mention"
                  value={firstMention}
                  onChange={(e) => {
                    markDirty();
                    setFirstMention(e.target.value);
                  }}
                  placeholder="Ex.: Mt 3:8 — Frutos dignos de arrependimento"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="morph-etymology"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Raiz, Origem e Dicionário Exegético (Etapa 6)
              </label>
              <Textarea
                id="morph-etymology"
                rows={4}
                value={rootEtymology}
                onChange={(e) => {
                  markDirty();
                  setRootEtymology(e.target.value);
                }}
                placeholder="Registre os insights do Dicionário Vine, Léxico de Strong ou enciclopédia sobre a raiz da palavra..."
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
                <span>Avançar: Uso Contextual & 4Ps</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: USO CONTEXTUAL & APLICAÇÃO 4PS */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Uso Contextual & Aplicação (4Ps)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="O Contexto é o Rei do Significado"
                theologicalPrinciple="Uma palavra pode ter cinco acepções possíveis no dicionário, mas no seu versículo ela carrega o peso específico escolhido pelo autor sob inspiração."
                whyThisStep="Unir a precisão léxica (Etapa 7) à obediência prática (Etapa 8) transforma erudição grega/hebraica em vida santificada."
                goldenTip="Escreva sua aplicação respondendo: como o sentido original dessa palavra muda minha atitude hoje?"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="morph-context"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Uso da Palavra pelo Autor no Contexto (Etapa 7)
              </label>
              <Textarea
                id="morph-context"
                rows={4}
                value={contextualUsage}
                onChange={(e) => {
                  markDirty();
                  setContextualUsage(e.target.value);
                }}
                placeholder="Como o autor bíblico empregou esta palavra especificamente nesta passagem?"
              />
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="morph-application"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Aplicação Pessoal (Etapa 8 — Regra dos 4Ps)
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
                id="morph-application"
                rows={3}
                value={applicationText}
                onChange={(e) => {
                  markDirty();
                  setApplicationText(e.target.value);
                }}
                placeholder="Escreva seu passo prático e mensurável para hoje..."
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
                      className="h-4 w-4 rounded border-border text-[var(--tabernacle-purple)] cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label
                  htmlFor="morph-deadline"
                  className="text-[11px] font-semibold text-muted-foreground block mb-1"
                >
                  Prazo para Cumprimento:
                </label>
                <Input
                  id="morph-deadline"
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => {
                    markDirty();
                    setDeadline(e.target.value);
                  }}
                  placeholder="Ex.: Até sexta-feira às 20h"
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
                methodId="07_MORFOLOGICO"
                title="Estudo Morfológico Concluído!"
                subtitle={`Sua pesquisa de "${word || "palavra"}" (${originalLanguage} ${strongNumber}) foi salva no diário.`}
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
