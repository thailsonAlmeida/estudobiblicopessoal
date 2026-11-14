import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/navigation/header";
import { SwRegistrar } from "@/components/pwa/sw-registrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "Estudo Bíblico Pessoal";
const APP_TITLE = "Estudo Bíblico Pessoal • 12 Métodos de Rick Warren";
const APP_DESCRIPTION =
  "Aprofunde sua intimidade com Deus através dos 12 métodos bíblicos de Rick Warren estruturados na jornada do Tabernáculo. Aplicativo gratuito, 100% offline, local-first e sem culpa.";
const APP_URL = "https://estudobiblicopessoal.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "Estudo Bíblico",
    "Estudo Bíblico Pessoal",
    "Rick Warren",
    "12 Métodos de Estudo Bíblico",
    "Tabernáculo",
    "Devocional",
    "PWA",
    "Local-First",
    "Menorá",
    "Regra dos 4Ps",
    "Bíblia Sagrada",
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  category: "Religion & Spirituality",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Estudo Bíblico Pessoal — 12 Métodos de Rick Warren",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-primary focus:text-primary-foreground focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Pular para o conteúdo principal
        </a>
        <SwRegistrar />
        <Suspense fallback={<header className="h-16 border-b border-border/80 bg-background/95" />}>
          <Header />
        </Suspense>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full focus:outline-none"
        >
          {children}
        </main>
        <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          <p>
            Estudo Bíblico Pessoal • Baseado em <em>12 Maneiras de Estudar a Bíblia Sozinho</em> (Rick Warren)
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            Privacidade total • 100% dos dados salvos no seu próprio dispositivo (IndexedDB)
          </p>
        </footer>
      </body>
    </html>
  );
}
