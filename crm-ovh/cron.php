<?php
// Import automatique des changements Pipedrive, à lancer par une tâche planifiée OVH (exécution en ligne de commande uniquement).
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('Accès refusé.'); }
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/pipedrive.php';
@set_time_limit(0);
$mode = in_array('--full', $argv, true) ? 'full' : 'inc';
$state = ['mode' => $mode];
$guard = 0;
do {
    $state = import_step($state);
    echo end($state['log']), PHP_EOL;
} while ($state['step'] !== 'done' && ++$guard < 2000);
