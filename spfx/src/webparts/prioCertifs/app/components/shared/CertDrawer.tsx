import * as React from "react";
import { useState } from "react";
import type { AppData } from "../../domain/types";
import {
  getBaseTarget,
  getEffectiveTarget,
  getSourceEnCours,
  getSourceObtenu,
  isTargetOverridden,
} from "../../domain/objectives";
import { getResteAEngager } from "../../domain/derived";
import { getCertOverride, getEffectivePriority, getProviderPriority, isPrioritySuggested } from "../../domain/priority";
import { useCertPrioritization } from "../../state/CertPrioritizationContext";
import { PriorityPicker } from "./PriorityPicker";
import { StatusBadge } from "./StatusBadge";
import { ProviderBadge } from "./ProviderBadge";

type Props = {
  data: AppData;
  certId: string | null;
  onClose: () => void;
};

export function CertDrawer({ data, certId, onClose }: Props) {
  const { state, setCertOverride, clearCertOverride, setCertTarget, clearCertTarget } = useCertPrioritization();
  const cert = certId ? data.certifications.find((c) => c.id === certId) : undefined;

  // Ce state local doit se reinitialiser a chaque changement de certification.
  const [draftCertId, setDraftCertId] = useState<string | null>(null);
  const [targetDraft, setTargetDraft] = useState("");
  if (cert && draftCertId !== cert.id) {
    setDraftCertId(cert.id);
    const t = getEffectiveTarget(state, cert);
    setTargetDraft(t !== null ? String(t) : "");
  }

  if (!cert) return <div id="cert-overlay" />;

  const eff = getEffectivePriority(state, cert);
  const overridden = getCertOverride(state, cert.id) !== null;
  const providerPrio = getProviderPriority(state, cert.provider);

  const obtenu = getSourceObtenu(cert);
  const enCours = getSourceEnCours(cert);
  const target = getEffectiveTarget(state, cert);
  const reste = getResteAEngager(state, cert);
  const targetOverridden = isTargetOverridden(state, cert);
  const baseTarget = getBaseTarget(cert);
  const showTargetHint = baseTarget !== null && targetOverridden && state.certTargets[cert.id] !== baseTarget;

  function commitTarget() {
    const raw = targetDraft.trim();
    if (raw === "") clearCertTarget(cert!.id);
    else setCertTarget(cert!.id, Math.max(0, Math.round(Number(raw)) || 0));
  }

  return (
    <div id="cert-overlay" className="open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div id="cert-drawer">
        <div className="drawer-head">
          <div>
            <div className="drawer-title">{cert.name}</div>
            <div className="cell-provider" style={{ fontSize: 13 }}>
              <ProviderBadge provider={cert.provider} size={20} />
              {cert.provider}
              {cert.difficulty && <> · <span className="diff-badge">{cert.difficulty}</span></>}
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>&times;</button>
        </div>
        <div className="drawer-body">
          <div className="kv-grid">
            <div className="kv-box"><div className="kv-label">Certifiés</div><div className="kv-value">{obtenu !== null ? obtenu : "N/A"}</div></div>
            <div className="kv-box"><div className="kv-label">En cours</div><div className="kv-value">{enCours !== null ? enCours : "N/A"}</div></div>
            <div className="kv-box"><div className="kv-label">Objectif fixé</div><div className="kv-value">{target !== null ? target : "N/A"}</div></div>
            <div className="kv-box"><div className="kv-label">Reste à engager</div><div className="kv-value">{reste !== null ? (reste <= 0 ? "Atteint" : reste) : "N/A"}</div></div>
            <div className="kv-box"><div className="kv-label">Statut</div><div className="kv-value" style={{ fontSize: 14 }}><StatusBadge state={state} cert={cert} /></div></div>
          </div>

          <div>
            <div className="kv-label" style={{ marginBottom: 8 }}>Description</div>
            <div className="desc-text">{cert.description || "Non renseigné"}</div>
          </div>

          <div className="kv-label">
            Coût : <span className="na" style={{ textTransform: "none", fontWeight: 400 }}>Non renseigné</span>
          </div>

          <div>
            <div className="kv-label" style={{ marginBottom: 8 }}>Objectif fixé (optionnel)</div>
            <div className="target-editor">
              <input
                type="number"
                min={0}
                step={1}
                className="target-input"
                placeholder="Non défini"
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value)}
              />
              <button className="btn btn-sm" onClick={commitTarget}>Enregistrer</button>
              {target !== null && (
                <button className="btn btn-sm btn-danger-ghost" onClick={() => clearCertTarget(cert.id)}>
                  Supprimer l'objectif
                </button>
              )}
            </div>
            {showTargetHint && (
              <div className="kv-label" style={{ marginTop: 6, fontWeight: 400, fontStyle: "italic" }}>
                Valeur source (2026-2027) : {baseTarget}
              </div>
            )}
          </div>

          <div>
            <div className="kv-label" style={{ marginBottom: 8 }}>
              Priorité effective
              {overridden ? (
                <> <span className="override-badge">ajustée individuellement</span></>
              ) : isPrioritySuggested(state, cert) ? (
                <> <span className="suggested-badge">suggérée selon l'avancement</span></>
              ) : (
                " (héritée du fournisseur)"
              )}
            </div>
            <div className="override-row">
              <PriorityPicker value={eff} onChange={(v) => setCertOverride(cert.id, v)} />
            </div>
            {overridden && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn btn-sm" onClick={() => clearCertOverride(cert.id)}>
                  Revenir à la priorité du fournisseur ({providerPrio})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
