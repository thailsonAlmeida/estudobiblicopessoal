"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  Plus,
  Trash2,
  Clock,
  Heart,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildUpdatedUserProgress } from "@/lib/gamification/progress-calculator";
import { playSoftShofarSound } from "@/lib/gamification/celebration-sound";
import { StudyCompletionCard } from "./study-completion-card";
import { Study, Application4P } from "@/lib/types/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrincipleDrawer } from "./principle-drawer";

interface BiographicalWizardProps {
  initialStudy?: Study;
  studyId: string;
}

export interface TimelineEvent {
  phase: string;
  reference: string;
  description: string;
}

const DEFAULT_TIMELINE: TimelineEvent[] = [
  { phase: "Origem e Chamado", reference: "", description: "" },
  { phase: "Crises e Provações", reference: "", description: "" },
  { phase: "Legado Final", reference: "", description: "" },
];

const getStringField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string => {
  const val = formData?.[key];
  return typeof val === "string" ? val : fallback;
};

const isTimelineEvent = (val: unknown): val is TimelineEvent => {
  if (typeof val !== "object" || val === null) return false;
  const record = val as Record<string, unknown>;
  return (
    typeof record.phase === "string" &&
    typeof record.reference === "string" &&
    typeof record.description === "string"
  );
};

const getTimelineField = (
  formData: Record<string, unknown> | undefined
): TimelineEvent[] => {
  const val = formData?.timelineEvents;
  if (Array.isArray(val) && val.length > 0 && val.every(isTimelineEvent)) {
    return val;
  }
  return DEFAULT_TIMELINE;
};

