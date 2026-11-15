<?php
// Tâche planifiée OVH (exécution en ligne de commande uniquement) : import des changements Pipedrive, puis e-mails Microsoft.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('Accès refusé.'); }
require __DIR__ . '/lib/bootstrap.php';
@set_time_limit(0);

// 1. Pipedrive (une erreur ici n'empêche pas la suite)
try {
    require __DIR__ . '/lib/pipedrive.php';
    $mode = in_array('--full', $argv, true) ? 'full' : 'inc';
    $state = ['mode' => $mode];
    $guard = 0;
    do {
        $state = import_step($state);
        echo end($state['log']), PHP_EOL;
    } while ($state['step'] !== 'done' && ++$guard < 2000);
} catch (Throwable $e) {
    echo 'Pipedrive : ', $e->getMessage(), PHP_EOL;
}

// 2. E-mails Microsoft des boîtes connectées
try {
    require __DIR__ . '/lib/mail.php';
    if (ms_app()) foreach (mail_sync_all() as $line) echo $line, PHP_EOL;
} catch (Throwable $e) {
    echo 'E-mails : ', $e->getMessage(), PHP_EOL;
}
