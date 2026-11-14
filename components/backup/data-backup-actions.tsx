"use client";

import React, { useId, useState } from "react";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  exportFullBackupToFile,
  importBackupTransactional,
} from "@/lib/backup/backup-service";
import { syncProgressWithDatabase } from "@/lib/gamification/progress-calculator";
import { Button } from "@/components/ui/button";

/**
 * Ações de Backup e Restauração ("Backup" e "Restaurar")
 * com validação atômica via Zod e sincronização automática de progresso.
 */
export function DataBackupPanel() {
  const inputId = useId();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleExport = async () => {
    try {
      const { studiesCount, hasProgress } = await exportFullBackupToFile();
      setFeedback({
        type: "success",
        message: `Backup exportado com sucesso (${studiesCount} estudos${
          hasProgress ? " + progresso da Menorá" : ""
        }).`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: "error", message: msg });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = String(event.target?.result ?? "");
        const { importedCount } = await importBackupTransactional(content);
        await syncProgressWithDatabase();
        setFeedback({
          type: "success",
          message: `Sucesso! ${importedCount} estudos e progresso restaurados no dispositivo.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setFeedback({
          type: "error",
          message: `Erro ao restaurar backup: ${msg}`,
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 text-xs cursor-pointer"
        >
          <Download
            className="h-3.5 w-3.5 text-[var(--tabernacle-gold)]"
            aria-hidden="true"
          />
          <span>Backup</span>
        </Button>

        <label htmlFor={inputId} className="cursor-pointer inline-flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            className="gap-2 text-xs cursor-pointer"
          >
            <span>
              <Upload
                className="h-3.5 w-3.5 text-[var(--tabernacle-blue)]"
                aria-hidden="true"
              />
              <span>Restaurar</span>
            </span>
          </Button>
          <input
            id={inputId}
            aria-label="Selecionar arquivo JSON de backup para restaurar"
            type="file"
            accept=".json"
            onChange={handleImport}
            className="sr-only"
          />
        </label>
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium ${
            feedback.type === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          <span className="flex items-center gap-1.5">
            {feedback.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Fechar aviso"
            className="underline opacity-80 hover:opacity-100 cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
