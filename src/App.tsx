import { useState } from "react";
import { StoreProvider } from "./store/store";
import { Header } from "./components/Header";
import { OfflineBanner } from "./components/OfflineBanner";
import { KpiRow } from "./components/KpiRow";
import { EventStream } from "./components/EventStream";
import { RiskActivity } from "./components/RiskActivity";
import { RiskDistribution } from "./components/RiskDistribution";
import { EvaluationPanel } from "./components/EvaluationPanel";
import { AlertCenter } from "./components/AlertCenter";
import { InvestigationPanel } from "./components/InvestigationPanel";

function CommandCenter() {
  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <KpiRow />
      <div className="grid grid-cols-1 xl:grid-cols-[1.75fr_1fr] gap-3 flex-1 min-h-0">
        <EventStream />
        <div className="flex flex-col gap-3 min-h-0">
          <RiskActivity />
          <RiskDistribution />
          <EvaluationPanel />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("command");

  return (
    <StoreProvider>
      <div className="flex flex-col h-full bg-background text-foreground">
        <Header view={view} onView={setView} />
        <OfflineBanner />
        <main className="flex-1 min-h-0 canvas-grid">
          <div className="h-full p-4 overflow-auto">
            {view === "command" ? (
              <CommandCenter />
            ) : (
              <div className="h-full min-h-0">
                <AlertCenter />
              </div>
            )}
          </div>
        </main>
        <InvestigationPanel />
      </div>
    </StoreProvider>
  );
}
