"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  ListOrdered,
  ArrowRight,
  HeartHandshake,
  BookOpen,
  Sparkles,
  Compass,
  Users,
  Layers,
  SearchCode,
  Landmark,
  Eye,
  Microscope,
  Puzzle,
  TableProperties,
} from "lucide-react";
import { MethodMetadata } from "@/lib/constants/methods";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MethodCardProps {
  method: MethodMetadata;
}

const ICONS_MAP: Record<string, React.ElementType> = {
  HeartHandshake,
  BookOpen,
  Sparkles,
  Compass,
  Users,
  Layers,
  SearchCode,
  Landmark,
  Eye,
  Microscope,
  Puzzle,
  TableProperties,
};

export function MethodCard({ method }: MethodCardProps) {
  const IconComponent = ICONS_MAP[method.iconName] || BookOpen;

  const levelVariantMap = {
    atrio: "blue" as const,
    lugar_santo: "purple" as const,
    santo_dos_santos: "gold" as const,
  };

  return (
    <Card
      goldAccent={method.sanctuaryLevel === "santo_dos_santos"}
      className="flex flex-col justify-between hover:shadow-md transition-all hover:border-[var(--tabernacle-blue)]/50 group"
    >
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant={levelVariantMap[method.sanctuaryLevel]}>
            {method.sanctuaryLevelLabel}
          </Badge>
          <span className="text-xs font-mono font-semibold text-muted-foreground/70">
            #{String(method.order).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary border border-border group-hover:bg-[var(--tabernacle-blue)]/10 transition-colors">
            <IconComponent className="h-5 w-5 text-[var(--tabernacle-blue)]" />
          </div>
          <div>
            <CardTitle className="text-lg group-hover:text-[var(--tabernacle-blue)] transition-colors">
              {method.name}
            </CardTitle>
            <p className="text-xs text-[var(--tabernacle-gold)] font-medium mt-0.5">
              {method.tagline}
            </p>
          </div>
        </div>

        <CardDescription className="pt-2 line-clamp-3 text-xs leading-relaxed">
          {method.shortDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[var(--tabernacle-gold)]" />
            {method.timeEstimate}
          </span>
          <span className="flex items-center gap-1.5">
            <ListOrdered className="h-3.5 w-3.5 text-[var(--tabernacle-blue)]" />
            {method.totalSteps} etapas
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/estudo/${method.id}/novo`} className="w-full">
          <Button variant="default" className="w-full justify-between group-hover:bg-[var(--tabernacle-blue)] cursor-pointer">
            <span>Iniciar Estudo</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

