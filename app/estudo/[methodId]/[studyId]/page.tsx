"use client";

import React, { useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { MethodId } from "@/lib/types/study";
import { BIBLE_STUDY_METHODS } from "@/lib/constants/methods";
import { DevotionalWizard } from "@/components/study/devotional-wizard";
import { ChapterSummaryWizard } from "@/components/study/chapter-summary-wizard";
import { CharacterQualityWizard } from "@/components/study/character-quality-wizard";
import { ThematicWizard } from "@/components/study/thematic-wizard";
import { BiographicalWizard } from "@/components/study/biographical-wizard";
import { TopicalWizard } from "@/components/study/topical-wizard";
import { MorphologicalWizard } from "@/components/study/morphological-wizard";
import { HistoricalCulturalWizard } from "@/components/study/historical-cultural-wizard";
import { BookSurveyWizard } from "@/components/study/book-survey-wizard";
import { ChapterAnalysisWizard } from "@/components/study/chapter-analysis-wizard";
import { BookSynthesisWizard } from "@/components/study/book-synthesis-wizard";
import { VerseByVerseWizard } from "@/components/study/verse-by-verse-wizard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const WizardSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-4 py-8 animate-pulse">
    <div className="h-12 rounded-2xl bg-muted/50" />
    <div className="h-96 rounded-2xl bg-muted/40" />
  </div>
);

function StudyDetailContent() {
  const params = useParams<{ methodId: string; studyId: string }>();
  const methodId = params?.methodId ?? "";
  const studyId = params?.studyId ?? "novo";

  // Gera ou estabiliza o ID único do estudo
  const [actualStudyId] = useState<string>(() => {
    if (studyId === "novo") {
      return `study-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    return studyId;
  });

  // Busca reativa do estudo no IndexedDB
  const study = useLiveQuery(
    () => db.studies.get(actualStudyId),
    [actualStudyId]
  );

  const methodMetadata = BIBLE_STUDY_METHODS[methodId as MethodId];

  if (!methodMetadata) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold">Método não encontrado</h2>
        <Link href="/">
          <Button variant="outline">Voltar ao Tabernáculo</Button>
        </Link>
      </div>
    );
  }

  switch (methodMetadata.id) {
    case "01_DEVOCIONAL":
      return <DevotionalWizard initialStudy={study} studyId={actualStudyId} />;
    case "02_RESUMO_CAPITULO":
      return <ChapterSummaryWizard initialStudy={study} studyId={actualStudyId} />;
    case "03_QUALIDADE_CARATER":
      return <CharacterQualityWizard initialStudy={study} studyId={actualStudyId} />;
    case "04_TEMATICO":
      return <ThematicWizard initialStudy={study} studyId={actualStudyId} />;
    case "05_BIOGRAFICO":
      return <BiographicalWizard initialStudy={study} studyId={actualStudyId} />;
    case "06_TOPICOS":
      return <TopicalWizard initialStudy={study} studyId={actualStudyId} />;
    case "07_MORFOLOGICO":
      return <MorphologicalWizard initialStudy={study} studyId={actualStudyId} />;
    case "08_HISTORICO_CULTURAL":
      return <HistoricalCulturalWizard initialStudy={study} studyId={actualStudyId} />;
    case "09_INVESTIGATIVO":
      return <BookSurveyWizard initialStudy={study} studyId={actualStudyId} />;
    case "10_ANALITICO_CAPITULO":
      return <ChapterAnalysisWizard initialStudy={study} studyId={actualStudyId} />;
    case "11_SINTETICO":
      return <BookSynthesisWizard initialStudy={study} studyId={actualStudyId} />;
    case "12_VERSICULO_POR_VERSICULO":
      return <VerseByVerseWizard initialStudy={study} studyId={actualStudyId} />;
  }
}

export default function StudyDetailPage() {
  return (
    <Suspense fallback={<WizardSkeleton />}>
      <StudyDetailContent />
    </Suspense>
  );
}
