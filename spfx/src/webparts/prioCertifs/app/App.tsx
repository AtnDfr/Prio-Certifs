import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import type { WebPartContext } from "@microsoft/sp-webpart-base";
import type { ViewName } from "./App.types";
import type { AppData, CertPrioritizationState } from "./domain/types";
import { SharePointObjectivesRepository } from "./data/SharePointObjectivesRepository";
import { SharePointPrioritiesRepository } from "./data/SharePointPrioritiesRepository";
import { downloadExportedPriorities } from "./data/exportPriorities";
import { CertPrioritizationProvider, useCertPrioritization } from "./state/CertPrioritizationContext";
import { useTheme } from "./ui/useTheme";
import { Header } from "./components/layout/Header";
import { Dashboard } from "./components/views/Dashboard";
import { Bust } from "./components/views/Bust";
import { Providers } from "./components/views/Providers";
import { Certifications } from "./components/views/Certifications";
import { CertDrawer } from "./components/shared/CertDrawer";

import "./styles/legacy.scss";

type LoadState =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: AppData; initialState: CertPrioritizationState };

function AppShell({ data }: { data: AppData }) {
  const { state, resetAll } = useCertPrioritization();
  const { theme, toggle: toggleTheme } = useTheme();

  const [view, setView] = useState<ViewName>("dashboard");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [openCertId, setOpenCertId] = useState<string | null>(null);

  const currentProvider = selectedProvider ?? data.providers[0];

  function goToProvider(provider: string) {
    setSelectedProvider(provider);
    setView("provider");
  }

  function handleResetAll() {
    if (window.confirm("Réinitialiser toutes les priorités et tous les objectifs (providers et exceptions) ? Cette action est irréversible.")) {
      resetAll();
    }
  }

  return (
    <>
      <Header
        activeView={view}
        onSelectView={setView}
        theme={theme}
        onToggleTheme={toggleTheme}
        onResetAll={handleResetAll}
        onExportJson={() => downloadExportedPriorities(state, data)}
      />
      <div className="app-shell">
        <main>
          <section className="view active">
            {view === "dashboard" && <Dashboard data={data} />}
            {view === "comex" && <Bust data={data} onSelectProvider={goToProvider} />}
            {view === "provider" && (
              <Providers
                data={data}
                selectedProvider={currentProvider}
                onSelectProvider={setSelectedProvider}
                onOpenCert={setOpenCertId}
              />
            )}
            {view === "certification" && <Certifications data={data} onOpenCert={setOpenCertId} />}
          </section>
        </main>
        <footer className="app-footer">
          <span>Catalogue : {data.certifications.length} certifications · {data.providers.length} fournisseurs</span>
          <span>Priorités partagées, enregistrées dans SharePoint (liste « Priorités Certifs »)</span>
        </footer>
      </div>

      {openCertId && <CertDrawer data={data} certId={openCertId} onClose={() => setOpenCertId(null)} />}
    </>
  );
}

export type PrioCertifsAppProps = {
  context: WebPartContext;
};

export default function PrioCertifsApp({ context }: PrioCertifsAppProps) {
  const dataRepository = useMemo(() => new SharePointObjectivesRepository(context), [context]);
  const stateRepository = useMemo(() => new SharePointPrioritiesRepository(context), [context]);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setLoadState({ status: "loading" });
    Promise.all([dataRepository.getAppData(), stateRepository.load()])
      .then(([data, initialState]) => {
        if (cancelled) return;
        stateRepository.primeBaseline(initialState, data);
        setLoadState({ status: "ready", data, initialState });
      })
      .catch((error) => {
        if (!cancelled) setLoadState({ status: "error", error });
      });
    return () => {
      cancelled = true;
    };
  }, [dataRepository, stateRepository]);

  if (loadState.status === "loading") return <div className="section card card-pad">Chargement…</div>;
  if (loadState.status === "error") {
    return (
      <div className="section card card-pad">
        Erreur de chargement des données SharePoint. Vérifiez que les listes « Objectifs certifs » et
        « Priorités Certifs » existent sur ce site et que vous y avez accès.
      </div>
    );
  }

  return (
    <CertPrioritizationProvider initialState={loadState.initialState} data={loadState.data} stateRepository={stateRepository}>
      <AppShell data={loadState.data} />
    </CertPrioritizationProvider>
  );
}
