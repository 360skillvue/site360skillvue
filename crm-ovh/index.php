<?php
// Page d'entrée : connexion, puis application.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
security_headers();
if (!crm_config()) { header('Location: install.php'); exit; }
start_session();

$err = '';
if (isset($_GET['logout']) && $_SERVER['REQUEST_METHOD'] === 'POST' && hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
    $_SESSION = []; session_regenerate_id(true); header('Location: ./'); exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'])) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0';
    if (!hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) $err = 'Session expirée : réessayez.';
    elseif (login_blocked($ip)) $err = 'Trop de tentatives : réessayez dans 15 minutes.';
    else {
        $u = q('SELECT id, password_hash FROM users WHERE email = ? AND can_login = 1 AND active = 1', [strtolower(trim((string)$_POST['email']))])->fetch();
        if ($u && $u['password_hash'] && password_verify((string)($_POST['password'] ?? ''), $u['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['uid'] = (int)$u['id']; $_SESSION['seen'] = time();
            if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash((string)$_POST['password'], PASSWORD_DEFAULT), $u['id']]);
            header('Location: ./'); exit;
        }
        login_failed($ip); usleep(400000);
        $err = 'Identifiant ou mot de passe incorrect.';
    }
}
$me = current_user();
$v = CRM_VERSION;
?><!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>CRM 360skillvue</title><meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="assets/app.css?v=<?= $v ?>">
</head>
<?php if (!$me): ?>
<body class="auth"><main class="auth-box">
  <div class="brand">360<b>skillvue</b><span>CRM</span></div>
  <h1>Connexion</h1>
  <?php if ($err): ?><p class="error"><?= h($err) ?></p><?php endif; ?>
  <form method="post" class="stack">
    <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
    <label class="f"><span>E-mail</span><input type="email" name="email" required autocomplete="username" value="<?= h($_POST['email'] ?? '') ?>"></label>
    <label class="f"><span>Mot de passe</span><input type="password" name="password" required autocomplete="current-password"></label>
    <button class="btn primary" type="submit">Se connecter</button>
  </form>
  <p class="note">Mot de passe oublié : demandez à un administrateur du CRM de vous en définir un nouveau.</p>
</main></body>
<?php else: ?>
<body>
<header>
  <div class="bar wrap">
    <div class="brand">360<b>skillvue</b><span>CRM</span></div>
    <nav id="nav">
      <button data-v="deals">Affaires</button>
      <button data-v="acts">Activités<span class="count" id="lateCount" hidden></span></button>
      <button data-v="contacts">Contacts</button>
      <button data-v="settings">Réglages</button>
    </nav>
    <form method="post" action="?logout=1" class="me"><span id="meName"><?= h($me['name']) ?></span>
      <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>"><button class="btn sm ghost" type="submit">Déconnexion</button></form>
  </div>
</header>
<main id="main"></main>
<div id="layer"></div>
<div id="toastHost"></div>
<script id="boot" type="application/json"><?= json_encode(['csrf' => $_SESSION['csrf']], JSON_HEX_TAG) ?></script>
<script src="assets/app.js?v=<?= $v ?>"></script>
</body>
<?php endif; ?>
</html>
