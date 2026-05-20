import { cn } from "@/lib/utils";

export function CompanyMark({
  name,
  color,
  size = 40,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const letter = name[0]?.toUpperCase() ?? "?";
  return (
    <div
      className={cn(
        "shrink-0 grid place-items-center font-display font-bold leading-none select-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color,
        color: getReadableTextColor(color),
        fontSize: size * 0.5,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)",
      }}
      aria-label={name}
    >
      {letter}
    </div>
  );
}

function getReadableTextColor(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.55 ? "#181613" : "#FAF6ED";
}
