<?php
// Suivi d'ouverture des e-mails envoyés depuis le CRM : image d'un pixel, appelée par la messagerie du destinataire.
// Aucune information n'est renvoyée, aucune session n'est ouverte : seul le compteur de l'e-mail concerné est mis à jour.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';

$k = (string)($_GET['k'] ?? '');
if (preg_match('/^[a-f0-9]{32}$/', $k)) {
    try {
        $now = now_utc();
        // Les toutes premières secondes sont ignorées : ce sont les contrôles automatiques faits au moment de l'envoi.
        q('UPDATE crm_mail_track SET opens = opens + 1, first_open = COALESCE(first_open, ?), last_open = ? WHERE token = ? AND sent_at < ?',
            [$now, $now, $k, gmdate('Y-m-d H:i:s', time() - 30)]);
    } catch (Throwable $e) {
        error_log('[crm] suivi ' . $e->getMessage());
    }
}
header('Content-Type: image/gif');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
