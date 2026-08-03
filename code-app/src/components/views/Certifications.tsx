import { useMemo, useState } from "react";
import type { AppData, Certification } from "../../domain/types";
import { getEffectivePriority, getCertOverride, isPrioritySuggested } from "../../domain/priority";
import { getEffectiveTarget, getSourceEnCours, getSourceObtenu, isTargetOverridden } from "../../domain/objectives";
import { fmtSortVal } from "../../domain/derived";
import { useCertPrioritization } from "../../state/CertPrioritizationContext";
import { ProviderBadge } from "../shared/ProviderBadge";
import { PriorityPicker } from "../shared/PriorityPicker";
import { ProgressCell } from "../shared/ProgressCell";
import { EnCoursCell } from "../shared/EnCoursCell";
import { StatusBadge } from "../shared/StatusBadge";
import { TargetInlineInput } from "../shared/TargetInlineInput";

type SortKey = "name" | "provider" | "priority" | "obtenu" | "enCours" | "target";
type Filter = { search: string; provider: string; difficulty: string };

export function Certifications({ data, onOpenCert }: { data: AppData; onOpenCert: (certId: string) => void }) {
  const { state, setCertOverride, setCertTarget, clearCertTarget } = useCertPrioritization();
  const [filter, setFilter] = useState<Filter>({ search: "", provider: "ALL", difficulty: "ALL" });
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });

  const difficulties = useMemo(
    () => Array.from(new Set(data.certifications.map((c) => c.difficulty).filter((d): d is string => Boolean(d)))),
    [data],
  );

  const list = useMemo(() => {
    let result = data.certifications.filter((c) => {
      if (filter.provider !== "ALL" && c.provider !== filter.provider) return false;
      if (filter.difficulty !== "ALL" && c.difficulty !== filter.difficulty) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.provider.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    result = result.slice().sort((a, b) => {
      const dir = sort.dir;
      switch (sort.key) {
        case "name": return dir * a.name.localeCompare(b.name);
        case "provider": return dir * a.provider.localeCompare(b.provider);
        case "priority": return dir * (getEffectivePriority(state, a) - getEffectivePriority(state, b));
        case "obtenu": return dir * (fmtSortVal(getSourceObtenu(a)) - fmtSortVal(getSourceObtenu(b)));
        case "enCours": return dir * (fmtSortVal(getSourceEnCours(a)) - fmtSortVal(getSourceEnCours(b)));
        case "target": return dir * (fmtSortVal(getEffectiveTarget(state, a)) - fmtSortVal(getEffectiveTarget(state, b)));
        default: return 0;
      }
    });
    return result;
  }, [data, state, filter, sort]);

  function toggleSort(key: SortKey) {
    setSort((cur) => (cur.key === key ? { key, dir: (cur.dir * -1) as 1 | -1 } : { key, dir: 1 }));
  }

  const columns: { key: SortKey | "difficulty" | "status"; label: string; sortable: boolean }[] = [
    { key: "name", label: "Certification", sortable: true },
    { key: "provider", label: "Fournisseur", sortable: true },
    { key: "difficulty", label: "Difficulté", sortable: false },
    { key: "obtenu", label: "Certifiés", sortable: true },
    { key: "enCours", label: "En cours", sortable: true },
    { key: "target", label: "Objectif fixé", sortable: true },
    { key: "status", label: "Statut", sortable: false },
    { key: "priority", label: "Priorité", sortable: true },
  ];

  return (
    <div className="card card-pad">
      <h2 className="section-title">Vue Certification — recherche et ajustement fin</h2>
      <div className="filter-row">
        <input
          type="text"
          className="search-input"
          placeholder="Rechercher une certification ou un fournisseur…"
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="select-input"
          value={filter.provider}
          onChange={(e) => setFilter((f) => ({ ...f, provider: e.target.value }))}
        >
          <option value="ALL">Tous les fournisseurs</option>
          {data.providers.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          className="select-input"
          value={filter.difficulty}
          onChange={(e) => setFilter((f) => ({ ...f, difficulty: e.target.value }))}
        >
          <option value="ALL">Toutes difficultés</option>
          {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
        {list.length} certification(s) affichée(s) sur {data.certifications.length}
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
            {list.length === 0 && (
              <tr><td colSpan={8}><div className="empty-hint">Aucune certification ne correspond aux filtres.</div></td></tr>
            )}
            {list.map((c: Certification) => {
              const eff = getEffectivePriority(state, c);
              const overridden = getCertOverride(state, c.id) !== null;
              const target = getEffectiveTarget(state, c);
              return (
                <tr key={c.id}>
                  <td>
                    <button className="link-cell" onClick={() => onOpenCert(c.id)}>{c.name}</button>
                    {overridden && <span className="override-badge">ajustée</span>}
                  </td>
                  <td>
                    <span className="cell-provider" style={{ fontWeight: 600 }}>
                      <ProviderBadge provider={c.provider} size={20} />
                      {c.provider}
                    </span>
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
                  <td><StatusBadge state={state} cert={c} /></td>
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
  );
}
