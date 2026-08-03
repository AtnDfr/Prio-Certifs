import { useMemo, useState } from "react";
import type { AppData, Certification } from "../../domain/types";
import { certsByProvider, providerStats } from "../../domain/providerStats";
import { getEffectivePriority, getCertOverride, isPrioritySuggested } from "../../domain/priority";
import { getEffectiveTarget, getSourceEnCours, getSourceObtenu, isTargetOverridden } from "../../domain/objectives";
import { getResteAEngager, fmtSortVal } from "../../domain/derived";
import { useCertPrioritization } from "../../state/CertPrioritizationContext";
import { ProviderBadge } from "../shared/ProviderBadge";
import { PriorityPicker } from "../shared/PriorityPicker";
import { ProgressCell } from "../shared/ProgressCell";
import { EnCoursCell } from "../shared/EnCoursCell";
import { ResteAEngagerCell } from "../shared/ResteAEngagerCell";
import { TargetInlineInput } from "../shared/TargetInlineInput";

type SortKey = "name" | "obtenu" | "enCours" | "target" | "reste" | "priority";
type ViewFilter = "all" | "withTarget";

type Props = {
  data: AppData;
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  onOpenCert: (certId: string) => void;
};

export function Providers({ data, selectedProvider, onSelectProvider, onOpenCert }: Props) {
  const { state, setProviderPriority, setCertOverride, setCertTarget, clearCertTarget } = useCertPrioritization();
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });

  const p = selectedProvider;
  const s = providerStats(state, data, p);

  const certs = useMemo(() => {
    let list = certsByProvider(data, p);
    if (filter === "withTarget") list = list.filter((c) => getEffectiveTarget(state, c) !== null);
    list = list.slice().sort((a, b) => {
      const dir = sort.dir;
      switch (sort.key) {
        case "name": return dir * a.name.localeCompare(b.name);
        case "priority": return dir * (getEffectivePriority(state, a) - getEffectivePriority(state, b));
        case "obtenu": return dir * (fmtSortVal(getSourceObtenu(a)) - fmtSortVal(getSourceObtenu(b)));
        case "enCours": return dir * (fmtSortVal(getSourceEnCours(a)) - fmtSortVal(getSourceEnCours(b)));
        case "target": return dir * (fmtSortVal(getEffectiveTarget(state, a)) - fmtSortVal(getEffectiveTarget(state, b)));
        case "reste": return dir * (fmtSortVal(getResteAEngager(state, a)) - fmtSortVal(getResteAEngager(state, b)));
        default: return 0;
      }
    });
    return list;
  }, [data, p, state, filter, sort]);

  function toggleSort(key: SortKey) {
    setSort((cur) => (cur.key === key ? { key, dir: (cur.dir * -1) as 1 | -1 } : { key, dir: 1 }));
  }

  const columns: { key: SortKey | "level"; label: string; sortable: boolean }[] = [
    { key: "name", label: "Certification", sortable: true },
    { key: "level", label: "Niveau", sortable: false },
    { key: "obtenu", label: "Certifiés", sortable: true },
    { key: "enCours", label: "En cours", sortable: true },
    { key: "target", label: "Objectif fixé", sortable: true },
    { key: "reste", label: "Reste à engager", sortable: true },
    { key: "priority", label: "Priorité", sortable: true },
  ];

  return (
    <>
      <div className="section pill-row">
        {data.providers.map((prov) => (
          <button
            key={prov}
            className={"pill" + (prov === selectedProvider ? " active" : "")}
            onClick={() => onSelectProvider(prov)}
          >
            <ProviderBadge provider={prov} size={16} />
            {prov}
          </button>
        ))}
      </div>

      <div className="section card provider-header-card">
        <div className="provider-header-left">
          <ProviderBadge provider={p} size={52} radius="14px" />
          <div>
            <h2 className="provider-title">{p}</h2>
            <div className="provider-meta">
              {s.certCount} certification(s)
              {s.obtenuKnownCount ? ` · ${s.obtenu}/${s.quota} certifiés` : " · certifiés non renseignés"}
              {` · ${s.targetDefinedCount} objectif(s) défini(s)`}
            </div>
          </div>
        </div>
        <div className="provider-priority-block">
          <div className="label">Priorité du fournisseur</div>
          <PriorityPicker value={s.priority} onChange={(v) => setProviderPriority(p, v)} />
        </div>
      </div>

      <div className="section card card-pad">
        <h2 className="section-title">Certifications {p}</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: -4 }}>
          Chaque certification hérite de la priorité du fournisseur ({s.priority}). Cliquez sur un autre niveau pour
          créer une exception individuelle, ou sur une certification pour définir un objectif.
        </p>
        <div className="segmented" style={{ marginBottom: 14 }}>
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Toutes</button>
          <button className={filter === "withTarget" ? "active" : ""} onClick={() => setFilter("withTarget")}>
            Avec objectif défini
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) =>
                  col.sortable ? (
                    <th key={col.key} onClick={() => toggleSort(col.key as SortKey)}>
                      {col.label}{sort.key === col.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                    </th>
                  ) : (
                    <th key={col.key} style={{ cursor: "default" }}>{col.label}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {certs.length === 0 && (
                <tr><td colSpan={7}><div className="empty-hint">Aucune certification ne correspond à ce filtre.</div></td></tr>
              )}
              {certs.map((c: Certification) => {
                const eff = getEffectivePriority(state, c);
                const overridden = getCertOverride(state, c.id) !== null;
                const target = getEffectiveTarget(state, c);
                return (
                  <tr key={c.id}>
                    <td>
                      <button className="link-cell" onClick={() => onOpenCert(c.id)}>{c.name}</button>
                      {overridden && <span className="override-badge">ajustée</span>}
                    </td>
                    <td>{c.difficulty ? <span className="diff-badge">{c.difficulty}</span> : <span className="na">N/A</span>}</td>
                    <td><ProgressCell cert={c} /></td>
                    <td><EnCoursCell cert={c} /></td>
                    <td>
                      <TargetInlineInput
                        key={`${c.id}:${target}`}
                        value={target}
                        overridden={isTargetOverridden(state, c)}
                        onCommit={(v) => (v === null ? clearCertTarget(c.id) : setCertTarget(c.id, v))}
                      />
                    </td>
                    <td><ResteAEngagerCell state={state} cert={c} /></td>
                    <td>
                      <PriorityPicker value={eff} onChange={(v) => setCertOverride(c.id, v)} />
                      {isPrioritySuggested(state, c) && <span className="suggested-badge">suggérée</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
