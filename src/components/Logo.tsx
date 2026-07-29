import Image from "next/image";
import logoClay from "@/assets/logo.png";
import logoPaper from "@/assets/logo-white.png";

/* `paper` is the same mark recoloured to --color-paper, for the dark
   surfaces (auth shell, splash hero) where clay reads much weaker than
   the paper-white wordmark beside it. */
type LogoVariant = "clay" | "paper";

/* Decorative by default: every lockup pairs the mark with the
   "Schilderen in Arnhem" wordmark, so an alt text here would make
   screen readers announce the brand twice. */
export function Logo({
  className,
  variant = "clay",
}: {
  className?: string;
  variant?: LogoVariant;
}) {
  return (
    <Image
      src={variant === "paper" ? logoPaper : logoClay}
      alt=""
      priority
      className={className ?? "h-8 w-auto"}
    />
  );
}
