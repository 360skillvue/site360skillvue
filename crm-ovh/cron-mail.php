<?php
// Tâche planifiée OVH (ligne de commande uniquement) : e-mails Microsoft des boîtes connectées, sans toucher à Pipedrive.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('Accès refusé.'); }
require __DIR__ . '/lib/bootstrap.php';
@set_time_limit(0);
try {
    require __DIR__ . '/lib/mail.php';
    if (!ms_app()) { echo "Connexion Microsoft non configurée.", PHP_EOL; exit; }
    foreach (mail_sync_all() as $line) echo $line, PHP_EOL;
} catch (Throwable $e) {
    echo 'E-mails : ', $e->getMessage(), PHP_EOL;
}
// Tags Mailchimp suivis (par exemple les inscrits à un webinaire)
try {
    require_once __DIR__ . '/lib/mailchimp.php';
    $mc = mc_conf();
    if ($mc['key'] !== '' && $mc['list'] !== '' && $mc['follow']) foreach (mc_sync()['lignes'] as $line) echo 'Mailchimp : ', $line, PHP_EOL;
    // Contacts utiles du CRM vers Mailchimp : seulement après un premier envoi lancé à la main depuis les Réglages.
    // Responsables formation des établissements de santé vers l'audience Biologie e-learning : après un premier envoi lancé à la main.
    if ($mc['key'] !== '' && $mc['cp_on']) { $r = mc_cp_push(false); echo 'Mailchimp certification périodique : ', $r['envoyes'], ' contacts envoyés sur ', $r['retenus'], ' retenus', PHP_EOL; }
    if ($mc['key'] !== '' && $mc['list'] !== '' && $mc['push_on']) { $r = mc_push(false); echo 'Mailchimp : ', $r['envoyes'], ' contacts envoyés sur ', $r['utiles'], ' utiles', PHP_EOL; }
} catch (Throwable $e) {
    echo 'Mailchimp : ', $e->getMessage(), PHP_EOL;
}
// Rendez-vous commerciaux pris sur Calendly
try {
    require_once __DIR__ . '/lib/calendly.php';
    if (cal_conf()['token'] !== '') foreach (cal_sync()['lignes'] as $line) echo 'Calendly : ', $line, PHP_EOL;
} catch (Throwable $e) {
    echo 'Calendly : ', $e->getMessage(), PHP_EOL;
}
