import Image from "next/image";
import lockup from "./assets/logo-lockup-black.png";
import mark from "./assets/logo-mark-tight.png";

export function LogoLockup() {
  return <Image src={lockup} alt="Clover" preload className="h-7 w-auto" />;
}

export function LogoMark({ size = 28, alt = "Clover" }: { size?: number; alt?: string }) {
  return <Image src={mark} alt={alt} width={size} height={size} />;
}

export function BuiltByBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white py-1.5 pr-3 pl-2 text-xs text-muted-foreground">
      <LogoMark size={18} alt="" />
      Built by Rongouz @ Clover
    </span>
  );
}
