# Plan phase 1 — extraction de la logique + reproduction des 4 vues (données locales)

Périmètre : étapes 4 à 8 de la note de cadrage. Pas de SharePoint, pas de Power Platform ici — uniquement l'équivalence fonctionnelle avec le prototype HTML, sur des données mockées en local.

## Structure de fichiers proposée (`code-app/src/`)

```
domain/                      logique métier pure, sans React ni DOM — testable en isolation
  types.ts                   Certification, AppData, CertPrioritizationState, ProviderStats, CertStatus
  priority.ts                getProviderPriority, isProviderTouched, getCertOverride,
                              getEffectivePriority, getSuggestedPriority, isPrioritySuggested
  objectives.ts               getSourceObtenu, getSourceEnCours, getBaseTarget,
                              isTargetOverridden, getEffectiveTarget
  derived.ts                  getProjection, getGap, getResteAEngager, getCertStatus, STATUS_META
  providerStats.ts             certsByProvider, providerStats
  format.ts                    fmtNA, fmtSortVal

data/                        couche d'accès aux données (étape 7, anticipée dès maintenant)
  DataRepository.ts           interface { getCertifications(): Promise<AppData> }
  LocalDataRepository.ts      implémentation de référence, lit un JSON mocké
  mockData.json                le contenu actuel de DATA (exporté depuis app_template.html), pour équivalence

state/                       état COMEX (remplace la variable globale `state` du HTML)
  CertPrioritizationContext.tsx   Context React : providerPriorities / certOverrides / certTargets + setters
  persistence.ts               lecture/écriture localStorage (mêmes clés qu'aujourd'hui) — étiqueté
                                explicitement "dev local uniquement", à remplacer étape 9+

components/
  layout/                     AppShell, Header, Tabs, ThemeToggle
  views/                      Dashboard.tsx, Bust.tsx, Providers.tsx, Certifications.tsx
  shared/                     PriorityPicker, ProgressCell, StatusBadge, ProviderBadge,
                              TargetInlineInput, CertDrawer

App.tsx                      bascule de vue, monte AppShell + vue active
```

## Décision de conception clé : fonctions pures, état passé explicitement

Dans le HTML, les fonctions de logique métier (`getEffectivePriority`, etc.) lisent une variable globale `state` par effet de fermeture — pratique en JS vanilla, mais ni testable ni idiomatique en React. En TypeScript, chaque fonction de `domain/` prendra l'état en premier paramètre explicite :

```ts
function getEffectivePriority(state: CertPrioritizationState, cert: Certification): number
```

Ça permet de tester `priority.ts`, `objectives.ts`, `derived.ts` avec de simples appels de fonction (Vitest), sans monter aucun composant React ni DOM — exactement la demande de l'étape 4 ("fonctions indépendantes et testables").

## Tests : Vitest sur `domain/`, pas de portage direct des scripts Playwright

Les scénarios déjà validés sur le HTML (listés dans `docs/migration-analysis.md`) deviennent des tests unitaires sur les fonctions pures :
- héritage provider → certification, override individuel, priorité effective (cascade à 4 niveaux)
- suggestion automatique et ses paliers (20/40/55/75/90%), y compris le cas "aucune décision → suggestion" vs "décision manuelle → jamais de suggestion"
- tri-état de l'objectif fixé (absent / nombre / `null` explicite)
- projection / gap / reste à engager / statut, y compris les cas "Non renseigné"
- agrégats `providerStats` (la séparation quota-source vs objectif-fixé)

Les scripts Playwright existants ne sont pas réutilisables tels quels (sélecteurs DOM différents en React) ; l'équivalence visuelle/interaction sera revérifiée manuellement vue par vue à l'étape 8.

## Ordre d'implémentation à l'intérieur de cette phase

1. `domain/types.ts` + `domain/priority.ts` + `domain/objectives.ts` + `domain/derived.ts` + `domain/providerStats.ts`, avec tests Vitest en regard de chaque fichier.
2. `data/DataRepository.ts` + `data/LocalDataRepository.ts` + `mockData.json` (export du DATA actuel).
3. `state/CertPrioritizationContext.tsx` + `state/persistence.ts`.
4. Composants partagés (`PriorityPicker`, `ProgressCell`, `StatusBadge`, `TargetInlineInput`, `ProviderBadge`).
5. Les 4 vues, une par une, dans l'ordre Dashboard → BUST → Providers → Certifications (du plus agrégé au plus détaillé), avec vérification visuelle contre le HTML à chaque vue plutôt qu'à la toute fin.
6. `CertDrawer` (fiche détaillée), thème clair/sombre, export JSON.

## Ce qui reste volontairement hors phase 1

- Connexion SharePoint / Easy Training réelle (étape 9).
- CLI `pac` / SDK Power Apps / publication Power Platform (étape 10) — cf. décision prise avec Antoine : hors de portée de cette session tant qu'un environnement authentifié n'est pas confirmé.
- "Copie figée à partager" (mode `FROZEN` du HTML) — sera remplacée par le partage natif Power Platform ; pas reproduite en phase 1, à retrancher explicitement si son absence pose problème avant l'étape 9.
