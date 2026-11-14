<?php
// Modèle de configuration. install.php crée automatiquement config.php ; ce fichier sert seulement de référence.
return [
    'db_host' => 'xxxx.mysql.db',   // Serveur MySQL indiqué par OVH
    'db_port' => 3306,
    'db_name' => 'nom_de_la_base',
    'db_user' => 'utilisateur',
    'db_pass' => 'mot_de_passe',
    'pipedrive_token' => '',        // Jeton d'API Pipedrive, facultatif
    'cron_key' => '',
];
