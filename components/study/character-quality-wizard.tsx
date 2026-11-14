"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  BookmarkCheck,
  Scale,
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

interface CharacterQualityWizardProps {
  initialStudy?: Study;
  studyId: string;
}

const getStringField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string => {
  const val = formData?.[key];
  return typeof val === "string" ? val : fallback;
};

export function CharacterQualityWizard({
  initialStudy,
  studyId,
}: CharacterQualityWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(initialStudy?.currentStep || 1);
  const [title, setTitle] = useState(initialStudy?.title || "Estudo de Caráter");
  const [book, setBook] = useState(initialStudy?.book || "Gálatas");
  const [chapter, setChapter] = useState(initialStudy?.chapter ?? 5);
  const [verses, setVerses] = useState(initialStudy?.verses || "22-23");

  // Fase 1: Etapas 1 a 3 (Matriz Comparativa + Estudo da Palavra)
  const [qualityName, setQualityName] = useState(getStringField(fd, "qualityName"));
  const [qualityDefinition, setQualityDefinition] = useState(
    getStringField(fd, "qualityDefinition")
  );
  const [oppositeName, setOppositeName] = useState(getStringField(fd, "oppositeName"));
  const [oppositeDefinition, setOppositeDefinition] = useState(
    getStringField(fd, "oppositeDefinition")
  );
  const [wordStudy, setWordStudy] = useState(getStringField(fd, "wordStudy"));

  // Fase 2: Etapas 4 a 6
  const [crossReferences, setCrossReferences] = useState(
    getStringField(fd, "crossReferences")
  );
  const [biographicalCharacter, setBiographicalCharacter] = useState(
    getStringField(fd, "biographicalCharacter")
  );
  const [biographicalLessons, setBiographicalLessons] = useState(
    getStringField(fd, "biographicalLessons")
  );
  const [memoryVerse, setMemoryVerse] = useState(getStringField(fd, "memoryVerse"));
  const [memoryVerseRef, setMemoryVerseRef] = useState(
    getStringField(fd, "memoryVerseRef")
  );

  // Fase 3: Etapas 7 a 9
  const [specificSituation, setSpecificSituation] = useState(
    getStringField(fd, "specificSituation")
  );
  const [personalIllustration, setPersonalIllustration] = useState(
    getStringField(fd, "personalIllustration")
  );

  // Etapa 8: Aplicação 4Ps
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
          methodId: "03_QUALIDADE_CARATER",
          title: title || (qualityName ? `Caráter: ${qualityName}` : "Estudo de Caráter"),
          book,
          chapter: Number(chapter) || undefined,
          verses,
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            qualityName,
            qualityDefinition,
            oppositeName,
            oppositeDefinition,
            wordStudy,
            crossReferences,
            biographicalCharacter,
            biographicalLessons,
            memoryVerse,
            memoryVerseRef,
            specificSituation,
            personalIllustration,
          },
          application4P: app4P,
          tags: ["qualidade-carater"],
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
    title,
    book,
    chapter,
    verses,
    qualityName,
    qualityDefinition,
    oppositeName,
    oppositeDefinition,
    wordStudy,
    crossReferences,
    biographicalCharacter,
    biographicalLessons,
    memoryVerse,
    memoryVerseRef,
    specificSituation,
    personalIllustration,
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
        buildUpdatedUserProgress(currentProg, "03_QUALIDADE_CARATER")
      );
    } catch (e) {
      console.error(e);
    }
  };

  const all4PsChecked = isPersonal && isPractical && isPossible && isMeasurable;

  const fourPsItems = [
    {
      id: "personal",
      label: '1. Pessoal (usei "Eu", "Mim", "Meu")',
      checked: isPersonal,
      onChange: setIsPersonal,
    },
    {
      id: "practical",
      label: "2. Prático (ação comportamental definida)",
      checked: isPractical,
      onChange: setIsPractical,
    },
    {
      id: "possible",
      label: "3. Possível (viável pela graça de Deus)",
      checked: isPossible,
      onChange: setIsPossible,
    },
    {
      id: "measurable",
      label: "4. Mensurável (prazo e acompanhamento)",
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
            <Badge variant="purple">Método 03</Badge>
            <span className="text-xs text-muted-foreground">Lugar Santo</span>
            {isSaving && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                • Salvando rascunho...
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            Método da Qualidade de Caráter
          </h1>
        </div>

        {/* Indicador de 3 Fases do Wizard */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Definição & Palavra" },
            { num: 2, label: "2. Escrituras & Biografia" },
            { num: 3, label: "3. Prática & Projeto 4Ps" },
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

      {/* FASE 1: MATRIZ COMPARATIVA VIRTUDE VS. DEFEITO & ESTUDO DA PALAVRA */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Scale className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 1: Matriz Comparativa de Caráter & Palavra Original
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Alvo Supremo: A Estatura de Cristo"
                theologicalPrinciple="O objetivo final da caminhada cristã não é o acúmulo de dados dogmáticos, mas a conformação do caráter do crente à imagem de Jesus Cristo (Fp 2.13)."
                whyThisStep="Trabalhe em UMA qualidade de cada vez. Comparar a virtude com seu antônimo ajuda a não confundir qualidades mal direcionadas (como zelo sem amor) e revela a raiz exata no original bíblico."
                goldenTip="Consulte um dicionário bíblico ou léxico. Por exemplo, 'Mansidão' (praus no grego) descrevia um cavalo selvagem domado: força total sob controle submisso ao Mestre."
                exampleFromBook="Fé tem como opostos Dúvida, Apatia ou Medo; Humildade opõe-se a Orgulho e Arrogância."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Título Geral do Estudo
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Cultivando a Mansidão Bíblica"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Livro Base
                </label>
                <Input value={book} onChange={(e) => setBook(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Capítulo
                </label>
                <Input
                  type="number"
                  value={chapter || ""}
                  onChange={(e) => setChapter(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Versículos
                </label>
                <Input value={verses} onChange={(e) => setVerses(e.target.value)} />
              </div>
            </div>

            {/* Matriz Comparativa Lado a Lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="blue">Virtude a Cultivar</Badge>
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <label
                    htmlFor="quality-name"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
                  >
                    Etapa 1: Nome da Qualidade
                  </label>
                  <Input
                    id="quality-name"
                    value={qualityName}
                    onChange={(e) => setQualityName(e.target.value)}
                    placeholder="Ex.: Mansidão, Fidelidade, Domínio Próprio"
                  />
                </div>
                <div>
                  <label
                    htmlFor="quality-definition"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
                  >
                    Definição do Dicionário e Sinônimos
                  </label>
                  <Textarea
                    id="quality-definition"
                    rows={3}
                    value={qualityDefinition}
                    onChange={(e) => setQualityDefinition(e.target.value)}
                    placeholder="Anote a definição formal, sinônimos e expressões afins..."
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--tabernacle-crimson)]/30 bg-[var(--tabernacle-crimson)]/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="crimson">Vício / Oposto a Evitar</Badge>
                  <Scale className="h-4 w-4 text-[var(--tabernacle-crimson)]" />
                </div>
                <div>
                  <label
                    htmlFor="opposite-name"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
                  >
                    Etapa 2: Qualidade Oposta (Defeito)
                  </label>
                  <Input
                    id="opposite-name"
                    value={oppositeName}
                    onChange={(e) => setOppositeName(e.target.value)}
                    placeholder="Ex.: Ira, Orgulho, Impulsividade"
                  />
                </div>
                <div>
                  <label
                    htmlFor="opposite-definition"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
                  >
                    Definição do Oposto e Extremos
                  </label>
                  <Textarea
                    id="opposite-definition"
                    rows={3}
                    value={oppositeDefinition}
                    onChange={(e) => setOppositeDefinition(e.target.value)}
                    placeholder="Pesquise os antônimos e observe se há múltiplos extremos..."
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="word-study"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
              >
                Etapa 3: Estudo Simples da Palavra (Sentido Hebraico/Grego)
              </label>
              <Textarea
                id="word-study"
                rows={3}
                value={wordStudy}
                onChange={(e) => setWordStudy(e.target.value)}
                placeholder="Significado nos idiomas originais, raízes etimológicas e costumes da época..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setCurrentStep(2)} className="gap-2 cursor-pointer">
                <span>Próxima: Escrituras & Biografia</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: REFERÊNCIAS CRUZADAS, BIOGRAFIA E MEMORIZAÇÃO */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookmarkCheck className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 2: Referências Bíblicas, Exemplo Biográfico e Âncora
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Atestando a Virtude nas Escrituras"
                theologicalPrinciple="Toda qualidade cristã encontra nas Escrituras tanto mandamentos claros quanto retratos vivos em personagens reais que encarnaram ou falharam nesse traço."
                whyThisStep="Mapear benefícios, advertências e um personagem bíblico dá profundidade teológica, enquanto decorar um versículo ancora sua mente durante os testes reais."
                goldenTip="Não tenha pressa: o Espírito Santo pode levar meses trabalhando em um traço específico. Persevere com um versículo memorizado na ponta da língua."
                exampleFromBook="Ousadia: Pedro e João em Atos 4; Generosidade: Barnabé; Paciência: Jó; Inveja: Saul."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="cross-references"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
              >
                Etapa 4: Referências Cruzadas (Benefícios, Promessas e Mandamentos)
              </label>
              <Textarea
                id="cross-references"
                rows={4}
                value={crossReferences}
                onChange={(e) => setCrossReferences(e.target.value)}
                placeholder="Liste versículos sobre benefícios da virtude, prejuízos do oposto, promessas e ensinamentos de Jesus..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="biographical-character"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
                >
                  Etapa 5: Personagem Bíblico que Ilustra esta Qualidade
                </label>
                <Input
                  id="biographical-character"
                  value={biographicalCharacter}
                  onChange={(e) => setBiographicalCharacter(e.target.value)}
                  placeholder="Ex.: Barnabé, Moisés, Rute ou Saul"
                />
              </div>
              <div>
                <label
                  htmlFor="memory-verse-ref"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
                >
                  Referência do Versículo
                </label>
                <Input
                  id="memory-verse-ref"
                  value={memoryVerseRef}
                  onChange={(e) => setMemoryVerseRef(e.target.value)}
                  placeholder="Ex.: Mateus 5.5 ou Filipenses 4.5"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="biographical-lessons"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
              >
                Lições da Trajetória do Personagem
              </label>
              <Textarea
                id="biographical-lessons"
                rows={3}
                value={biographicalLessons}
                onChange={(e) => setBiographicalLessons(e.target.value)}
                placeholder="Como esse personagem demonstrou essa característica (positiva ou negativamente)?"
              />
            </div>

            <div>
              <label
                htmlFor="memory-verse"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
              >
                Etapa 6: Versículo para Memorização
              </label>
              <Textarea
                id="memory-verse"
                rows={2}
                value={memoryVerse}
                onChange={(e) => setMemoryVerse(e.target.value)}
                placeholder="Transcreva o versículo-chave escolhido para meditação contínua..."
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
                <span>Próxima: Prática & Projeto 4Ps</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: SITUAÇÃO ESPECÍFICA, PROJETO 4PS E ILUSTRAÇÃO PESSOAL */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Arena Prática, Projeto 4Ps & Ilustração Pessoal
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Do Conhecimento ao Caráter Transformado"
                theologicalPrinciple="Nenhuma força de vontade humana gera fruto do Espírito; dependemos totalmente de Deus (Fp 2.13), mas respondemos com obediência concreta em situações reais."
                whyThisStep="Definir uma relação ou ambiente específico impede abstrações. O projeto com os 4Ps e o registro posterior da vitória consolidam o aprendizado."
                goldenTip="Volte à Etapa 9 após uma semana ou um mês praticando o projeto e registre como Deus concedeu livramento ou progresso real."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="specific-situation"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
              >
                Etapa 7: Situação ou Relacionamento Específico
              </label>
              <Textarea
                id="specific-situation"
                rows={2}
                value={specificSituation}
                onChange={(e) => setSpecificSituation(e.target.value)}
                placeholder="Em qual relacionamento ou área (família, trabalho, finanças, igreja) Deus trabalhará esse traço?"
              />
            </div>

            {/* Etapa 8: Projeto Específico (4Ps) */}
            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                <span>Etapa 8: Projeto Específico (Regra dos 4Ps)</span>
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
                placeholder="Escreva seu projeto de ação em primeira pessoa (Eu...)..."
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
                  Prazo para Cumprimento do Projeto:
                </label>
                <Input
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Ex.: Durante os próximos 30 dias"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="personal-illustration"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1"
              >
                Etapa 9: Ilustração Pessoal (Registro de Progresso e Vitória)
              </label>
              <Textarea
                id="personal-illustration"
                rows={3}
                value={personalIllustration}
                onChange={(e) => setPersonalIllustration(e.target.value)}
                placeholder="Registre o que aconteceu quando a situação real se apresentou, como orou e os frutos alcançados..."
              />
            </div>

            {isCompleted ? (
              <StudyCompletionCard
                methodId="03_QUALIDADE_CARATER"
                title="Estudo de Qualidade de Caráter Concluído!"
                subtitle="Seu projeto de caráter foi registrado no Lugar Santo e salvo no dispositivo."
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

