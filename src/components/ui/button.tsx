import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "accent";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-foreground text-background hover:bg-foreground/85",
  accent: "bg-accent text-accent-foreground hover:brightness-110",
  secondary: "bg-subtle text-foreground hover:bg-border",
  outline: "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
  ghost: "text-foreground hover:bg-subtle",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
  icon: "h-10 w-10",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-medium tracking-wide transition-all duration-300 ease-out-expo active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClasses({ variant, size, className })} {...props} />;
}
