# Prio Certifs — web part SPFx

Portage de l'app React "Prio Certifs" (branche `migration/power-apps-code-app`,
dossier `code-app/`) en web part SharePoint Framework, conformément au
`Brief_Claude_Code_SPFx.md`. Déployée au niveau du site SharePoint
**WO-AI-TrainingTeam**, lit et écrit deux listes SharePoint dans le contexte
de l'utilisateur connecté uniquement (aucune permission élevée, aucun scope
Graph applicatif, aucun accès tenant — cf. contrainte sécurité du brief).

## Package

| | |
|---|---|
| Nom du package | `prio-certifs.sppkg` |
| Nom de la solution | `prio-certifs-client-side-solution` |
| Version | 1.0.0.0 |
| SharePoint Framework | 1.23.2 (Node.js requis : `>=22.14.0 <23.0.0`, ex. Node 22 LTS) |
| Déploiement | Site collection (App Catalog du site, pas le catalogue tenant) |

## Déploiement (IT)

1. Récupérer `prio-certifs.sppkg` (build ci-dessous si le fichier n'est pas
   déjà fourni séparément — il n'est volontairement pas versionné dans le
   dépôt, comme tout artefact de build SPFx).
2. Sur le site `WO-AI-TrainingTeam` : **Contenu du site** → **Applications**
   (App Catalog du site — le créer si nécessaire via *Paramètres du site* →
   *Application Catalogue de site*).
3. Glisser-déposer `prio-certifs.sppkg` dans la bibliothèque « Apps for
   SharePoint ». Accepter l'ajout à toutes les pages si demandé (l'app
   n'utilise ni script personnalisé ni permission élevée : `requiresCustomScript: false`).
4. Ajouter l'app au site (**Contenu du site** → **Ajouter une application** →
   « PrioCertifs »), puis ajouter le web part **PrioCertifs** sur une page
   (catégorie *Advanced*).

## Build (si reconstruction nécessaire)

```bash
cd spfx
npm install
npx gulp bundle --ship
npx gulp package-solution --ship
# -> spfx/sharepoint/solution/prio-certifs.sppkg
```

## Colonnes SharePoint attendues — À VÉRIFIER avant déploiement

Le brief prévient explicitement que le nom **affiché** d'une colonne peut
différer de son nom **interne** (celui réellement utilisé par l'API REST).
Tous les noms internes ci-dessous, sauf `Title`, sont des **hypothèses**
(identiques au nom affiché donné dans le brief) — à vérifier avant tout
déploiement en modifiant `spfx/src/webparts/prioCertifs/app/data/spConfig.ts`
si besoin (aucune autre logique à toucher).

**Comment vérifier un nom interne** : Paramètres de la liste → cliquer sur la
colonne → l'URL contient `Field=<NomInterne>` ; ou via l'API REST :
`<site>/_api/web/lists/getbytitle('Nom de la liste')/fields?$select=Title,InternalName,TypeAsString`.

### Liste 1 — « Objectifs certifs » (lecture seule) — existe déjà

| Colonne affichée | Nom interne utilisé | Vérifié ? |
|---|---|---|
| Certification (nom de la certification, clé — en fait le "Titre" natif renommé) | `Title` | ✅ confirmé |
| Provider | `Provider` | ⚠️ à vérifier |
| Population | `Population` | ⚠️ à vérifier (non exploitée en Phase 1) |
| Quota | `Quota` | ⚠️ à vérifier |
| Obtenu | `Obtenu` | ⚠️ à vérifier |
| EnCours | `EnCours` | ⚠️ à vérifier |
| Difficulté | `Difficult_x00e9_` | ⚠️ **à vérifier en priorité** (accent → probablement échappé par SharePoint) |

### Liste 2 — « Priorités Certifs » (lecture + écriture) — existe déjà

| Colonne affichée | Nom interne utilisé (hypothèse) | Vérifié ? |
|---|---|---|
| Certification (clé) | `Certification` | ⚠️ **à vérifier** — pourrait être le "Titre" natif renommé (comme en liste 1) plutôt qu'une colonne à part ; si c'est le cas, remplacer par `Title` dans `spConfig.ts` |
| Provider | `Provider` | ⚠️ à vérifier |
| PrioriteProvider | `PrioriteProvider` | ⚠️ à vérifier |
| Override | `Override` | ⚠️ à vérifier |
| PrioriteEffective | `PrioriteEffective` | ⚠️ à vérifier |
| Target | `Target` | ⚠️ à vérifier |

## Limitation connue : objectif fixé (`Target`) — bi-état, pas tri-état

Le prototype HTML/React distingue trois états pour l'objectif fixé d'une
certification (`certTargets`) :
- **absent** → hérite du quota source ;
- **nombre** → objectif explicite (override) ;
- **`null` explicite** → « pas d'objectif », forcé même si un quota source existe.

La colonne SharePoint `Target` telle que définie dans le brief est un simple
nombre nullable : elle ne peut représenter que **deux** états (nombre = override
explicite ; vide = hérite/pas d'objectif — les deux derniers cas ci-dessus sont
indiscernables une fois passés par SharePoint). C'est une limitation du schéma
de données fourni, pas un bug : si distinguer ces deux cas est nécessaire, il
faudra une colonne supplémentaire (ex. `TargetExplicitementVide`, booléen) —
à confirmer avant de l'ajouter.

## Écriture dans « Priorités Certifs »

- Une ligne par certification, upsert par clé `Certification` (créée à la
  première modification touchant cette certification si elle n'existe pas).
- `PrioriteEffective` est recalculé et écrit à chaque sauvegarde (override >
  priorité fournisseur si touchée > suggestion automatique > défaut 5 — même
  cascade que le prototype).
- Sauvegarde différée de 600 ms après la dernière interaction (évite une
  écriture à chaque frappe/drag), et ne réécrit que les lignes dont la valeur
  calculée a réellement changé depuis le dernier chargement/sauvegarde.
- Usage prévu ~1 fois/mois par la BUST (cf. brief) : aucune gestion de
  concurrence entre utilisateurs simultanés.

## Ce qui n'a pas changé

Composants React, logique métier (`domain/`), design/CSS et UX : portés tels
quels depuis `code-app/src/`. Deux anomalies préexistantes déjà connues du
prototype HTML (priorité 10 « suggérée » par défaut quand une certification a
un quota mais n'a jamais été touchée manuellement ; sélecteur CSS invalide) —
non réintroduites, cf. `docs/migration-analysis.md`.
