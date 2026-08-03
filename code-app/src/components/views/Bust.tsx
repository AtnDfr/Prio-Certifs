import { useMemo, useState } from "react";
import type { AppData } from "../../domain/types";
import { providerStats } from "../../domain/providerStats";
import { useCertPrioritization } from "../../state/CertPrioritizationContext";
import { ProviderBadge } from "../shared/ProviderBadge";
import { PriorityPicker } from "../shared/PriorityPicker";

type SortKey = "provider" | "certCount" | "obtenu" | "enCours" | "priority";
const NUM_KEYS: SortKey[] = ["certCount", "obtenu", "enCours"];
const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "provider", label: "Fournisseur" },
  { key: "certCount", label: "Nb certifications" },
  { key: "obtenu", label: "Nb certifiés" },
  { key: "enCours", label: "En cours" },
  { key: "priority", label: "Priorité" },
];

export function Bust({ data, onSelectProvider }: { data: AppData; onSelectProvider: (provider: string) => void }) {
  const { state, setProviderPriority } = useCertPrioritization();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "priority", dir: -1 });

  const rows = useMemo(() => {
    const list = data.providers.map((p) => ({ provider: p, stats: providerStats(state, data, p) }));
    list.sort((a, b) => {
      if (sort.key === "provider") return sort.dir * a.provider.localeCompare(b.provider);
      const av = sort.key === "priority" ? a.stats.priority : a.stats[sort.key as "certCount" | "obtenu" | "enCours"];
      const bv = sort.key === "priority" ? b.stats.priority : b.stats[sort.key as "certCount" | "obtenu" | "enCours"];
      return sort.dir * (av - bv);
    });
    return list;
  }, [data, state, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: -1 }));
  }

  return (
    <div className="card card-pad">
      <h2 className="section-title">Priorisation par fournisseur</h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: -4 }}>
        Définissez la priorité de chaque fournisseur (0 = non prioritaire, 10 = priorité maximale). Elle s'applique
        automatiquement à toutes ses certifications, sauf exception définie en vue Certification.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {COLUMNS.map(({ key, label }) => (
                <th key={key} data-key={key} className={NUM_KEYS.includes(key) ? "num" : undefined} onClick={() => toggleSort(key)}>
                  {label}{sort.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ provider, stats: s }) => {
              const hasObtenu = s.obtenuKnownCount > 0;
              const partial = hasObtenu && s.obtenuKnownCount < s.certCount;
              return (
                <tr key={provider}>
                  <td>
                    <button className="link-cell" onClick={() => onSelectProvider(provider)}>
                      <span className="cell-provider">
                        <ProviderBadge provider={provider} size={20} />
                        {provider}
                      </span>
                    </button>
                  </td>
                  <td className="num">{s.certCount}</td>
                  <td className="num">
                    {hasObtenu ? (
                      <>
                        {s.obtenu}
                        {partial && (
                          <span className="muted" style={{ fontSize: 11 }}> ({s.obtenuKnownCount}/{s.certCount} renseignées)</span>
                        )}
                      </>
                    ) : (
                      <span className="na">Non renseigné</span>
                    )}
                  </td>
                  <td className="num">{s.enCoursKnownCount ? s.enCours : <span className="na">Non renseigné</span>}</td>
                  <td>
                    <PriorityPicker value={s.priority} onChange={(v) => setProviderPriority(provider, v)} />
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
