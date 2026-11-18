<?php
// Points d'accès OAuth du CRM : métadonnées, enregistrement du client, page d'autorisation, échange des jetons.
// Appelé directement (oauth.php?a=...) ou par les adresses /.well-known/... réécrites dans .htaccess.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/oauth.php';

$base = crm_base_url();
$a = (string)($_GET['a'] ?? '');
$meta = (string)($_GET['meta'] ?? '');

function oauth_json($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, MCP-Protocol-Version');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { header('Access-Control-Allow-Methods: GET, POST, OPTIONS'); oauth_json([], 204); }

try {
    if ($meta === 'protected-resource') {
        oauth_json(['resource' => $base . '/mcp.php', 'authorization_servers' => [$base], 'bearer_methods_supported' => ['header'],
                    'scopes_supported' => ['crm'], 'resource_name' => 'CRM 360skillvue']);
    }
    if ($meta === 'authorization-server') {
        oauth_json(['issuer' => $base,
            'authorization_endpoint' => $base . '/oauth.php?a=authorize',
            'token_endpoint' => $base . '/oauth.php?a=token',
            'registration_endpoint' => $base . '/oauth.php?a=register',
            'response_types_supported' => ['code'], 'grant_types_supported' => ['authorization_code', 'refresh_token'],
            'code_challenge_methods_supported' => ['S256'], 'token_endpoint_auth_methods_supported' => ['none'],
            'scopes_supported' => ['crm']]);
    }

    if ($a === 'register') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') oauth_json(['error' => 'invalid_request'], 405);
        $in = json_decode((string)file_get_contents('php://input'), true);
        try { oauth_json(oauth_register(is_array($in) ? $in : []), 201); }
        catch (InvalidArgumentException $e) { oauth_json(['error' => 'invalid_redirect_uri', 'error_description' => $e->getMessage()], 400); }
    }

    if ($a === 'token') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') oauth_json(['error' => 'invalid_request'], 405);
        $in = $_POST;
        if (!$in) { $j = json_decode((string)file_get_contents('php://input'), true); if (is_array($j)) $in = $j; }
        // Client public : identifiant éventuellement transmis par authentification « Basic »
        if (empty($in['client_id']) && !empty($_SERVER['PHP_AUTH_USER'])) $in['client_id'] = $_SERVER['PHP_AUTH_USER'];
        try { oauth_json(oauth_token_exchange($in)); }
        catch (InvalidArgumentException $e) { oauth_json(['error' => $e->getMessage()], $e->getMessage() === 'invalid_client' ? 401 : 400); }
    }

    if ($a === 'authorize') { oauth_authorize_page(); exit; }

    oauth_json(['error' => 'not_found'], 404);
} catch (Throwable $e) {
    error_log('[crm] oauth ' . $e->getMessage());
    oauth_json(['error' => 'server_error'], 500);
}

