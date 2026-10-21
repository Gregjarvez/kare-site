import type { ReactNode } from "react";

export function Phone({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`phone ${className}`}>
      <div className="phone-screen">{children}</div>
    </div>
  );
}

export function Shot({ name, alt, eager = false }: { name: string; alt: string; eager?: boolean }) {
  return (
    <img
      src={`/shots/${name}.webp`}
      alt={alt}
      width={660}
      height={1434}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
