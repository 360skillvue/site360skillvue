# CRM 360skillvue : installation sur l'hébergement OVH

Le CRM fonctionne sur l'hébergement web Perso « 360skillvue » (PHP 8.3 et MySQL), sans rien acheter de plus.
Comptez environ 30 minutes.

## 1. Préparer la base de données

1. Espace client OVH : **Web Cloud > Hébergements > 360skillvue > Bases de données**.
2. Si une base est libre (par exemple celle de l'option Extra SQL Perso), utilisez-la ; sinon cliquez sur **Créer une base de données** (MySQL).
3. Notez quatre informations : le **serveur** (du type `xxxxx.mysql.db`), le **nom de la base**, l'**utilisateur** et son **mot de passe**.

Ne réutilisez pas la base du site WordPress.

## 2. Créer le sous-domaine

1. **Web Cloud > Hébergements > 360skillvue > Multisite > Ajouter un domaine ou un sous-domaine**.
2. Choisissez le domaine 360skillvue.com et saisissez le sous-domaine `crm`.
3. Dossier racine : `crm`.
4. Cochez **SSL** (certificat HTTPS gratuit). Laissez le CDN désactivé.
5. Si le domaine n'est pas géré chez OVH, ajoutez l'enregistrement DNS indiqué par OVH chez votre registraire.

Le certificat HTTPS peut mettre jusqu'à quelques heures à s'activer.

## 3. Envoyer les fichiers

1. Identifiants FTP : **Hébergements > 360skillvue > FTP-SSH**.
2. Avec un logiciel FTP (par exemple FileZilla), ouvrez le dossier `crm` à la racine de l'hébergement (créez-le s'il n'existe pas).
3. Envoyez-y **tout le contenu** du dossier `crm-ovh` : `index.php`, `api.php`, `install.php`, `cron.php`, `.htaccess`, et les dossiers `assets` et `lib`.

Les fichiers commençant par un point (`.htaccess`) sont parfois masqués : affichez les fichiers cachés dans votre logiciel FTP pour bien les envoyer. Ils protègent les fichiers sensibles.

## 4. Lancer l'installation

1. Ouvrez `https://crm.360skillvue.com/install.php`.
2. Saisissez les informations de la base (étape 1), puis le nom, l'e-mail et le mot de passe du premier administrateur (10 caractères minimum).
3. Facultatif : collez votre **jeton d'API Pipedrive** (Pipedrive : photo de profil > Paramètres personnels > API). Utilisez de préférence l'adresse e-mail de votre compte Pipedrive pour l'administrateur : le CRM reliera alors votre compte à vos affaires.
4. Cliquez sur **Installer**, puis **supprimez le fichier `install.php`** du serveur par FTP.

L'installation crée le fichier `config.php`. Ne le partagez pas : il contient les accès à la base et le jeton Pipedrive.

## 5. Importer Pipedrive et ouvrir l'accès à l'équipe

1. Connectez-vous sur `https://crm.360skillvue.com`.
2. **Réglages > Tout importer** : l'import récupère équipe, pipelines, organisations, personnes, affaires et activités. Laissez l'onglet ouvert jusqu'au message « Import terminé ».
3. **Réglages > Équipe et accès** : pour chaque personne, saisissez son e-mail, cochez **Accès**, choisissez un mot de passe, puis **Enregistrer**. Cochez **Admin** pour les personnes qui doivent gérer l'import, les pipelines et les accès.

Pendant la période où Pipedrive est encore utilisé, le bouton « Importer les changements depuis le dernier import » met le CRM à jour. Les notes et les fiches créées dans le CRM ne sont jamais écrasées.

## 6. Facultatif : mise à jour automatique depuis Pipedrive

**Hébergements > 360skillvue > Tâches planifiées (Cron) > Ajouter une planification** :
commande `crm/cron.php`, langage **PHP 8.3**, fréquence **quotidienne** (la nuit).
À supprimer quand Pipedrive est résilié.

## Sauvegardes et mises à jour

1. OVH sauvegarde automatiquement les bases de données de l'hébergement. Vous pouvez aussi télécharger des exports CSV dans **Réglages > Sauvegarde**.
2. Pour installer une nouvelle version : renvoyez les fichiers par FTP **sauf `config.php`**, qui doit rester en place.
3. Mot de passe oublié : un administrateur en définit un nouveau dans **Réglages > Équipe et accès**.
