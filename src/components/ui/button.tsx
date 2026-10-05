import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/35 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_20px_rgb(8_48_41/14%)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_12px_24px_rgb(8_48_41/18%)]",
        secondary:
          "border border-border bg-card text-foreground shadow-[0_2px_8px_rgb(8_48_41/5%)] hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/70",
        ghost: "text-foreground hover:bg-muted/80",
        danger: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        default: "h-11",
        sm: "h-9 min-h-9 rounded-lg px-3 text-xs",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
