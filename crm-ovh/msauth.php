<?php
// Connexion d'une boîte Microsoft 365 au CRM : départ vers Microsoft, puis retour avec l'autorisation.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/mail.php';
security_headers();

$me = current_user();
if (!$me) { header('Location: ./'); exit; }

function ms_page(string $title, string $msg): void {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>', h($title), '</title></head>',
         '<body style="font-family:system-ui,sans-serif;max-width:560px;margin:60px auto;padding:0 16px;line-height:1.5">',
         '<h1 style="font-size:20px">', h($title), '</h1><p>', h($msg), '</p><p><a href="./">Retour au CRM</a></p></body></html>';
    exit;
}

try {
    if (isset($_GET['start'])) {
        $state = bin2hex(random_bytes(16));
        $_SESSION['ms_state'] = $state;
        header('Location: ' . ms_authorize_url($state));
        exit;
    }
    if (isset($_GET['error'])) {
        ms_page('Connexion Microsoft annulée', mb_substr((string)($_GET['error_description'] ?? $_GET['error']), 0, 400));
    }
    $code = (string)($_GET['code'] ?? '');
    $state = (string)($_GET['state'] ?? '');
    $want = (string)($_SESSION['ms_state'] ?? '');
    unset($_SESSION['ms_state']);
    if ($code === '' || $want === '' || !hash_equals($want, $state)) {
        ms_page('Connexion Microsoft impossible', 'La demande a expiré ou ne vient pas de cette session. Retournez dans les réglages et recommencez.');
    }
    $email = ms_connect((int)$me['id'], $code);
    ms_page('Boîte connectée', 'La boîte ' . $email . ' est maintenant reliée au CRM. Retournez dans les réglages et cliquez sur « Synchroniser maintenant ».');
} catch (Throwable $e) {
    error_log('[crm] msauth ' . $e->getMessage());
    ms_page('Connexion Microsoft impossible', $e instanceof RuntimeException ? $e->getMessage() : 'Erreur serveur : réessayez dans un instant.');
}
