import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        gold:
          "border-[var(--tabernacle-gold)] bg-[var(--tabernacle-gold)]/10 text-[var(--accent-foreground)] dark:text-[var(--tabernacle-gold)]",
        blue:
          "border-[var(--tabernacle-blue)] bg-[var(--tabernacle-blue)]/10 text-[var(--tabernacle-blue)] dark:text-[var(--tabernacle-blue)]",
        purple:
          "border-[var(--tabernacle-purple)] bg-[var(--tabernacle-purple)]/10 text-[var(--tabernacle-purple)] dark:text-[var(--tabernacle-purple)]",
        crimson:
          "border-[var(--tabernacle-crimson)] bg-[var(--tabernacle-crimson)]/10 text-[var(--tabernacle-crimson)] dark:text-[var(--tabernacle-crimson)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

