import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { DossierHero } from "@/components/dossier-hero";
import { AgendaStrip } from "@/components/agenda-strip";
import { BoardSection } from "@/components/board-section";
import { EmptyInbox } from "@/components/empty-inbox";
import { DashboardWhenHasData } from "@/components/dashboard-when-has-data";

export default function Home() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar />
        <EmptyInbox />
        <DashboardWhenHasData>
          <DossierHero />
          <AgendaStrip />
          <BoardSection />
        </DashboardWhenHasData>
        <Footer />
      </main>
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-8 py-8 rule-top">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-ash">
        <span>Dossier — A personal job archive</span>
        <span>Printed locally · OAuth read-only · No data leaves your machine</span>
        <span>v0.1 · Beta</span>
      </div>
    </footer>
  );
}
