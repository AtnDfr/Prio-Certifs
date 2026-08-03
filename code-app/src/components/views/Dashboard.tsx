import { useMemo, useState } from "react";
import type { AppData, CertStatus } from "../../domain/types";
import { getEffectiveTarget, getSourceEnCours, getSourceObtenu } from "../../domain/objectives";
import { getCertStatus, getGap, getProjection, getResteAEngager, STATUS_META } from "../../domain/derived";
import { getEffectivePriority, getProviderPriority, isProviderTouched } from "../../domain/priority";
import { providerStats } from "../../domain/providerStats";
import { useCertPrioritization } from "../../state/CertPrioritizationContext";
import { ProviderBadge } from "../shared/ProviderBadge";
import { seqColor, seqTextColor } from "../../ui/colors";

type ChartMode = "certification" | "provider";

export function Dashboard({ data }: { data: AppData }) {
  const { state } = useCertPrioritization();
  const [chartMode, setChartMode] = useState<ChartMode>("certification");

  const certs = data.certifications;

  const kpis = useMemo(() => {
    const withTarget = certs.filter((c) => getEffectiveTarget(state, c) !== null);
    const withObtenu = withTarget.filter((c) => getSourceObtenu(c) !== null);
    const withEnCours = certs.filter((c) => getSourceEnCours(c) !== null);
    const withProjection = withTarget.filter((c) => getProjection(c) !== null);
    const quotaTotal = withTarget.reduce((s, c) => s + (getEffectiveTarget(state, c) as number), 0);
    const obtenuTotal = withObtenu.reduce((s, c) => s + (getSourceObtenu(c) as number), 0);
    const gapTotal = withObtenu.reduce((s, c) => s + (getGap(state, c) as number), 0);
    const enCoursTotal = withEnCours.reduce((s, c) => s + (getSourceEnCours(c) as number), 0);
    const resteAEngagerTotal = withProjection.reduce((s, c) => s + (getResteAEngager(state, c) as number), 0);
    const overrideCount = Object.keys(state.certOverrides).length;
    const touchedProviders = data.providers.filter((p) => isProviderTouched(state, p)).length;

    return [
      { label: "Fournisseurs", value: String(data.providers.length), sub: `${touchedProviders} priorisés / ${data.providers.length}` },
      { label: "Certifications", value: String(certs.length), sub: `${withTarget.length} avec objectif défini` },
      { label: "Certifiés actuels", value: withObtenu.length ? String(obtenuTotal) : "Non renseigné", sub: "sur les certifications avec objectif" },
      { label: "En cours", value: withEnCours.length ? String(enCoursTotal) : "Non renseigné", sub: "en cours de certification" },
      { label: "Objectif total", value: withTarget.length ? String(quotaTotal) : "Non renseigné", sub: "2026-2027" },
      { label: "Gap (obtenus)", value: withObtenu.length ? String(gapTotal) : "Non renseigné", sub: quotaTotal ? `${Math.round((100 * gapTotal) / quotaTotal)}% du quota` : "—" },
      { label: "Reste à engager", value: withProjection.length ? String(resteAEngagerTotal) : "Non renseigné", sub: "objectif − projection" },
      { label: "Exceptions", value: String(overrideCount), sub: "certifications ajustées individuellement" },
    ];
  }, [certs, data.providers, state]);

  const distribution = useMemo(() => {
    const counts = new Array(11).fill(0);
    if (chartMode === "provider") {
      data.providers.forEach((p) => counts[getProviderPriority(state, p)]++);
    } else {
      certs.forEach((c) => counts[getEffectivePriority(state, c)]++);
    }
    return counts;
  }, [chartMode, data.providers, certs, state]);
  const maxCount = Math.max(...distribution, 1);

  const providerRanking = useMemo(
    () =>
      data.providers
        .map((p) => ({ provider: p, priority: getProviderPriority(state, p) }))
        .sort((a, b) => b.priority - a.priority || a.provider.localeCompare(b.provider))
        .slice(0, 8),
    [data.providers, state],
  );

  const overrides = useMemo(
    () =>
      Object.keys(state.certOverrides)
        .map((id) => {
          const cert = certs.find((c) => c.id === id);
          return cert ? { cert, value: state.certOverrides[id] } : null;
        })
        .filter((x): x is { cert: (typeof certs)[number]; value: number } => x !== null)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [certs, state.certOverrides],
  );

  const gapRanking = useMemo(
    () =>
      data.providers
        .map((p) => ({ provider: p, stats: providerStats(state, data, p) }))
        .filter((r) => r.stats.obtenuKnownCount > 0)
        .sort((a, b) => b.stats.gap - a.stats.gap)
        .slice(0, 6),
    [data, state],
  );
  const maxGap = Math.max(...gapRanking.map((r) => r.stats.gap), 1);

  const withTargetForStatus = useMemo(() => certs.filter((c) => getEffectiveTarget(state, c) !== null), [certs, state]);
  const statusCounts = useMemo(() => {
    const counts: Record<CertStatus, number> = { atteint: 0, bonneVoie: 0, accelerer: 0, na: 0 };
    withTargetForStatus.forEach((c) => counts[getCertStatus(state, c)]++);
    return counts;
  }, [withTargetForStatus, state]);

  const missingData = useMemo(
    () =>
      withTargetForStatus
        .filter((c) => getSourceObtenu(c) === null || getSourceEnCours(c) === null)
        .sort((a, b) => getEffectivePriority(state, b) - getEffectivePriority(state, a))
        .slice(0, 8),
    [withTargetForStatus, state],
  );

  return (
    <>
      <div className="section">
        <div className="kpi-grid">
          {kpis.map((k) => (
            <div className="card kpi" key={k.label}>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section card card-pad">
        <div className="chart-toolbar">
          <h2 className="section-title" style={{ margin: 0 }}>Répartition des priorités</h2>
          <div className="segmented">
            <button className={chartMode === "certification" ? "active" : ""} onClick={() => setChartMode("certification")}>
              Par certification
            </button>
            <button className={chartMode === "provider" ? "active" : ""} onClick={() => setChartMode("provider")}>
              Par fournisseur
            </button>
          </div>
        </div>
        <div className="bars">
          {distribution.map((count, level) => {
            const h = Math.round((140 * count) / maxCount);
            return (
              <div className="bar-col" key={level}>
                <div className="bar-count">{count || ""}</div>
                <div className="bar-rect" style={{ height: Math.max(h, count ? 4 : 2), background: seqColor(level) }} />
                <div className="bar-label">{level}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section two-col">
        <div className="card card-pad">
          <h2 className="section-title">Priorités fournisseurs les plus fortes</h2>
          <div className="mini-list">
            {providerRanking.length === 0 && <div className="empty-hint">Aucun fournisseur.</div>}
            {providerRanking.map((r) => {
              const pct = Math.round(r.priority * 10);
              return (
                <div className="mini-row" key={r.provider}>
                  <ProviderBadge provider={r.provider} size={18} />
                  <span className="name">{r.provider}</span>
                  <div className="mini-track"><div className="mini-fill" style={{ width: `${pct}%`, background: seqColor(r.priority) }} /></div>
                  <span className="mini-val">{r.priority}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card card-pad">
          <h2 className="section-title">Fournisseurs avec le plus grand gap restant</h2>
          <div className="mini-list">
            {gapRanking.length === 0 && <div className="empty-hint">Pas de données d'objectif disponibles.</div>}
            {gapRanking.map((r) => {
              const pct = Math.round((100 * r.stats.gap) / maxGap);
              return (
                <div className="mini-row" key={r.provider}>
                  <ProviderBadge provider={r.provider} size={18} />
                  <span className="name">{r.provider}</span>
                  <div className="mini-track"><div className="mini-fill" style={{ width: `${pct}%`, background: "var(--serious)" }} /></div>
                  <span className="mini-val">{r.stats.gap}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="section card card-pad">
        <h2 className="section-title">Statuts des objectifs</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: -4 }}>
          Calculés sur la projection (certifiés + en cours) — restent « Non renseigné » tant que le nombre de personnes
          en cours de certification n'est pas disponible.
        </p>
        <div className="status-count-row">
          {(Object.keys(STATUS_META) as CertStatus[]).map((key) => {
            const meta = STATUS_META[key];
            const color = key === "na" ? "var(--text-muted)" : meta.color;
            return (
              <div className="status-count-tile" key={key}>
                <div className="status-count-dot" style={{ background: color ?? undefined }} />
                <div className="status-count-value">{statusCounts[key]}</div>
                <div className="status-count-label">{meta.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section two-col">
        <div className="card card-pad">
          <h2 className="section-title">Exceptions individuelles (priorité ≠ priorité du fournisseur)</h2>
          <div className="mini-list">
            {overrides.length === 0 && (
              <div className="empty-hint">Aucune exception saisie pour le moment — toutes les certifications héritent de la priorité de leur fournisseur.</div>
            )}
            {overrides.map((o) => (
              <div className="mini-row" key={o.cert.id}>
                <span className="name">
                  {o.cert.name}{" "}
                  <span className="muted" style={{ fontStyle: "normal", color: "var(--text-muted)" }}>
                    ({o.cert.provider}, provider={getProviderPriority(state, o.cert.provider)})
                  </span>
                </span>
                <span className="priority-chip" style={{ background: seqColor(o.value), color: seqTextColor(o.value) }}>
                  {o.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <h2 className="section-title">Certifications avec un objectif mais des données manquantes</h2>
          <div className="mini-list">
            {missingData.length === 0 && <div className="empty-hint">Aucune certification avec objectif n'a de donnée manquante.</div>}
            {missingData.map((c) => {
              const missing: string[] = [];
              if (getSourceObtenu(c) === null) missing.push("certifiés");
              if (getSourceEnCours(c) === null) missing.push("en cours");
              return (
                <div className="mini-row" key={c.id}>
                  <ProviderBadge provider={c.provider} size={18} />
                  <span className="name">
                    {c.name} <span className="muted" style={{ fontStyle: "normal", color: "var(--text-muted)" }}>({c.provider})</span>
                  </span>
                  <span className="muted" style={{ fontStyle: "normal", fontSize: 11 }}>{missing.join(", ")} non renseigné(s)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
