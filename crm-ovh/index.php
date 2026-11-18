<?php
// Page d'entrée : connexion, puis application.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
security_headers();
if (!crm_config()) { header('Location: install.php'); exit; }
start_session();

$err = '';
if (isset($_GET['logout']) && $_SERVER['REQUEST_METHOD'] === 'POST' && hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
    remember_forget();
    $_SESSION = []; session_regenerate_id(true); header('Location: ./'); exit;
}
require __DIR__ . '/lib/auth.php';
/* Connexion en une ou deux étapes : mot de passe, puis code de l'application d'authentification si le compte l'a activée
   (ou mise en place du code si elle est obligatoire pour ce compte). L'étape en attente expire après 5 minutes. */
$finish = function (int $uid) {
    unset($_SESSION['pending_uid'], $_SESSION['pending_at'], $_SESSION['pending_setup'], $_SESSION['setup_secret']);
    session_regenerate_id(true);
    $_SESSION['uid'] = $uid; $_SESSION['seen'] = time();
    try { remember_issue($uid); } catch (Throwable $e) { error_log('[crm] connexion gardée ' . $e->getMessage()); }
    header('Location: ./'); exit;
};
if (!empty($_SESSION['pending_uid']) && (time() - (int)($_SESSION['pending_at'] ?? 0)) > 300) unset($_SESSION['pending_uid'], $_SESSION['pending_setup'], $_SESSION['setup_secret']);
if (isset($_GET['cancel'])) { unset($_SESSION['pending_uid'], $_SESSION['pending_setup'], $_SESSION['setup_secret']); header('Location: ./'); exit; }
if ($_SERVER['REQUEST_METHOD'] === 'POST' && (isset($_POST['email']) || isset($_POST['code']))) {
    if (!hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) $err = 'Session expirée : réessayez.';
    elseif (isset($_POST['code']) && !empty($_SESSION['pending_uid'])) {
        $uid = (int)$_SESSION['pending_uid'];
        if (!empty($_SESSION['pending_setup'])) {
            // Mise en place obligatoire : le code prouve que l'application a bien enregistré le secret.
            $sec = (string)($_SESSION['setup_secret'] ?? '');
            $step = totp_verify($sec, (string)$_POST['code'], null);
            if ($step === null) { auth_log((string)q('SELECT email FROM users WHERE id = ?', [$uid])->fetchColumn(), $uid, 'code_faux', 'crm'); $err = 'Code incorrect : vérifiez l\'heure du téléphone et réessayez.'; }
            else { q('UPDATE users SET totp_secret = ?, totp_on = 1, totp_last = ? WHERE id = ?', [$sec, $step, $uid]);
                   auth_log((string)q('SELECT email FROM users WHERE id = ?', [$uid])->fetchColumn(), $uid, 'reussie', 'crm'); $finish($uid); }
        } else {
            $r = auth_totp_step($uid, (string)$_POST['code'], 'crm');
            if ($r['ok']) $finish($uid);
            $err = $r['error'];
        }
    } elseif (isset($_POST['email'])) {
        $r = auth_password((string)$_POST['email'], (string)($_POST['password'] ?? ''), 'crm');
        if (!$r['ok']) $err = $r['error'];
        elseif ($r['totp']) { $_SESSION['pending_uid'] = $r['uid']; $_SESSION['pending_at'] = time(); }
        else {
            $u = q('SELECT id, role FROM users WHERE id = ?', [$r['uid']])->fetch();
            if (auth_totp_required($u)) { $_SESSION['pending_uid'] = $r['uid']; $_SESSION['pending_at'] = time(); $_SESSION['pending_setup'] = 1; $_SESSION['setup_secret'] = totp_secret_new(); }
            else $finish($r['uid']);
        }
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
  <?php if (!empty($_SESSION['pending_uid']) && !empty($_SESSION['pending_setup'])):
      $pe = (string)q('SELECT email FROM users WHERE id = ?', [(int)$_SESSION['pending_uid']])->fetchColumn(); ?>
  <p class="note">La double authentification est obligatoire pour les administrateurs. Scannez ce QR code avec une application d'authentification (Google Authenticator, Microsoft Authenticator…), puis saisissez le code affiché.</p>
  <div id="totpQr" data-uri="<?= h(totp_uri((string)$_SESSION['setup_secret'], $pe)) ?>" style="width:180px;margin:0 auto"></div>
  <p class="note" style="text-align:center">Ou saisissez la clé : <code><?= h(chunk_split((string)$_SESSION['setup_secret'], 4, ' ')) ?></code></p>
  <form method="post" class="stack">
    <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
    <label class="f"><span>Code à 6 chiffres</span><input name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" autofocus></label>
    <button class="btn primary" type="submit">Activer et se connecter</button>
  </form>
  <p class="note"><a href="?cancel=1">Annuler</a></p>
  <script src="assets/qrcode.js?v=<?= $v ?>"></script><script src="assets/login.js?v=<?= $v ?>"></script>
  <?php elseif (!empty($_SESSION['pending_uid'])): ?>
  <p class="note">Saisissez le code à 6 chiffres affiché par votre application d'authentification.</p>
  <form method="post" class="stack">
    <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
    <label class="f"><span>Code</span><input name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" autofocus></label>
    <button class="btn primary" type="submit">Valider</button>
  </form>
  <p class="note"><a href="?cancel=1">Annuler</a> · Téléphone perdu : demandez à un administrateur de désactiver votre double authentification.</p>
  <?php else: ?>
  <form method="post" class="stack">
    <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
    <label class="f"><span>E-mail</span><input type="email" name="email" required autocomplete="username" value="<?= h($_POST['email'] ?? '') ?>"></label>
    <label class="f"><span>Mot de passe</span><input type="password" name="password" required autocomplete="current-password"></label>
    <button class="btn primary" type="submit">Se connecter</button>
  </form>
  <p class="note">Mot de passe oublié : demandez à un administrateur du CRM de vous en définir un nouveau.</p>
  <?php endif; ?>
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
<script src="assets/qrcode.js?v=<?= $v ?>"></script>
<script src="assets/app.js?v=<?= $v ?>"></script>
</body>
<?php endif; ?>
</html>
