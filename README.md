# Analys C&J Performances

Application Android d'analyse **cartons jaunes** et **corners** à partir de captures d'écran de match.

## Fonctionnement

1. Vous ajoutez des captures d'écran du match (stats, classement, forme, joueurs, blessés, arbitre…).
2. **Claude** (IA d'analyse) lit les captures et extrait les informations.
3. **Deux IA Big Data** collectent les chiffres en parallèle :
   - Big Data n°1 : **Gemini**, saison en cours (moyennes, tendance, arbitre, enjeu).
   - Big Data n°2 : **OpenAI**, saison passée vs saison en cours, état des joueurs, face-à-face.
4. **Claude** croise les trois sources et propose des pronostics (cartons jaunes / corners) avec une probabilité.

Un pronostic n'est marqué « ≥ 90 % » que si la probabilité estimée atteint réellement 90 %. Sinon l'application l'indique, au lieu d'afficher un faux 90 %. Aucune IA ne peut garantir un résultat sportif.

## Fonctions (version 1.1)

- **Historique 📚** : chaque analyse est enregistrée sur le téléphone. Après le match, marquez chaque pronostic « ✅ Réussi » ou « ❌ Raté » : l'application calcule son vrai taux de réussite, dont celui des pronostics ≥ 90 %, et signale si ses probabilités sont trop optimistes.
- **Clés API chiffrées** (Android Keystore) et bouton **Tester les connexions** dans les réglages.
- **Partager / Copier** le pronostic (WhatsApp, SMS, notes…).

## Obtenir l'APK

### Option A : sans rien installer (GitHub)
1. Créez un dépôt GitHub et envoyez-y tout le contenu de ce dossier.
2. Ouvrez l'onglet **Actions** > **Build APK** > **Run workflow** (il se lance aussi à chaque envoi).
3. Une fois terminé, téléchargez l'artefact **AnalysCJ-Performances-debug-apk** : il contient `app-debug.apk`.

### Option B : Android Studio
1. Ouvrez ce dossier dans Android Studio (version récente, JDK 17).
2. Laissez la synchronisation Gradle se terminer.
3. Menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. L'APK se trouve dans `app/build/outputs/apk/debug/app-debug.apk`.

### Option C : ligne de commande
```
./gradlew assembleDebug
```

## Installer sur le téléphone
Copiez `app-debug.apk` sur le téléphone, ouvrez-le, et autorisez l'installation depuis cette source si Android le demande.

## Première utilisation
Ouvrez **⚙ Réglages** et saisissez :
- la clé API **Claude** (obligatoire) ;
- les clés **Gemini** et **OpenAI** (pour les deux IA Big Data ; sans elles, l'analyse fonctionne mais la fiabilité baisse).

Les noms de modèles sont modifiables. Si un nom est refusé, remplacez-le par un modèle disponible sur votre compte.

## Jeu responsable
Estimations statistiques uniquement, sans garantie. Les paris comportent un risque de perte et sont réservés aux majeurs.
