import React, { Suspense } from "react";
import { SanctuaryRelicario } from "@/components/gamification/sanctuary-relicario";

export default function SantuarioPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto h-96 animate-pulse rounded-2xl bg-muted/40" />
      }
    >
      <SanctuaryRelicario />
    </Suspense>
  );
}

