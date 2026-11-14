"use client";

import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Settings,
  Smartphone,
  Database,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { db } from "@/lib/db";
import { requestPersistentStorage } from "@/lib/storage/persistence";
import { syncProgressWithDatabase } from "@/lib/gamification/progress-calculator";
import { InstallPwaButton } from "@/components/pwa/install-pwa-button";
import { DataBackupPanel } from "@/components/backup/data-backup-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SettingsView() {
  const [isPersisted, setIsPersisted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const progress = useLiveQuery(() => db.progress.get("progress"));
  const studiesCount = useLiveQuery(() => db.studies.count()) ?? 0;

  useEffect(() => {
    let active = true;
    requestPersistentStorage().then((granted) => {
      if (active) {
        setIsPersisted(granted);
      }
    });
    // Sincroniza automaticamente os cálculos ao abrir Configurações
    syncProgressWithDatabase().catch(() => {
      // Ignora falha silenciosa
    });
    return () => {
      active = false;
    };
  }, []);

  const handleRequestPersistence = async () => {
    const granted = await requestPersistentStorage();
    setIsPersisted(granted);
    setStatusMessage(
      granted
        ? "Armazenamento persistente ativado no navegador!"
        : "Seus dados permanecem salvos no IndexedDB local."
    );
  };

  const handleRecalculateProgress = async () => {
    const updated = await syncProgressWithDatabase();
    setStatusMessage(
      `Cálculos sincronizados: ${updated.totalStudiesCompleted} estudos concluídos e ${updated.streakCount} ${
        updated.streakCount === 1 ? "dia" : "dias"
      } na Menorá.`
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Cabeçalho da Página de Configurações */}
      <div className="border-b border-border/80 pb-4">
        <Badge variant="gold" className="mb-2 gap-1">
          <Settings className="h-3 w-3" aria-hidden="true" />
          <span>Sistema & Dispositivo</span>
        </Badge>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
          Configurações
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Gerencie a instalação do aplicativo, backups dos seus estudos,
          armazenamento local e sincronização de progresso.
        </p>
      </div>

      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-300"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{statusMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="underline opacity-80 hover:opacity-100 cursor-pointer shrink-0"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 1. Aplicativo PWA (Instalar) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone
              className="h-5 w-5 text-[var(--tabernacle-gold)]"
              aria-hidden="true"
            />
            <span>Aplicativo PWA</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Instale o aplicativo na tela inicial do seu celular, tablet ou
            computador para acesso rápido 100% offline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstallPwaButton alwaysShowInSettings />
        </CardContent>
      </Card>

      {/* 2. Backup e Restauração */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database
              className="h-5 w-5 text-[var(--tabernacle-blue)]"
              aria-hidden="true"
            />
            <span>Backup e Restauração</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Exporte ou restaure todos os seus estudos, progresso da Menorá,
            insígnias e notas em formato JSON.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataBackupPanel />
        </CardContent>
      </Card>

      {/* 3. Armazenamento Local & Cálculos da Menorá */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck
                className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span>Armazenamento & Cálculos de Progresso</span>
            </CardTitle>
            <Badge
              variant={isPersisted ? "gold" : "outline"}
              className="w-fit text-[11px]"
            >
              {isPersisted
                ? "Armazenamento Persistente Ativo"
                : "IndexedDB Local-First"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            A Menorá contabiliza 1 chama por dia diferente com estudo concluído
            (Streak da Graça). Você pode recalcular os indicadores a qualquer
            momento com base nos estudos salvos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <span className="text-muted-foreground block">
                Total de registros no banco
              </span>
              <strong className="text-base font-serif text-foreground">
                {studiesCount} {studiesCount === 1 ? "estudo" : "estudos"}
              </strong>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <span className="text-muted-foreground block">
                Estudos concluídos
              </span>
              <strong className="text-base font-serif text-foreground">
                {progress?.totalStudiesCompleted ?? 0}
              </strong>
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <span className="text-muted-foreground flex items-center gap-1">
                <Flame
                  className="h-3.5 w-3.5 text-[var(--tabernacle-gold)]"
                  aria-hidden="true"
                />
                Dias na Menorá
              </span>
              <strong className="text-base font-serif text-foreground">
                {progress?.streakCount ?? 0}{" "}
                {(progress?.streakCount ?? 0) === 1 ? "dia" : "dias"}
              </strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRecalculateProgress}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Recalcular Progresso</span>
            </Button>

            {!isPersisted && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRequestPersistence}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <ShieldCheck
                  className="h-3.5 w-3.5 text-emerald-600"
                  aria-hidden="true"
                />
                <span>Ativar Proteção Persistente</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

