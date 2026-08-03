# Analyse du prototype HTML — référence pour la migration Power Apps Code App

Ce document répond à l'étape 1 de la note de cadrage (`Notes_cadrage_migration_Power_Apps_Code_App_2.pdf`) : documenter le point d'entrée, les vues, la logique métier, les données embarquées et les dépendances du prototype HTML, avant de porter quoi que ce soit vers React/TypeScript.

## Point d'entrée

Un unique fichier HTML auto-portant (`data/app_template.html`), sans dépendance runtime externe (pas de CDN, pas de framework). `data/build.py` l'assemble avec les données (lues depuis `data/source_certifications.xlsx`) et les logos (`public/logos/`, en base64) pour produire deux fichiers identiques : `Priorisation Certifs.html` (usage local) et `index.html` (GitHub Pages).

Il n'y a pas de backend, pas de build JS, pas de bundler : `app_template.html` est du JavaScript vanilla exécuté directement dans le navigateur, dans une IIFE (`(function(){ ... })()`).

## Les 4 vues (`renderCurrentView`)

| Vue | Fonction | Rôle |
|---|---|---|
| Dashboard | `renderDashboard()` | KPIs agrégés, répartition des priorités, statuts d'objectifs, top priorités, top gaps, exceptions, certifications avec objectif mais données manquantes |
| BUST (ex "vue COMEX") | `renderComex()` | Priorisation au niveau fournisseur — décision principale |
| Providers | `renderProvider()` | Certifications d'un fournisseur sélectionné, avec héritage de priorité et objectif fixé éditable |
| Certifications | `renderCertification()` | Catalogue complet, recherche/filtre, ajustement fin certification par certification |

Navigation : `switchView(name)` bascule un `data-view` actif, `renderAll()` re-render la vue courante après toute mutation d'état. Une fiche détaillée (`openCertDrawer(certId)` / tiroir latéral) est accessible depuis Providers et Certifications.

## Logique métier à porter fidèlement

### 1. Modèle de priorité (0 à 10)

- `DEFAULT_PRIORITY = 5` tant qu'aucune décision n'existe.
- **Héritage** : `getProviderPriority(provider)` → priorité définie sur le fournisseur, ou 5 par défaut. `isProviderTouched(provider)` distingue "jamais touché" de "explicitement remis à une valeur".
- **Override individuel** : `getCertOverride(certId)` → valeur explicite sur une certification, ou `null` si non défini.
- **Suggestion automatique** (`getSuggestedPriority`, `isPrioritySuggested`) : ne s'applique QUE si ni le provider ni la certification n'ont de décision manuelle. Ratio = `objectif fixé ÷ objectif global (quota source)`. Paliers : `<20% → 5 (pas de suggestion)`, `20-39% → 6`, `40-55% → 7`, `>55-75% → 8`, `>75-90% → 9`, `>90% → 10`.
- **Résolution** (`getEffectivePriority`) : override cert > priorité provider (si touché) > suggestion automatique > défaut 5. C'est une cascade à 4 niveaux, l'ordre est important et doit être reproduit exactement.

### 2. Objectifs — données sources vs décisions COMEX

