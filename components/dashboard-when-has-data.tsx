"use client";

import { useStore } from "@/lib/store";

export function DashboardWhenHasData({ children }: { children: React.ReactNode }) {
  const { isBackendActive, applications } = useStore();
  if (isBackendActive && applications.length === 0) return null;
  return <>{children}</>;
}
