import * as React from "react";
import type { ViewName } from "../../App.types";
import wavestoneLogo from "../../assets/wavestone-logo.png";

const TABS: { key: ViewName; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "comex", label: "BUST" },
  { key: "provider", label: "Providers" },
  { key: "certification", label: "Certifications" },
];

type Props = {
  activeView: ViewName;
  onSelectView: (view: ViewName) => void;
  theme: "light" | "dark" | null;
  onToggleTheme: () => void;
  onResetAll: () => void;
  onExportJson: () => void;
  saveError: string | null;
};

export function Header({ activeView, onSelectView, theme, onToggleTheme, onResetAll, onExportJson, saveError }: Props) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="topbar-row">
          <div className="brand">
            <img className="brand-mark" src={wavestoneLogo} alt="Wavestone" />
            <div className="brand-text">
              <h1>Priorisation des certifications</h1>
              <p>Wavestone — pilotage stratégique par fournisseur</p>
            </div>
          </div>
          <div className="top-actions">
            <button className="btn btn-ghost" title="Changer de thème" onClick={onToggleTheme}>
              {theme === "dark" ? "Mode clair" : "Mode sombre"}
            </button>
            <button className="btn btn-ghost btn-danger-ghost" title="Réinitialiser toutes les priorités" onClick={onResetAll}>
              Réinitialiser
            </button>
            <button
              className="btn btn-ghost"
              title="Exporter les priorités au format JSON, pour un agent ou un traitement automatisé"
              onClick={onExportJson}
            >
              Exporter les priorités (JSON)
            </button>
          </div>
        </div>
        <div id="mode-banner">
          {saveError ? (
            <div className="mode-banner error">{saveError}</div>
          ) : (
            <div className="mode-banner edit">Mode édition — vos priorités sont enregistrées automatiquement dans SharePoint (liste « Priorités Certifs »).</div>
          )}
        </div>
        <nav className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={"tab" + (activeView === tab.key ? " active" : "")}
              onClick={() => onSelectView(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
