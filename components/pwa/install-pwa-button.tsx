"use client";

import React, { useEffect, useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface InstallPwaButtonProps {
  alwaysShowInSettings?: boolean;
}

/**
 * Botão de instalação do aplicativo PWA ("Instalar").
 * Captura `beforeinstallprompt` em navegadores compatíveis e fornece instruções
 * caso o navegador exija instalação pelo menu nativo.
 */
export function InstallPwaButton({
  alwaysShowInSettings = false,
}: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standaloneMatch =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (standaloneMatch) {
      Promise.resolve().then(() => setIsInstalled(true));
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setHintMessage(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isInstalled) {
    if (!alwaysShowInSettings) return null;
    return (
      <Badge variant="gold" className="gap-1.5 py-1 px-3 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Instalado</span>
      </Badge>
    );
  }

  if (!deferredPrompt && !alwaysShowInSettings) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }

    setHintMessage(
      "Para instalar neste navegador, use o ícone de instalação na barra de endereços ou 'Adicionar à tela inicial' no menu do navegador."
    );
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="gold"
        size="sm"
        onClick={handleInstallClick}
        aria-label="Instalar aplicativo PWA no dispositivo"
        className="gap-1.5 text-xs shadow-xs"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Instalar</span>
      </Button>

      {hintMessage && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-muted-foreground bg-secondary/60 border border-border rounded-xl px-3 py-2"
        >
          {hintMessage}
        </p>
      )}
    </div>
  );
}
