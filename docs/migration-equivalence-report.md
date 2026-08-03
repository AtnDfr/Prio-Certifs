# Rapport d'équivalence fonctionnelle — phase 1 (données locales)

Critère de succès de la note de cadrage : *"La version React / TypeScript doit reproduire fidèlement le comportement du prototype HTML avec des données locales."* Ce document trace comment ça a été vérifié, avant toute connexion SharePoint/Power Platform.

## Vérifications automatisées

- **39 tests Vitest** sur `code-app/src/domain/*.test.ts` : cascade de priorité (override > provider touché > suggestion > défaut), les 6 paliers de la suggestion automatique, le modèle tri-état de l'objectif fixé (absent/nombre/`null` explicite), les indicateurs dérivés (projection, gap, reste à engager, statut), et la séparation quota-source / objectif-fixé dans `providerStats`.
- **`npm run build`** (tsc + vite) : compile sans erreur, y compris le CSS en mode production.
- **Playwright contre le serveur de dev React** (`npm run dev`), scénarios rejoués un par un depuis le prototype HTML : priorité fournisseur → héritage sur les certifications, exception individuelle + badge, édition en ligne de l'objectif fixé (Providers et Certifications), non-régression de la colonne "Certifiés" (reste basée sur le quota source, jamais sur l'objectif fixé), tri-état de l'objectif fixé (mise à `null` explicite en vidant le champ), recherche/filtre, ouverture/fermeture de la fiche détaillée, bascule de thème, export JSON. **Zéro erreur console, zéro erreur de page.**

## Vérification visuelle

Captures d'écran (mode clair et sombre, vues Dashboard/Providers/Certifications) comparées au prototype HTML — même mise en page, mêmes couleurs, mêmes logos fournisseurs (fichiers réels de `public/logos/`, pas des placeholders), même comportement des tableaux (tri, filtres, badges).

## Deux anomalies préexistantes découvertes pendant le portage (pas introduites par la migration)

Le fait de réécrire chaque fonction sous forme de test unitaire isolé a fait remonter deux problèmes qui existent déjà sur le prototype HTML en production (vérifiés directement sur `index.html`, indépendamment de la migration) :

1. **Suggestion de priorité par défaut à 10** : dès qu'une certification a un quota source connu et qu'aucune décision manuelle n'a jamais été prise, l'objectif fixé hérite exactement du quota (comportement voulu du tri-état), ce qui donne un ratio de 100 % et donc une priorité suggérée de 10 — sans aucune interaction. Confirmé en direct sur `index.html` (localStorage vidé) : les 29 certifications avec un quota affichent toutes priorité 10 "suggérée" par défaut. Probablement une surprise plus qu'un choix voulu.
2. **Sélecteur CSS invalide** dans `app_template.html` (`:root[data-theme="dark"] .mode-banner.frozen, @media (...) {...}`, une liste de sélecteurs mélangée à une at-rule) : les navigateurs l'ignorent silencieusement, mais l'outillage de build strict de Vite (lightningcss) le rejette. Corrigé dans le port (`code-app/src/legacy.css`) ; n'affecte qu'un bandeau du mode "copie figée", pas encore porté en phase 1.

Les deux ont été **reproduits fidèlement** dans le port (comportement identique, pas une correction silencieuse) pour respecter le critère d'équivalence — sauf le sélecteur CSS invalide qui ne pouvait pas l'être puisqu'il empêchait le build. Ce sont des décisions produit à trancher séparément, pas des artefacts de la migration.

## Ce qui n'est délibérément pas dans cette phase

Conformément à la note de cadrage : la connexion SharePoint/Easy Training (étape 9), la publication Power Platform (étape 10), et la fonctionnalité "copie figée à partager" (mode lecture seule du prototype HTML), qui doit être remplacée par le partage natif de l'application Power Platform plutôt que portée telle quelle.

## Conclusion

Équivalence fonctionnelle validée sur données locales. Prêt pour une revue avant de passer à l'étape 9 (connexion SharePoint), qui reste hors de portée de cette session tant qu'un environnement Power Platform authentifié n'est pas confirmé (cf. échange précédent).
