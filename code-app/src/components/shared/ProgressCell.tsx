import type { Certification } from "../../domain/types";
import { getBaseTarget, getSourceObtenu } from "../../domain/objectives";

/**
 * Colonne "Certifiés" : obtenu / objectif global (quota source). Ne doit
 * JAMAIS dependre de l'objectif fixe (bug corrige dans le prototype HTML —
 * cf. docs/migration-analysis.md).
 */
export function ProgressCell({ cert }: { cert: Certification }) {
  const t = getBaseTarget(cert);
  if (t === null) return <span className="na">Non renseigné</span>;
  const o = getSourceObtenu(cert);
  if (o === null) return <span className="na">Non renseigné</span>;

  const pct = t > 0 ? Math.min(100, Math.round((100 * o) / t)) : 0;
  const gap = Math.max(t - o, 0);
  const color = gap <= 0 ? "var(--good)" : pct >= 60 ? "var(--accent)" : pct >= 25 ? "var(--warning)" : "var(--serious)";

  return (
    <div className="progress-cell">
      <div className="progress-text">{o} / {t} certifiés</div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
