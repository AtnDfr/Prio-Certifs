import type { Certification } from "../../domain/types";
import { getSourceEnCours } from "../../domain/objectives";

export function EnCoursCell({ cert }: { cert: Certification }) {
  const v = getSourceEnCours(cert);
  return v === null ? <span className="na">Non renseigné</span> : <>{v}</>;
}
