# Prio Certifs — Wavestone

Application de priorisation stratégique des certifications, à destination du COMEX et des responsables de BU.

## Utiliser l'application

Ouvrir **`Priorisation Certifs.html`** dans n'importe quel navigateur (double-clic). Aucune installation, aucun serveur, aucune connexion réseau requise.

Une version identique et éditable est aussi accessible en ligne via GitHub Pages : https://atndfr.github.io/Prio-Certifs/ (pratique pour laisser des collègues tester sans transfert de fichier — chaque visiteur édite dans son propre navigateur, sans synchronisation entre eux ni avec le fichier local).

- **Dashboard** : vue d'ensemble en quelques secondes (KPIs, répartition des priorités 0-10, statuts d'objectifs, top priorités, top gaps, exceptions, données manquantes).
- **BUST** : priorisation au niveau fournisseur (Provider). C'est le niveau de décision principal.
- **Providers** : détail des certifications d'un fournisseur, avec héritage automatique de la priorité et possibilité de surcharge individuelle.
- **Certifications** : recherche/filtre sur l'ensemble du catalogue, ajustement fin certification par certification.

### Modèle de priorisation

- Échelle **0 à 10**, valeur par défaut **5** tant qu'aucune décision n'a été prise.
- Une priorité définie sur un **fournisseur** s'applique par héritage à toutes ses certifications.
- Une priorité définie individuellement sur une **certification** prime sur celle du fournisseur (exception).
- Tout est enregistré automatiquement dans le `localStorage` du navigateur — rien n'est envoyé sur un serveur.

**Suggestion automatique** : tant qu'aucune décision manuelle n'a été prise (ni sur la certification, ni sur son fournisseur), la priorité par défaut n'est plus figée à 5 pour les certifications qui ont un objectif global (quota source) et un objectif fixé — elle est calculée selon l'ambition de la cible fixée par rapport à la capacité totale (`objectif fixé / objectif global`), pour pousser en priorité les certifications où le COMEX vise une part importante du disponible :

| Objectif fixé / Objectif global | Priorité suggérée |
|---|---|
| Objectif global ou objectif fixé inconnu, ou ratio < 20 % | 5 (défaut inchangé) |
| 20 % à 39 % | 6 |
| 40 % à 55 % | 7 |
| > 55 % à 75 % | 8 |
| > 75 % à 90 % | 9 |
| > 90 % | 10 |

Un badge **« suggérée »** signale ces valeurs calculées dans les tableaux et la fiche détaillée. Dès qu'une priorité est fixée manuellement (sur la certification ou sur tout le fournisseur), la suggestion automatique ne s'applique plus jamais pour cette certification — la décision humaine est toujours prioritaire.

### Objectifs quantitatifs (optionnels)

Trois données bien distinctes, à ne pas confondre :
- **Objectif global** (lecture seule, donnée source) : la colonne « Certifiés » (ex. « 1 / 40 certifiés ») compare le nombre de certifiés actuels au nombre total de certifications disponibles pour cette certification (quotas 2026-2027 du fichier source). C'est une donnée fixe, jamais modifiable depuis l'interface.
- **Nombre de personnes en cours de certification** (lecture seule, donnée source) : prêt dans le modèle mais sans source de données aujourd'hui ; affiche « Non renseigné » partout tant qu'un fichier ou un flux ne l'alimente pas. Aucune valeur n'est inventée.
- **Objectif fixé** (décision COMEX, éditable et supprimable) : un paramètre totalement indépendant de l'objectif global ci-dessus — typiquement « combien de personnes on veut voir passer cette certification ce mois-ci ». Éditable en ligne dans les vues **Certifications** et **Providers** (colonne « Objectif fixé », certification par certification dans les deux cas), ou depuis la fiche détaillée. Modifier l'objectif fixé ne change jamais l'objectif global affiché dans la colonne « Certifiés ». Il sert au calcul du reste à engager, du statut, et alimente la suggestion automatique de priorité (voir ci-dessus). La majorité des certifications restent volontairement sans objectif fixé.

