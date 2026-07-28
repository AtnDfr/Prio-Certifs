# Prio Certifs — Wavestone

Application de priorisation stratégique des certifications, à destination du COMEX et des responsables de BU.

## Utiliser l'application

Ouvrir **`Priorisation Certifs.html`** dans n'importe quel navigateur (double-clic). Aucune installation, aucun serveur, aucune connexion réseau requise.

- **Dashboard** : vue d'ensemble en quelques secondes (KPIs, répartition des priorités 0-10, top priorités, top gaps, exceptions).
- **Vue COMEX** : priorisation au niveau fournisseur (Provider). C'est le niveau de décision principal.
- **Vue Provider** : détail des certifications d'un fournisseur, avec héritage automatique de la priorité et possibilité de surcharge individuelle.
- **Vue Certification** : recherche/filtre sur l'ensemble du catalogue, ajustement fin certification par certification.

### Modèle de priorisation

- Échelle **0 à 10**, valeur par défaut **5** tant qu'aucune décision n'a été prise.
- Une priorité définie sur un **fournisseur** s'applique par héritage à toutes ses certifications.
- Une priorité définie individuellement sur une **certification** prime sur celle du fournisseur (exception).
- Tout est enregistré automatiquement dans le `localStorage` du navigateur — rien n'est envoyé sur un serveur.

### Partager une copie de consultation

Le bouton **« Télécharger une copie à partager »** génère un second fichier HTML autonome, avec les priorités actuelles figées à l'intérieur. La personne qui l'ouvre est en **lecture seule** (les contrôles de priorité sont désactivés) ; si elle modifie quand même localement, cela reste sur son poste et n'affecte jamais le fichier original.

## Données

Le catalogue (88 certifications, colonnes réellement présentes : Certification, Fournisseur, Description, Difficulté) et les objectifs 2026-2027 (Quota / Obtenu / Restant, 29 certifications couvertes sur 88) proviennent de `data/source_certifications.xlsx`. Les certifications sans objectif affichent **« Non renseigné »** — aucune donnée n'est inventée.

Le rapprochement entre les deux tableaux (les noms diffèrent d'un onglet à l'autre) a été fait par un matching automatique (fournisseur + similarité de nom), avec 3 décisions actées avec Antoine (Wavestone) — voir `data/build.py` pour le détail et la justification de chacune.

### Logos fournisseurs

Les logos sont des fichiers SVG stockés dans `public/logos/`, mappés aux 17 fournisseurs du catalogue via `data/provider-logos.json`. Ils proviennent du jeu d'icônes open source [Simple Icons](https://simpleicons.org) (récupéré via le registre npm, aucune dépendance à un CDN externe). 8 fournisseurs ont un vrai logo (Anthropic, Databricks, Dataiku, Google Cloud Platform, Hugging Face, Linux Foundation, Palantir, Snowflake) ; les 9 autres (AWS, Azure, Collibra, IBM, IEC, Microsoft, Salesforce, Scaled Agile, Autre) n'ont pas d'icône disponible dans ce jeu (marques retirées pour raisons légales, ou non référencées) et affichent automatiquement le badge générique `public/logos/default.svg` sur fond coloré — l'absence d'un logo ne casse jamais l'affichage.

Pour compléter un logo manquant : déposer le SVG dans `public/logos/`, renseigner son nom de fichier dans `data/provider-logos.json`, puis relancer `python3 data/build.py`.

### Régénérer `Priorisation Certifs.html` après une mise à jour du fichier source ou des logos

```bash
pip install openpyxl
python3 data/build.py
```

Le script relit `data/source_certifications.xlsx`, `data/app_template.html` et `public/logos/`, refait le matching catalogue ↔ objectifs, et réécrit `Priorisation Certifs.html` à la racine (tout est ré-embarqué en base64 dans ce fichier unique, aucune dépendance externe au runtime). Les priorités saisies par les utilisateurs (stockées dans leur `localStorage`) ne sont pas affectées par une régénération.
