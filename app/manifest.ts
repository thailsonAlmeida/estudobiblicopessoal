import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Estudo Bíblico Pessoal • Tabernáculo",
    short_name: "Estudo Bíblico",
    description:
      "Aplicativo de estudo bíblico pessoal guiado pelos 12 métodos de Rick Warren, com arquitetura local-first e gamificação sagrada.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#FDFBF7",
    theme_color: "#1B4965",
    lang: "pt-BR",
    categories: ["education", "books", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Estudo Devocional",
        short_name: "Devocional",
        description: "Iniciar um novo Estudo Devocional (Método 01)",
        url: "/estudo/01_DEVOCIONAL/novo",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Meu Diário",
        short_name: "Diário",
        description: "Acessar estudos salvos e backups",
        url: "/diario",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Santuário",
        short_name: "Santuário",
        description: "Ver Menorá de 7 Chamas e Relicário",
        url: "/santuario",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}