export function BiographicalWizard({
  initialStudy,
  studyId,
}: BiographicalWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(initialStudy?.currentStep || 1);
  const [characterName, setCharacterName] = useState(
    getStringField(fd, "characterName")
  );
  const [alternateNames, setAlternateNames] = useState(
    getStringField(fd, "alternateNames")
  );
  const [book, setBook] = useState(initialStudy?.book || "Atos");
  const [referencesList, setReferencesList] = useState(
    getStringField(fd, "referencesList")
  );
  const [firstImpressions, setFirstImpressions] = useState(
    getStringField(fd, "firstImpressions")
  );
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(
    getTimelineField(fd)
  );

  // Fase 2: Etapas 5 a 8
  const [innerLife, setInnerLife] = useState(getStringField(fd, "innerLife"));
  const [characterVirtues, setCharacterVirtues] = useState(
    getStringField(fd, "characterVirtues")
  );
  const [characterFlaws, setCharacterFlaws] = useState(
    getStringField(fd, "characterFlaws")
  );
  const [illustratedTruths, setIllustratedTruths] = useState(
    getStringField(fd, "illustratedTruths")
  );
  const [centralLesson, setCentralLesson] = useState(
    getStringField(fd, "centralLesson")
  );

  // Fase 3: Etapas 9 e 10
  const [communicableOutline, setCommunicableOutline] = useState(
    getStringField(fd, "communicableOutline")
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

  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    initialStudy?.status === "completed"
  );

  const resolvedTitle = characterName.trim()
    ? `Biografia: ${characterName.trim()}`
    : initialStudy?.title || "Estudo Biográfico";

  // Auto-save no IndexedDB com debounce de 600ms
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const app4P: Application4P = {
          text: applicationText,
          isPersonal,
          isPractical,
          isPossible,
          isMeasurable,
          deadline,
        };

        const studyData: Study = {
          id: studyId,
          methodId: "05_BIOGRAFICO",
          title: resolvedTitle,
          book,
          verses: "",
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            characterName,
            alternateNames,
            referencesList,
            firstImpressions,
            timelineEvents,
            innerLife,
            characterVirtues,
            characterFlaws,
            illustratedTruths,
            centralLesson,
            communicableOutline,
          },
          application4P: app4P,
          tags: ["biografico"],
          createdAt: initialStudy?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: isCompleted
            ? initialStudy?.completedAt || new Date().toISOString()
            : undefined,
        };

        await db.studies.put(studyData);
      } catch (err) {
        console.error("Erro no auto-save:", err);
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    studyId,
    currentStep,
    resolvedTitle,
    book,
    characterName,
    alternateNames,
    referencesList,
    firstImpressions,
    timelineEvents,
    innerLife,
    characterVirtues,
    characterFlaws,
    illustratedTruths,
    centralLesson,
    communicableOutline,
    applicationText,
    isPersonal,
    isPractical,
    isPossible,
    isMeasurable,
    deadline,
    isCompleted,
    initialStudy?.createdAt,
    initialStudy?.completedAt,
  ]);

  const handleAddTimelineEvent = () => {
    setTimelineEvents((prev) => [
      ...prev,
      { phase: "", reference: "", description: "" },
    ]);
  };

  const handleUpdateTimelineEvent = (
    index: number,
    field: keyof TimelineEvent,
    value: string
  ) => {
    setTimelineEvents((prev) =>
      prev.map((ev, idx) => (idx === index ? { ...ev, [field]: value } : ev))
    );
  };

  const handleRemoveTimelineEvent = (index: number) => {
    if (timelineEvents.length <= 1) return;
    setTimelineEvents((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFinalize = async () => {
    setIsCompleted(true);
    playSoftShofarSound();
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#5C2A6B", "#D4AF37", "#1B4965"],
    });

    try {
      const currentProg = await db.progress.get("progress");
      await db.progress.put(
        buildUpdatedUserProgress(currentProg, "05_BIOGRAFICO")
      );
    } catch (e) {
      console.error(e);
    }
  };

  const all4PsChecked = isPersonal && isPractical && isPossible && isMeasurable;

  const fourPsItems = [
    {
      id: "personal",
      label: '1. Pessoal (usei "Eu", "Mim")',
      checked: isPersonal,
      onChange: setIsPersonal,
    },
    {
      id: "practical",
      label: "2. Prático (ação definida)",
      checked: isPractical,
      onChange: setIsPractical,
    },
    {
      id: "possible",
      label: "3. Possível (viável pela graça)",
      checked: isPossible,
      onChange: setIsPossible,
    },
    {
      id: "measurable",
      label: "4. Mensurável (prazo definido)",
      checked: isMeasurable,
      onChange: setIsMeasurable,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Cabeçalho do Estudo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Método 05</Badge>
            <span className="text-xs text-muted-foreground">Lugar Santo</span>
            {isSaving && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                • Salvando rascunho...
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            O Método Biográfico
          </h1>
        </div>

        {/* Indicador de 3 Fases */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Personagem & Cronologia" },
            { num: 2, label: "2. Vida Íntima & Caráter" },
            { num: 3, label: "3. Aplicação & Esboço" },
          ].map((f) => (
            <button
              key={f.num}
              type="button"
              onClick={() => setCurrentStep(f.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStep === f.num
                  ? "bg-[var(--tabernacle-purple)] text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* FASE 1: PERSONAGEM, REFERÊNCIAS, PRIMEIRAS IMPRESSÕES E LINHA DO TEMPO */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 1: Escolha do Personagem & Linha do Tempo
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Aprendendo com Homens e Mulheres Reais"
                theologicalPrinciple="1 Coríntios 10.11: 'Essas coisas aconteceram a eles como exemplos e foram escritas como advertência para nós'. A Bíblia retrata mais de 3.000 personagens sem maquiar falhas ou vitórias."
                whyThisStep="Comece por personagens de menor extensão (Barnabé, Rute, Neemias) e cuidado com homônimos (há 30 Zacarias e 8 Judas na Bíblia!) ou nomes múltiplos (Pedro/Simão/Cefas)."
                goldenTip="Afaste-se de comentários externos até esgotar o texto bíblico direto; mapeie a cronologia de nascimento, vocação, crises e legado."
                exampleFromBook="Barnabé em Atos 4.36-37, 9.26-27, 11.22-30 e 15.36-41: o 'Filho da Consolação'."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="character-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Etapa 1: Nome do Personagem Bíblico
                </label>
                <Input
                  id="character-name"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Ex.: Barnabé, Rute, Neemias"
                />
              </div>
              <div>
                <label
                  htmlFor="alternate-names"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Outros Nomes / Cuidado com Homônimos
                </label>
                <Input
                  id="alternate-names"
                  value={alternateNames}
                  onChange={(e) => setAlternateNames(e.target.value)}
                  placeholder="Ex.: José de Chipre (não confundir com...)"
                />
              </div>
              <div>
                <label
                  htmlFor="character-book"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Livro Principal
                </label>
                <Input
                  id="character-book"
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  placeholder="Ex.: Atos, Rute, Neemias"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="references-list"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 2: Lista de Referências Bíblicas sobre o Personagem
              </label>
              <Textarea
                id="references-list"
                rows={2}
                value={referencesList}
                onChange={(e) => setReferencesList(e.target.value)}
                placeholder="Rastreie na concordância todas as passagens que citam o personagem..."
              />
            </div>

            <div>
              <label
                htmlFor="first-impressions"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 3: Primeiras Impressões (1ª Leitura)
              </label>
              <Textarea
                id="first-impressions"
                rows={3}
                value={firstImpressions}
                onChange={(e) => setFirstImpressions(e.target.value)}
                placeholder="Leia todas as passagens sem parar e registre impressões espontâneas e emoções evidentes..."
              />
            </div>

            {/* Etapa 4: Linha do Tempo Cronológica Interativa */}
            <div className="rounded-2xl border border-[var(--tabernacle-purple)]/30 bg-[var(--tabernacle-purple)]/5 p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--tabernacle-purple)] flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Etapa 4: Esboço Cronológico da Vida (Linha do Tempo)
                </h4>
                <Badge variant="purple" className="text-[10px]">
                  {timelineEvents.length} Marcos Registrados
                </Badge>
              </div>

              <div className="relative space-y-3 pl-5 border-l-2 border-[var(--tabernacle-purple)]/30 ml-2">
                {timelineEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-xs"
                  >
                    <span className="absolute -left-[29px] top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tabernacle-purple)] text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>

                    <div className="flex items-center justify-between gap-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                        <Input
                          value={ev.phase}
                          onChange={(e) =>
                            handleUpdateTimelineEvent(idx, "phase", e.target.value)
                          }
                          placeholder="Fase ou marco (ex.: Conversão, Ministério)"
                          className="h-9 text-xs font-medium"
                        />
                        <Input
                          value={ev.reference}
                          onChange={(e) =>
                            handleUpdateTimelineEvent(idx, "reference", e.target.value)
                          }
                          placeholder="Referência (ex.: At 9.26-27)"
                          className="h-9 text-xs"
                        />
                      </div>
                      {timelineEvents.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTimelineEvent(idx)}
                          aria-label={`Remover marco ${idx + 1}`}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <Textarea
                      rows={2}
                      value={ev.description}
                      onChange={(e) =>
                        handleUpdateTimelineEvent(idx, "description", e.target.value)
                      }
                      placeholder="Descreva os acontecimentos e decisões neste marco da vida..."
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTimelineEvent}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Adicionar Marco Cronológico</span>
              </Button>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setCurrentStep(2)} className="gap-2 cursor-pointer">
                <span>Próxima: Vida Íntima & Caráter</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: O ÍNTIMO, TRAÇOS DE CARÁTER, VERDADES ILUSTRADAS E LIÇÃO PRINCIPAL */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Heart className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 2: Mergulho no Coração, Caráter & Lição Central
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Convivendo com o Personagem"
                theologicalPrinciple="O Antigo e o Novo Testamento ilustram doutrinas eternas através da experiência humana real: fé, medo, arrependimento e fidelidade."
                whyThisStep="Analisar as motivações íntimas e catalogar tanto virtudes quanto falhas protege contra a idealização irreal dos personagens e extrai verdades teológicas tangíveis."
                goldenTip="Pergunte: Como ele reagiu ao sucesso, à traição, à espera e à repreensão de Deus?"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="inner-life"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 5: O Íntimo da Personagem (Motivações, Crises e Reações)
              </label>
              <Textarea
                id="inner-life"
                rows={3}
                value={innerLife}
                onChange={(e) => setInnerLife(e.target.value)}
                placeholder="Quais eram suas ambições, amigos leais, inimigos e como Deus se revelou a ela?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="character-virtues"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Etapa 6A: Virtudes e Pontos Fortes
                </label>
                <Textarea
                  id="character-virtues"
                  rows={3}
                  value={characterVirtues}
                  onChange={(e) => setCharacterVirtues(e.target.value)}
                  placeholder="Qualidades espirituais e traços nobres manifestados..."
                />
              </div>
              <div>
                <label
                  htmlFor="character-flaws"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Etapa 6B: Fraquezas e Falhas Morais
                </label>
                <Textarea
                  id="character-flaws"
                  rows={3}
                  value={characterFlaws}
                  onChange={(e) => setCharacterFlaws(e.target.value)}
                  placeholder="Hesitações, pecados e áreas em que tropeçou..."
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="illustrated-truths"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 7: Verdades Bíblicas Ilustradas na Vida
              </label>
              <Textarea
                id="illustrated-truths"
                rows={3}
                value={illustratedTruths}
                onChange={(e) => setIllustratedTruths(e.target.value)}
                placeholder="Ex.: A lei da semeadura e colheita (Jacó); a soberania de Deus sobre o mal (José)..."
              />
            </div>

            <div>
              <label
                htmlFor="central-lesson"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 8: Lição Principal (Resumo em uma Frase)
              </label>
              <Input
                id="central-lesson"
                value={centralLesson}
                onChange={(e) => setCentralLesson(e.target.value)}
                placeholder="Sintetize a grande lição da vida do personagem em uma proposição memorável..."
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="gap-2 cursor-pointer">
                <span>Próxima: Aplicação & Esboço</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: APLICAÇÃO PESSOAL 4PS & ESTUDO COMUNICÁVEL */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Aplicação 4Ps & Transmissão para Discipulado
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Tornando o Estudo Comunicável"
                theologicalPrinciple="2 Timóteo 2.2: 'O que você ouviu de mim... confie a homens fiéis que sejam também capazes de ensinar outros'. A descoberta pessoal deve transbordar em edificação mútua."
                whyThisStep="Depois de aplicar o exemplo do personagem à própria vida com os 4Ps, estruturar um esboço compartilhável prepara você para discipular ou ministrar."
                goldenTip="Transforme os marcos cronológicos ou os traços de caráter em 3 tópicos claros para compartilhar em um pequeno grupo."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                <span>Etapa 9: Aplicação Pessoal (Regra dos 4Ps)</span>
                {all4PsChecked ? (
                  <Badge variant="blue" className="text-[10px]">
                    4Ps Validados ✓
                  </Badge>
                ) : (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                    Marque os 4 critérios para concluir
                  </span>
                )}
              </h4>

              <Textarea
                rows={3}
                value={applicationText}
                onChange={(e) => setApplicationText(e.target.value)}
                placeholder="Qual virtude vou imitar ou qual erro deste personagem vou evitar em primeira pessoa..."
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
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Prazo para Cumprimento:
                </label>
                <Input
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Ex.: Nesta semana"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="communicable-outline"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 10: Estudo Comunicável (Esboço para Discipulado ou Grupo)
              </label>
              <Textarea
                id="communicable-outline"
                rows={4}
                value={communicableOutline}
                onChange={(e) => setCommunicableOutline(e.target.value)}
                placeholder="Organize os pontos principais para ensinar em um pequeno grupo, célula ou discipulado individual..."
              />
            </div>

            {isCompleted ? (
              <StudyCompletionCard
                methodId="05_BIOGRAFICO"
                title="Estudo Biográfico Concluído!"
                subtitle={`A biografia de ${characterName || "seu personagem"} foi salva no diário permanente.`}
                onEdit={() => setIsCompleted(false)}
              />
            ) : (
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="gap-2 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>
                <Button
                  variant="gold"
                  disabled={!all4PsChecked}
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

