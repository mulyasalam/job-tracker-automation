import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/lib/mock-data";

const STATUS_MAP: Record<ApplicationStatus, { label: string; className: string }> = {
  applied: { label: "Submitted", className: "text-ash" },
  interviewing: { label: "In Process", className: "text-vermilion" },
  rejected: { label: "Closed", className: "text-oxblood opacity-60" },
  hired: { label: "Offered", className: "text-moss" },
};

export function StatusStamp({ status, className }: { status: ApplicationStatus; className?: string }) {
  const cfg = STATUS_MAP[status];
  return <span className={cn("stamp", cfg.className, className)}>{cfg.label}</span>;
}
