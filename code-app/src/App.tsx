import { useState } from "react";
import type { ViewName } from "./App.types";
import { JsonFileDataRepository } from "./data/JsonFileDataRepository";
import { useAppData } from "./data/useAppData";
import { downloadExportedPriorities } from "./data/exportPriorities";
import { CertPrioritizationProvider, useCertPrioritization } from "./state/CertPrioritizationContext";
import { useTheme } from "./ui/useTheme";
import { Header } from "./components/layout/Header";
import { Dashboard } from "./components/views/Dashboard";
import { Bust } from "./components/views/Bust";
import { Providers } from "./components/views/Providers";
import { Certifications } from "./components/views/Certifications";
import { CertDrawer } from "./components/shared/CertDrawer";

const repository = new JsonFileDataRepository();

function AppShell() {
  const dataState = useAppData(repository);
  const { state, resetAll } = useCertPrioritization();
  const { theme, toggle: toggleTheme } = useTheme();

  const [view, setView] = useState<ViewName>("dashboard");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [openCertId, setOpenCertId] = useState<string | null>(null);

  if (dataState.status === "loading") return <div className="section card card-pad">Chargement…</div>;
  if (dataState.status === "error") return <div className="section card card-pad">Erreur de chargement des données.</div>;

  const data = dataState.data;
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
          <span>MVP interne — données non synchronisées entre utilisateurs</span>
        </footer>
      </div>

      {openCertId && <CertDrawer data={data} certId={openCertId} onClose={() => setOpenCertId(null)} />}
    </>
  );
}

export default function App() {
  return (
    <CertPrioritizationProvider>
      <AppShell />
    </CertPrioritizationProvider>
  );
}
