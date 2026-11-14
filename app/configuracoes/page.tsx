import React, { Suspense } from "react";
import { SettingsView } from "@/components/settings/settings-view";

export default function ConfiguracoesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto h-96 animate-pulse rounded-2xl bg-muted/40" />
      }
    >
      <SettingsView />
    </Suspense>
  );
}

