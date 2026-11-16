# CRM 360skillvue : mode d'emploi

Le CRM interne de 360skillvue remplace Pipedrive. Il est en ligne à l'adresse `https://crm.360skillvue.com`.
Il fonctionne sur l'hébergement web OVH Perso « 360skillvue » (PHP 8.3 et MySQL), dans le dossier `crm`.
Le code est dans ce dépôt, dossier `crm-ovh`. Le numéro de version est dans `lib/bootstrap.php`.

## 1. Ce que fait le CRM

| Rubrique | Contenu |
|---|---|
| Affaires | Les pipelines et leurs étapes, avec un bloc « Où en est-on ? » sur chaque affaire |
| Activités | Tâches, appels, rendez-vous et notes ; une pastille signale les activités à vérifier quand des e-mails ont été échangés depuis |
| Contacts | Personnes et organisations. Par défaut seuls les contacts utiles sont affichés |
| E-mails | Lecture des échanges des boîtes Microsoft connectées, envoi depuis le CRM avec signature, pièces jointes et suivi d'ouverture |
| Réglages | Équipe et accès, connexions, sauvegardes |

Un contact est « utile » s'il est lié à une affaire, une activité (une note compte), un e-mail ou un tag.

## 2. Se connecter

1. Ouvrir `https://crm.360skillvue.com` et saisir son e-mail et son mot de passe.
2. La connexion est gardée 30 jours sur chaque appareil. Le bouton **Déconnexion** la ferme.
3. Mot de passe oublié : un administrateur en définit un nouveau dans **Réglages > Équipe et accès**.
4. Changer son mot de passe ferme les connexions gardées sur les autres appareils.

## 3. Ce qui est relié au CRM

| Outil | Ce qui se passe | Fréquence |
|---|---|---|
| Microsoft 365 | Les e-mails échangés avec les contacts apparaissent sur les fiches ; l'envoi se fait depuis le CRM. Chaque personne connecte sa propre boîte dans les Réglages | Toutes les heures |
| Calendly | Les rendez-vous commerciaux deviennent des activités ; une annulation est reportée | Toutes les heures |
| Mailchimp, audience 360skillvue | Les contacts utiles et les contacts des établissements de santé y sont envoyés. Les établissements de santé portent le tag « Certification périodique ». Un désabonné reste désabonné, rien n'est supprimé | Toutes les heures |
| Mailchimp, audience Biologie e-learning | Les responsables formation des établissements de santé y sont envoyés avec le tag « Certification périodique » | Toutes les heures |
| ScanUp | Quand un testeur commence ou termine un module d'essai, une trace ou une tâche est créée (adresse `hook.php`, protégée par une clé) | Une fois par jour, par Make |

Les clés d'accès (Microsoft, Calendly, Mailchimp, ScanUp) se saisissent dans les Réglages. Elles ne sont jamais affichées ensuite et ne doivent jamais être écrites dans ce dépôt.

## 4. Tâche planifiée

Une seule tâche planifiée OVH fait tourner les synchronisations : **Hébergements > 360skillvue > Tâches planifiées (Cron)**, commande `crm/cron-mail.php`, langage PHP 8.3, toutes les heures.
Elle lit les e-mails, met à jour Mailchimp et Calendly, et lance la sauvegarde quotidienne.

## 5. Sauvegardes

1. La base est sauvegardée automatiquement une fois par jour. Les 14 dernières sauvegardes sont gardées dans le dossier `sauvegardes-crm`, à côté du dossier `crm` et hors de portée du web.
2. **Réglages > Sauvegardes** permet d'en lancer une tout de suite et de télécharger les fichiers.
3. OVH sauvegarde aussi les bases de l'hébergement de son côté.

## 6. Installer une nouvelle version

1. Envoyer les fichiers modifiés dans le dossier `crm` par SFTP (serveur `ftp.cluster130.hosting.ovh.net`, port 22). Les identifiants sont dans **Hébergements > 360skillvue > FTP-SSH**.
2. Ne jamais remplacer `config.php` : il contient les accès à la base.
3. Ne toucher ni au site WordPress ni à ses bases (dossiers `www`, `blog`, `test360`).
4. Vérifier le numéro de version affiché dans le CRM, puis reporter les mêmes fichiers dans ce dépôt.

Les nouvelles tables de la base se créent toutes seules au premier usage : aucune manipulation de base n'est nécessaire.

## 7. Pipedrive

Les données de Pipedrive ont été reprises : équipe, pipelines, organisations, personnes, affaires, activités et notes. L'import est terminé et ses boutons ont été retirés. Une archive Excel de Pipedrive est conservée à part.

## 8. Réinstaller depuis zéro (rarement utile)

1. Créer une base MySQL dans l'espace client OVH et noter le serveur, le nom, l'utilisateur et le mot de passe. Ne pas réutiliser une base de WordPress.
2. Créer le sous-domaine `crm` (Multisite), dossier racine `crm`, avec SSL.
3. Envoyer tout le contenu de `crm-ovh` dans le dossier `crm`, y compris le fichier `.htaccess`.
4. Ouvrir `https://crm.360skillvue.com/install.php`, saisir les informations de la base et le premier administrateur, cliquer sur **Installer**, puis supprimer `install.php` du serveur.
5. Restaurer la dernière sauvegarde de la base, puis ressaisir les clés d'accès dans les Réglages.

## Connecter le CRM à Claude

Le CRM comprend un serveur MCP : Claude peut consulter les affaires, activités, organisations et personnes, en créer et les modifier, au nom de la personne connectée. Il ne peut rien supprimer.

1. Dans Claude : **Réglages > Connecteurs > Ajouter un connecteur personnalisé**.
2. Nom : `CRM 360skillvue` ; adresse : `https://crm.360skillvue.com/mcp.php`.
3. Cliquez sur **Se connecter** : la page du CRM s'ouvre. Connectez-vous avec votre compte du CRM, puis cliquez sur **Autoriser**.

Chaque personne de l'équipe fait cette connexion avec son propre compte. Les accès donnés se voient et se retirent dans **Réglages > Claude** du CRM.
