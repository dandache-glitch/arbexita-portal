import Image from "next/image";

export function Logo({ variant = "full" }: { variant?: "full" | "icon" }) {
  return (
    <Image
      src={variant === "full" ? "/logo.svg" : "/icon.svg"}
      alt="Arbexita"
      width={variant === "full" ? 240 : 48}
      height={variant === "full" ? 48 : 48}
      priority
    />
  );
}
