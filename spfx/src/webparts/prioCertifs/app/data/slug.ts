/**
 * Genere un id stable a partir du nom (long) d'une certification. Normalise
 * accents, casse et espaces pour que des variantes de saisie (ex.
 * "Databricks" / "DataBricks", espaces multiples) produisent le meme id —
 * cf. brief SPFx, section "Contraintes / points d'attention".
 */
export function slugifyCertName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // supprime les accents (decomposes par normalize NFD)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
