import React from "react";
import { cn } from "@/lib/utils";

interface MenorahLogoProps {
  className?: string;
  size?: number;
  withBackground?: boolean;
}

/**
 * Logotipo e ícone sagrado da Menorá de 7 Chamas do Tabernáculo.
 * Representa a luz contínua da Palavra (Êxodo 25.31-40) e o Streak da Graça.
 */
export function MenorahLogo({
  className,
  size = 24,
  withBackground = false,
}: MenorahLogoProps) {
  if (withBackground) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className={cn("shrink-0", className)}
      >
        <rect width="64" height="64" rx="16" fill="#1B4965" />
        <rect
          x="3.5"
          y="3.5"
          width="57"
          height="57"
          rx="13"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeOpacity="0.55"
        />
        {/* Base e haste central */}
        <path
          d="M22 52H42M26 48H38M32 20V48"
          stroke="#D4AF37"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 3 pares de braços da Menorá */}
        <path
          d="M14 23V27C14 36.941 22.059 45 32 45C41.941 45 50 36.941 50 27V23"
          stroke="#D4AF37"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M20 23V27C20 33.627 25.373 39 32 39C38.627 39 44 33.627 44 27V23"
          stroke="#D4AF37"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M26 23V27C26 30.314 28.686 33 32 33C35.314 33 38 30.314 38 27V23"
          stroke="#D4AF37"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* 7 Chamas */}
        <path d="M14 14C14 14 16.5 17 16.5 19C16.5 20.38 15.38 21.5 14 21.5C12.62 21.5 11.5 20.38 11.5 19C11.5 17 14 14 14 14Z" fill="#F4D576" />
        <path d="M20 14C20 14 22.5 17 22.5 19C22.5 20.38 21.38 21.5 20 21.5C18.62 21.5 17.5 20.38 17.5 19C17.5 17 20 14 20 14Z" fill="#F4D576" />
        <path d="M26 14C26 14 28.5 17 28.5 19C28.5 20.38 27.38 21.5 26 21.5C24.62 21.5 23.5 20.38 23.5 19C23.5 17 26 14 26 14Z" fill="#F4D576" />
        <path d="M32 11.5C32 11.5 34.8 14.8 34.8 17C34.8 18.55 33.55 19.8 32 19.8C30.45 19.8 29.2 18.55 29.2 17C29.2 14.8 32 11.5 32 11.5Z" fill="#FFE699" />
        <path d="M38 14C38 14 40.5 17 40.5 19C40.5 20.38 39.38 21.5 38 21.5C36.62 21.5 35.5 20.38 35.5 19C35.5 17 38 14 38 14Z" fill="#F4D576" />
        <path d="M44 14C44 14 46.5 17 46.5 19C46.5 20.38 45.38 21.5 44 21.5C42.62 21.5 41.5 20.38 41.5 19C41.5 17 44 14 44 14Z" fill="#F4D576" />
        <path d="M50 14C50 14 52.5 17 52.5 19C52.5 20.38 51.38 21.5 50 21.5C48.62 21.5 47.5 20.38 47.5 19C47.5 17 50 14 50 14Z" fill="#F4D576" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {/* Base e haste central */}
      <path
        d="M20 55H44M25 50H39M32 18V50"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 3 pares de braços da Menorá */}
      <path
        d="M11 22V26C11 37.598 20.402 47 32 47C43.598 47 53 37.598 53 26V22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 22V26C18 33.732 24.268 40 32 40C39.732 40 46 33.732 46 26V22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M25 22V26C25 29.866 28.134 33 32 33C35.866 33 39 29.866 39 26V22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* 7 Chamas */}
      <path d="M11 12C11 12 13.6 15.2 13.6 17.3C13.6 18.74 12.44 19.9 11 19.9C9.56 19.9 8.4 18.74 8.4 17.3C8.4 15.2 11 12 11 12Z" fill="#F4D576" />
      <path d="M18 12C18 12 20.6 15.2 20.6 17.3C20.6 18.74 19.44 19.9 18 19.9C16.56 19.9 15.4 18.74 15.4 17.3C15.4 15.2 18 12 18 12Z" fill="#F4D576" />
      <path d="M25 12C25 12 27.6 15.2 27.6 17.3C27.6 18.74 26.44 19.9 25 19.9C23.56 19.9 22.4 18.74 22.4 17.3C22.4 15.2 25 12 25 12Z" fill="#F4D576" />
      <path d="M32 9C32 9 35 12.6 35 15C35 16.66 33.66 18 32 18C30.34 18 29 16.66 29 15C29 12.6 32 9 32 9Z" fill="#FFE699" />
      <path d="M39 12C39 12 41.6 15.2 41.6 17.3C41.6 18.74 40.44 19.9 39 19.9C37.56 19.9 36.4 18.74 36.4 17.3C36.4 15.2 39 12 39 12Z" fill="#F4D576" />
      <path d="M46 12C46 12 48.6 15.2 48.6 17.3C48.6 18.74 47.44 19.9 46 19.9C44.56 19.9 43.4 18.74 43.4 17.3C43.4 15.2 46 12 46 12Z" fill="#F4D576" />
      <path d="M53 12C53 12 55.6 15.2 55.6 17.3C55.6 18.74 54.44 19.9 53 19.9C51.56 19.9 50.4 18.74 50.4 17.3C50.4 15.2 53 12 53 12Z" fill="#F4D576" />
    </svg>
  );
}

