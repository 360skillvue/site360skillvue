<?php
// Installation en une fois : écrit config.php, crée les tables et le premier compte administrateur.
// Une fois l'installation faite, cette page refuse de s'exécuter à nouveau.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
security_headers();
start_session();

$done = false; $err = '';
$installed = false;
if (crm_config()) {
    try { $installed = (int)q("SELECT COUNT(*) FROM users WHERE role = 'admin' AND can_login = 1")->fetchColumn() > 0; }
    catch (Throwable $e) { $installed = false; }
}

if (!$installed && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) $err = 'Session expirée : rechargez la page.';
    $f = fn($k) => trim((string)($_POST[$k] ?? ''));
    $cfg = [
        'db_host' => $f('db_host'), 'db_port' => (int)($f('db_port') ?: 3306), 'db_name' => $f('db_name'),
        'db_user' => $f('db_user'), 'db_pass' => (string)($_POST['db_pass'] ?? ''),
        'pipedrive_token' => $f('pipedrive_token'), 'cron_key' => bin2hex(random_bytes(16)),
    ];
    $name = $f('admin_name'); $email = strtolower($f('admin_email')); $pass = (string)($_POST['admin_pass'] ?? '');
    if (!$err && (!$cfg['db_host'] || !$cfg['db_name'] || !$cfg['db_user'])) $err = 'Renseignez le serveur, le nom et l\'utilisateur de la base.';
    if (!$err && (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL))) $err = 'Renseignez un nom et une adresse e-mail valide pour l\'administrateur.';
    if (!$err && strlen($pass) < 10) $err = 'Le mot de passe administrateur doit faire au moins 10 caractères.';
    if (!$err) {
        try {
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $cfg['db_host'], $cfg['db_port'], $cfg['db_name']);
            $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            foreach (require __DIR__ . '/lib/schema.php' as $sql) $pdo->exec($sql);
            $php = "<?php\n// Configuration du CRM, générée par install.php. Ne pas publier ce fichier.\nreturn " . var_export($cfg, true) . ";\n";
            if (@file_put_contents(__DIR__ . '/config.php', $php) === false) throw new RuntimeException('Impossible d\'écrire config.php : vérifiez les droits d\'écriture du dossier.');
            @chmod(__DIR__ . '/config.php', 0640);
            $st = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, can_login, active, created_at) VALUES (?, ?, ?, 'admin', 1, 1, ?)
                                 ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'admin', can_login = 1, active = 1");
            $st->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT), now_utc()]);
            $done = true;
        } catch (Throwable $e) {
            $err = $e instanceof PDOException ? 'Connexion à la base impossible : vérifiez les informations (' . $e->getCode() . ').' : $e->getMessage();
        }
    }
}
?><!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Installation du CRM</title><link rel="stylesheet" href="assets/app.css"></head>
<body class="auth"><main class="auth-box">
<div class="brand">360<b>skillvue</b><span>CRM</span></div>
<?php if ($installed): ?>
  <h1>Le CRM est déjà installé</h1><p class="note">Pour des raisons de sécurité, cette page ne peut plus être utilisée. Vous pouvez supprimer le fichier install.php du serveur.</p>
  <p><a class="btn primary" href="./">Ouvrir le CRM</a></p>
<?php elseif ($done): ?>
  <h1>Installation terminée</h1><p class="note">Supprimez maintenant le fichier <b>install.php</b> du serveur, puis connectez-vous avec le compte administrateur.</p>
  <p><a class="btn primary" href="./">Se connecter</a></p>
<?php else: ?>
  <h1>Installation</h1>
  <?php if ($err): ?><p class="error"><?= h($err) ?></p><?php endif; ?>
  <form method="post" class="stack">
    <input type="hidden" name="csrf" value="<?= h($_SESSION['csrf']) ?>">
    <fieldset><legend>Base de données MySQL (espace client OVH, onglet Bases de données)</legend>
      <label class="f"><span>Serveur</span><input type="text" name="db_host" required value="<?= h($_POST['db_host'] ?? '') ?>" placeholder="xxxx.mysql.db"></label>
      <label class="f"><span>Port</span><input type="number" name="db_port" value="<?= h($_POST['db_port'] ?? '3306') ?>"></label>
      <label class="f"><span>Nom de la base</span><input type="text" name="db_name" required value="<?= h($_POST['db_name'] ?? '') ?>"></label>
      <label class="f"><span>Utilisateur</span><input type="text" name="db_user" required value="<?= h($_POST['db_user'] ?? '') ?>"></label>
      <label class="f"><span>Mot de passe</span><input type="password" name="db_pass" autocomplete="off"></label>
    </fieldset>
    <fieldset><legend>Premier compte administrateur</legend>
      <label class="f"><span>Nom</span><input type="text" name="admin_name" required value="<?= h($_POST['admin_name'] ?? '') ?>"></label>
      <label class="f"><span>E-mail (identifiant)</span><input type="email" name="admin_email" required value="<?= h($_POST['admin_email'] ?? '') ?>"></label>
      <label class="f"><span>Mot de passe (10 caractères minimum)</span><input type="password" name="admin_pass" required minlength="10" autocomplete="new-password"></label>
    </fieldset>
    <fieldset><legend>Pipedrive (facultatif, pour l'import)</legend>
      <label class="f"><span>Jeton d'API Pipedrive (Pipedrive : Paramètres personnels, API)</span><input type="password" name="pipedrive_token" autocomplete="off"></label>
    </fieldset>
    <button class="btn primary" type="submit">Installer</button>
  </form>
<?php endif; ?>
</main></body></html>
