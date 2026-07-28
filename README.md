# Prio Certifs — Wavestone

Application de priorisation stratégique des certifications, à destination du COMEX et des responsables de BU.

## Utiliser l'application

Ouvrir **`index.html`** dans n'importe quel navigateur (double-clic). Aucune installation, aucun serveur, aucune connexion réseau requise.

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

### Régénérer `index.html` après une mise à jour du fichier source

```bash
pip install openpyxl
python3 data/build.py
```

Le script relit `data/source_certifications.xlsx` et `data/app_template.html`, refait le matching catalogue ↔ objectifs, et réécrit `index.html` à la racine. Les priorités saisies par les utilisateurs (stockées dans leur `localStorage`) ne sont pas affectées par une régénération.