En interne, l'app calcule aussi une projection (certifiés + en cours) pour dériver le **reste à engager** (objectif − projection) et un **statut** — *Objectif atteint*, *En bonne voie*, *À accélérer*, ou *Non renseigné* tant que la projection ne peut pas être calculée. La projection elle-même n'est pas affichée dans l'interface (calcul trivial, laissé aux utilisateurs si besoin) mais reste disponible dans l'export JSON (`projectedCount`). Comme le nombre de personnes en cours de certification n'est pas encore disponible, le reste à engager et le statut afficheront « Non renseigné » pour la quasi-totalité des certifications jusqu'à ce qu'une vraie source soit branchée — c'est un comportement voulu, pas un bug.

### Partager une copie de consultation

Le bouton **« Télécharger une copie à partager »** génère un second fichier HTML autonome, avec les priorités actuelles figées à l'intérieur. La personne qui l'ouvre est en **lecture seule** (les contrôles de priorité sont désactivés) ; si elle modifie quand même localement, cela reste sur son poste et n'affecte jamais le fichier original.

## Données

Le catalogue (88 certifications, colonnes réellement présentes : Certification, Fournisseur, Description, Difficulté) et les objectifs 2026-2027 (Quota / Obtenu / Restant, 29 certifications couvertes sur 88) proviennent de `data/source_certifications.xlsx`. Les certifications sans objectif affichent **« Non renseigné »** — aucune donnée n'est inventée.

Le rapprochement entre les deux tableaux (les noms diffèrent d'un onglet à l'autre) a été fait par un matching automatique (fournisseur + similarité de nom), avec 3 décisions actées avec Antoine (Wavestone) — voir `data/build.py` pour le détail et la justification de chacune.

### Exporter les priorités pour un agent / traitement automatisé

Le bouton **« Exporter les priorités (JSON) »** télécharge un fichier `prio-certifs-wavestone-export-AAAA-MM-JJ.json` : priorité de chaque fournisseur, et pour chaque certification son nom, fournisseur, difficulté, description, `certifiedCount`/`inProgressCount`/`projectedCount` (sources et calculé), `targetCount` (objectif effectif) et `targetOverridden`, `remainingToLaunch`, `status`, ainsi que la priorité effective (héritée ou surchargée) et l'indicateur `priorityOverridden`. C'est un export manuel, déclenché à la demande — pour qu'un agent externe (ex. surveillant un dossier SharePoint) détecte une mise à jour, il suffit de déposer ce fichier dans le dossier suivi et de comparer son champ `exportedAt` à la dernière valeur connue.

### Logos fournisseurs

Les logos sont des fichiers stockés dans `public/logos/`, mappés aux 17 fournisseurs du catalogue via `data/provider-logos.json`. 8 proviennent du jeu d'icônes open source [Simple Icons](https://simpleicons.org) (récupéré via le registre npm, aucune dépendance à un CDN externe) : Anthropic, Databricks, Dataiku, Google Cloud Platform, Hugging Face, Linux Foundation, Palantir, Snowflake. 8 autres sont les logos officiels fournis directement par Antoine : AWS, Azure, Collibra, IBM, IEC, Microsoft, Salesforce, Scaled Agile. Seul **Autre** (regroupement générique, pas une marque) n'a pas de logo et affiche le badge par défaut `public/logos/default.svg` sur fond coloré — l'absence d'un logo ne casse jamais l'affichage.

Pour compléter un logo manquant : déposer le SVG dans `public/logos/`, renseigner son nom de fichier dans `data/provider-logos.json`, puis relancer `python3 data/build.py`.

### Régénérer `Priorisation Certifs.html` après une mise à jour du fichier source ou des logos

```bash
pip install openpyxl
python3 data/build.py
```

Le script relit `data/source_certifications.xlsx`, `data/app_template.html` et `public/logos/`, refait le matching catalogue ↔ objectifs, et réécrit `Priorisation Certifs.html` à la racine (tout est ré-embarqué en base64 dans ce fichier unique, aucune dépendance externe au runtime). Les priorités saisies par les utilisateurs (stockées dans leur `localStorage`) ne sont pas affectées par une régénération.
