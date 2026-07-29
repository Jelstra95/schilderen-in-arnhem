import Image from "next/image";
import logoSrc from "@/assets/logo.png";

/* Decorative by default: every lockup pairs the mark with the
   "Schilderen in Arnhem" wordmark, so an alt text here would make
   screen readers announce the brand twice. */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src={logoSrc}
      alt=""
      priority
      className={className ?? "h-8 w-auto"}
    />
  );
}