Distinction stricte entre deux natures de données (déjà vécue comme un point de confusion utilisateur pendant le développement HTML — à bien garder visible dans l'UI React) :

- **Sources, lecture seule** (viennent du fichier Excel, jamais éditées dans l'app) :
  - `objective.obtenu` — nombre de certifiés actuels (`getSourceObtenu`)
  - `objective.enCours` — nombre de personnes en cours de certification (`getSourceEnCours`) — **toujours `null` aujourd'hui, aucune source de données ne l'alimente**, affiche "Non renseigné" partout.
  - `objective.quota` — objectif global / nombre total de certifications disponibles (`getBaseTarget`) — sert de dénominateur fixe pour la colonne "Certifiés" (X/Y), **jamais affecté par l'objectif fixé**.
- **Décision COMEX, éditable** : l'**objectif fixé** (`state.certTargets[certId]`), modèle tri-état :
  - absent → hérite de `objective.quota` (valeur de départ)
  - nombre → override explicite
  - `null` → "pas d'objectif" explicitement forcé, même si une valeur source existe (`isTargetOverridden` distingue absence et `null` via `hasOwnProperty`)

### 3. Indicateurs dérivés

- `getProjection(cert)` = obtenu + enCours (si les deux connus, sinon `null` — donc quasi toujours `null` aujourd'hui puisque enCours ne l'est jamais).
- `getGap(cert)` = max(objectif fixé − obtenu, 0).
- `getResteAEngager(cert)` = max(objectif fixé − projection, 0) — affiche "Atteint" si ≤ 0.
- `getCertStatus(cert)` → 4 états : `atteint` / `bonneVoie` / `accelerer` / `na` (na si objectif ou projection inconnus — cas dominant actuellement). `accelerer` déclenché si priorité effective ≥ 7.

### 4. Agrégats par fournisseur (`providerStats`)

Sépare bien deux familles d'agrégats (bug corrigé pendant le développement HTML, à ne pas réintroduire) :
- Agrégat "objectif global" (quota source) : `quota`, `obtenu`, `obtenuKnownCount` → alimente la colonne "Certifiés" du header Provider et la table BUST.
- Agrégat "objectif fixé" (décision COMEX) : `targetDefinedCount`, `gap` → alimente le dashboard, pas la table BUST (colonnes retirées de BUST à la demande utilisateur).

## Forme des données embarquées

```ts
type Certification = {
  id: string;            // slug stable, ex "aws-ai-practitioner-foundational"
  name: string;
  provider: string;
  description: string | null;
  difficulty: string | null;
  objective: {
    quota: number | null;    // objectif global (source Excel)
    obtenu: number | null;   // certifiés actuels (source Excel)
    enCours: null;           // toujours null aujourd'hui, pas de source
  };
};

type AppData = {
  certifications: Certification[];
  providers: string[];      // noms uniques, triés
};

type PersistedState = {
  providerPriorities: Record<string, number>;   // provider -> 0..10
  certOverrides: Record<string, number>;        // certId -> 0..10
  certTargets: Record<string, number | null>;   // certId -> objectif fixé, ou null = supprimé explicitement
};
```

`AppData` est aujourd'hui injecté au build (`/*__APP_DATA__*/` remplacé par du JSON dans le template). `PersistedState` vit dans `localStorage` (clé `prioCertifsWavestone_v1`) — **à traiter comme un stockage de développement local, pas la source de vérité finale**, conformément à la contrainte de la note de cadrage.

Deux autres éléments d'état à ne pas oublier : le thème clair/sombre (`localStorage`, clé séparée `prioCertifsWavestone_theme`) et le mode "copie figée" (`FROZEN`/`FROZEN_STATE`) utilisé par le bouton "Télécharger une copie à partager", qui bascule l'app en lecture seule avec un état gelé injecté — fonctionnalité à requestionner dans le monde Power Platform (la note prévoit de la remplacer par le partage natif de l'app).

## Dépendances

- **Runtime** : aucune. Tout est vanilla JS, CSS inline, logos en base64 (`data:` URIs).
- **Build** : Python 3 + `openpyxl`, pour lire `source_certifications.xlsx` (2 onglets, matching automatique fournisseur/nom avec 3 décisions actées manuellement — voir les commentaires de `data/build.py`) et injecter le JSON dans le template.
- **Aucune dépendance réseau** au runtime : pas d'appel API, pas de connecteur, tout est statique après génération.

## Suite de tests existante (à réutiliser comme scénarios d'acceptation, pas comme code)

Une suite Playwright (hors dépôt, dans le scratchpad de la session précédente) couvre déjà : héritage de priorité provider → certification, override individuel avec badge, suggestion automatique et ses paliers, tri-état de l'objectif fixé (absent/nombre/null), export JSON, copie figée en lecture seule, bascule de thème. Ces scénarios (pas les sélecteurs Playwright, qui seront obsolètes en React) définissent ce que "équivalence fonctionnelle" doit vérifier à l'étape 8.
