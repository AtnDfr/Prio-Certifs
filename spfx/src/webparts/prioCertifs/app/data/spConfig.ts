/**
 * Configuration des deux listes SharePoint (site WO-AI-TrainingTeam), cf.
 * Brief_Claude_Code_SPFx.md. Regroupe ICI tout ce qui doit etre verifie /
 * ajuste cote SharePoint reel avant deploiement, pour ne jamais avoir a
 * toucher la logique des repositories si un nom interne differe.
 *
 * IMPORTANT (brief : "ne rien inventer") : seul `Title` est garanti par la
 * plateforme (colonne "Titre" native de toute liste SharePoint -> internal
 * name toujours "Title", quel que soit le libellé affiche). Tous les autres
 * noms internes ci-dessous sont des HYPOTHESES (identiques au nom affiche
 * donne dans le brief) a verifier avant deploiement — cf. README section
 * "Colonnes SharePoint attendues" pour la methode de verification.
 */

export const OBJECTIVES_LIST_TITLE = "Objectifs certifs";
export const PRIORITIES_LIST_TITLE = "Priorités Certifs";

/** Liste 1 — "Objectifs certifs" (lecture seule, remplie par Power Automate). */
export const OBJECTIVES_FIELDS = {
  title: "Title", // colonne native "Titre" -> internal name toujours "Title"
  provider: "Provider",
  population: "Population",
  quota: "Quota",
  obtenu: "Obtenu",
  enCours: "EnCours",
  // Accent -> tres probablement echappe par SharePoint (ex. "Difficult_x00e9_").
  // A VERIFIER en priorite.
  difficulte: "Difficult_x00e9_",
};

/** Liste 2 — "Priorités Certifs" (lecture + ecriture, contexte utilisateur). */
export const PRIORITIES_FIELDS = {
  certification: "Certification",
  provider: "Provider",
  prioriteProvider: "PrioriteProvider",
  override: "Override",
  prioriteEffective: "PrioriteEffective",
  target: "Target",
};