/* Page d'autorisation : connexion avec un compte du CRM si besoin, puis accord explicite. */
function oauth_authorize_page(): void {
    start_session();
    $p = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : $_GET;
    $clientId = (string)($p['client_id'] ?? ''); $redirect = (string)($p['redirect_uri'] ?? '');
    $state = (string)($p['state'] ?? ''); $challenge = (string)($p['code_challenge'] ?? '');
    $method = (string)($p['code_challenge_method'] ?? ''); $rtype = (string)($p['response_type'] ?? '');
    $client = oauth_client($clientId);
    $fatal = '';
    if (!$client) $fatal = 'Application inconnue : relancez la connexion depuis Claude.';
    elseif (!in_array($redirect, $client['redirect_uris'], true)) $fatal = 'Adresse de retour non autorisée.';
    if ($fatal) { oauth_page('Connexion impossible', '<p class="error">' . h($fatal) . '</p>'); return; }
    $back = function (array $q) use ($redirect, $state) {
        if ($state !== '') $q['state'] = $state;
        header('Location: ' . $redirect . (str_contains($redirect, '?') ? '&' : '?') . http_build_query($q)); exit;
    };
    if ($rtype !== 'code') $back(['error' => 'unsupported_response_type']);
    if ($method !== 'S256' || !preg_match('/^[A-Za-z0-9\-._~]{43,128}$/', $challenge)) $back(['error' => 'invalid_request', 'error_description' => 'PKCE S256 requis']);

    $origin = (function ($u) { $x = parse_url($u); return $x['scheme'] . '://' . $x['host'] . (isset($x['port']) ? ':' . $x['port'] : ''); })($redirect);
    header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self' " . $origin);
    header('X-Content-Type-Options: nosniff'); header('Referrer-Policy: no-referrer'); header('X-Frame-Options: DENY');

    $err = '';
    $me = current_user();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) $err = 'Session expirée : réessayez.';
        elseif (isset($_POST['deny'])) $back(['error' => 'access_denied']);
        elseif (!$me && isset($_POST['code']) && !empty($_SESSION['oauth_pending']) && (time() - (int)($_SESSION['oauth_pending_at'] ?? 0)) < 300) {
            require_once __DIR__ . '/lib/auth.php';
            $uid = (int)$_SESSION['oauth_pending'];
            $r = auth_totp_step($uid, (string)$_POST['code'], 'claude');
            if ($r['ok']) { unset($_SESSION['oauth_pending'], $_SESSION['oauth_pending_at']); session_regenerate_id(true); $_SESSION['uid'] = $uid; $_SESSION['seen'] = time();
                            $me = q('SELECT id, name, email, role FROM users WHERE id = ?', [$uid])->fetch(); }
            else $err = $r['error'];
        } elseif (!$me && isset($_POST['email'])) {
            require_once __DIR__ . '/lib/auth.php';
            $r = auth_password((string)$_POST['email'], (string)($_POST['password'] ?? ''), 'claude');
            if (!$r['ok']) $err = $r['error'];
            else {
                $u = q('SELECT id, name, email, role FROM users WHERE id = ?', [$r['uid']])->fetch();
                if ($r['totp']) { $_SESSION['oauth_pending'] = $r['uid']; $_SESSION['oauth_pending_at'] = time(); }
                elseif (auth_totp_required($u)) $err = 'La double authentification est obligatoire pour les administrateurs : connectez-vous d\'abord au CRM pour la mettre en place.';
                else { session_regenerate_id(true); $_SESSION['uid'] = (int)$u['id']; $_SESSION['seen'] = time(); $me = $u; }
            }
        } elseif ($me && isset($_POST['allow'])) {
            $back(['code' => oauth_issue_code($clientId, (int)$me['id'], $redirect, $challenge)]);
        }
    }
    $hidden = '';
    foreach (['client_id' => $clientId, 'redirect_uri' => $redirect, 'state' => $state, 'code_challenge' => $challenge, 'code_challenge_method' => $method, 'response_type' => $rtype] as $k => $v)
        $hidden .= '<input type="hidden" name="' . h($k) . '" value="' . h($v) . '">';
    $hidden .= '<input type="hidden" name="csrf" value="' . h($_SESSION['csrf']) . '">';
    $app = h($client['name'] ?: 'Claude');
    if (!$me && !empty($_SESSION['oauth_pending']) && (time() - (int)($_SESSION['oauth_pending_at'] ?? 0)) < 300) {
        oauth_page('Connecter ' . $app . ' au CRM', ($err ? '<p class="error">' . h($err) . '</p>' : '') .
            '<p class="note">Saisissez le code à 6 chiffres de votre application d\'authentification.</p>
            <form method="post" class="stack">' . $hidden . '
              <label class="f"><span>Code</span><input name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" autofocus></label>
              <button class="btn primary" type="submit">Valider</button></form>');
        return;
    }
    if (!$me) {
        oauth_page('Connecter ' . $app . ' au CRM', ($err ? '<p class="error">' . h($err) . '</p>' : '') .
            '<p class="note">Connectez-vous avec votre compte du CRM pour autoriser ' . $app . ' à y accéder en votre nom.</p>
            <form method="post" class="stack">' . $hidden . '
              <label class="f"><span>E-mail</span><input type="email" name="email" required autocomplete="username"></label>
              <label class="f"><span>Mot de passe</span><input type="password" name="password" required autocomplete="current-password"></label>
              <button class="btn primary" type="submit">Se connecter</button></form>');
        return;
    }
    oauth_page('Autoriser ' . $app, ($err ? '<p class="error">' . h($err) . '</p>' : '') .
        '<p>Connecté en tant que <b>' . h($me['name']) . '</b>.</p>
         <p class="note">' . $app . ' pourra consulter les affaires, activités, organisations et personnes du CRM, en créer et les modifier en votre nom.
         Il ne pourra rien supprimer. Vous pourrez retirer cet accès à tout moment dans les Réglages du CRM.</p>
         <form method="post" class="stack">' . $hidden . '
           <button class="btn primary" type="submit" name="allow" value="1">Autoriser</button>
           <button class="btn" type="submit" name="deny" value="1">Refuser</button></form>');
}

function oauth_page(string $title, string $body): void {
    $v = defined('CRM_VERSION') ? CRM_VERSION : '1';
    echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>' . h($title) . '</title><meta name="robots" content="noindex,nofollow">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap">
      <link rel="stylesheet" href="assets/app.css?v=' . h($v) . '"></head>
      <body class="auth"><main class="auth-box"><div class="brand">360<b>skillvue</b><span>CRM</span></div><h1>' . h($title) . '</h1>' . $body . '</main></body></html>';
}
