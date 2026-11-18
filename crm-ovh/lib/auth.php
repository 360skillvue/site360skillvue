<?php
// Connexion au CRM : vérification du mot de passe, blocage après plusieurs échecs (par compte et par adresse IP),
// journal des connexions, et double authentification par code TOTP (application Google Authenticator, Microsoft
// Authenticator, etc.). Utilisé par la page de connexion du CRM et par la page d'autorisation de Claude (oauth.php).
declare(strict_types=1);

const AUTH_MAX_FAILS = 5;          // échecs tolérés, par compte et par adresse IP
const AUTH_LOCK_SECONDS = 900;     // durée du blocage : 15 minutes
const AUTH_MIN_PASSWORD = 12;      // longueur minimale des nouveaux mots de passe
const AUTH_TOTP_ISSUER = 'CRM 360skillvue';

function auth_schema(): void {
    static $done = false; if ($done) return;
    q("CREATE TABLE IF NOT EXISTS crm_login_log (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        at DATETIME NOT NULL, email VARCHAR(190) NOT NULL, user_id INT UNSIGNED NULL, ip VARCHAR(64) NOT NULL,
        result VARCHAR(20) NOT NULL, via VARCHAR(20) NOT NULL, agent VARCHAR(255) NULL,
        KEY k_ip (ip, at), KEY k_email (email, at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    foreach (['totp_secret VARCHAR(64) NULL', 'totp_on TINYINT(1) NOT NULL DEFAULT 0', 'totp_last BIGINT NULL', 'pw_weak TINYINT(1) NOT NULL DEFAULT 0'] as $col) {
        $name = strtok($col, ' ');
        if (!q("SHOW COLUMNS FROM users LIKE '$name'")->fetch()) q("ALTER TABLE users ADD COLUMN $col");
    }
    $done = true;
}

function auth_ip(): string { return substr((string)($_SERVER['REMOTE_ADDR'] ?? '0'), 0, 64); }

function auth_log(string $email, ?int $uid, string $result, string $via): void {
    try {
        auth_schema();
        q('INSERT INTO crm_login_log (at, email, user_id, ip, result, via, agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [now_utc(), mb_substr(strtolower(trim($email)), 0, 190), $uid, auth_ip(), $result, $via, mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255)]);
        // Le journal garde un an d'historique.
        if (random_int(1, 50) === 1) q('DELETE FROM crm_login_log WHERE at < ?', [gmdate('Y-m-d H:i:s', time() - 366 * 86400)]);
    } catch (Throwable $e) { error_log('[crm] journal de connexion ' . $e->getMessage()); }
}

/* Message de blocage, ou null si la connexion peut être tentée. Compte les échecs des 15 dernières minutes. */
function auth_locked(string $email): ?string {
    auth_schema();
    $since = gmdate('Y-m-d H:i:s', time() - AUTH_LOCK_SECONDS);
    $fails = "result IN ('echec', 'code_faux')";
    $byIp = (int)q("SELECT COUNT(*) FROM crm_login_log WHERE ip = ? AND at >= ? AND $fails", [auth_ip(), $since])->fetchColumn();
    $byAcct = (int)q("SELECT COUNT(*) FROM crm_login_log WHERE email = ? AND at >= ? AND $fails", [strtolower(trim($email)), $since])->fetchColumn();
    if ($byIp >= AUTH_MAX_FAILS || $byAcct >= AUTH_MAX_FAILS) return 'Trop de tentatives : connexion bloquée pendant 15 minutes.';
    return null;
}

/* Première étape : e-mail et mot de passe. Renvoie ['ok' => true, 'uid', 'totp' => bool] ou ['ok' => false, 'error']. */
function auth_password(string $email, string $password, string $via): array {
    $email = strtolower(trim($email));
    if ($email === '' || $password === '') return ['ok' => false, 'error' => 'Identifiant ou mot de passe incorrect.'];
    if ($msg = auth_locked($email)) { auth_log($email, null, 'bloque', $via); return ['ok' => false, 'error' => $msg]; }
    $u = q('SELECT id, password_hash, totp_on FROM users WHERE email = ? AND can_login = 1 AND active = 1', [$email])->fetch();
    if (!$u || !$u['password_hash'] || !password_verify($password, $u['password_hash'])) {
        auth_log($email, $u ? (int)$u['id'] : null, 'echec', $via); usleep(400000);
        return ['ok' => false, 'error' => 'Identifiant ou mot de passe incorrect.'];
    }
    if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $u['id']]);
    // Mot de passe trop court par rapport à la règle actuelle : on le signale dans le CRM jusqu'à ce qu'il soit changé.
    q('UPDATE users SET pw_weak = ? WHERE id = ?', [mb_strlen($password) < AUTH_MIN_PASSWORD ? 1 : 0, $u['id']]);
    if (!(int)$u['totp_on']) auth_log($email, (int)$u['id'], 'reussie', $via);
    return ['ok' => true, 'uid' => (int)$u['id'], 'totp' => (bool)(int)$u['totp_on']];
}

/* Deuxième étape (comptes avec double authentification) : code à 6 chiffres. */
function auth_totp_step(int $uid, string $code, string $via): array {
    $u = q('SELECT email, totp_secret, totp_last FROM users WHERE id = ? AND can_login = 1 AND active = 1', [$uid])->fetch();
    if (!$u) return ['ok' => false, 'error' => 'Compte introuvable.'];
    if ($msg = auth_locked((string)$u['email'])) { auth_log((string)$u['email'], $uid, 'bloque', $via); return ['ok' => false, 'error' => $msg]; }
    $step = totp_verify((string)$u['totp_secret'], $code, $u['totp_last'] === null ? null : (int)$u['totp_last']);
    if ($step === null) { auth_log((string)$u['email'], $uid, 'code_faux', $via); usleep(400000); return ['ok' => false, 'error' => 'Code incorrect.']; }
    q('UPDATE users SET totp_last = ? WHERE id = ?', [$step, $uid]);
    auth_log((string)$u['email'], $uid, 'reussie', $via);
    return ['ok' => true];
}

function auth_password_rule(string $p): ?string {
    if (mb_strlen($p) < AUTH_MIN_PASSWORD) return 'Le mot de passe doit faire au moins ' . AUTH_MIN_PASSWORD . ' caractères.';
    return null;
}

/* ---------- TOTP (RFC 6238 : HMAC-SHA1, 30 secondes, 6 chiffres) ---------- */
function totp_b32_encode(string $bin): string {
    $alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $bits = ''; $out = '';
    foreach (str_split($bin) as $c) $bits .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
    foreach (str_split($bits, 5) as $chunk) $out .= $alpha[bindec(str_pad($chunk, 5, '0'))];
    return $out;
}
function totp_b32_decode(string $s): string {
    $alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; $bits = ''; $out = '';
    foreach (str_split(strtoupper(preg_replace('/[^A-Za-z2-7]/', '', $s))) as $c) $bits .= str_pad(decbin(strpos($alpha, $c)), 5, '0', STR_PAD_LEFT);
    foreach (str_split($bits, 8) as $byte) if (strlen($byte) === 8) $out .= chr(bindec($byte));
    return $out;
}
function totp_secret_new(): string { return totp_b32_encode(random_bytes(20)); }
function totp_code(string $secret, int $step): string {
    $h = hash_hmac('sha1', pack('J', $step), totp_b32_decode($secret), true);
    $o = ord($h[19]) & 0x0f;
    $n = ((ord($h[$o]) & 0x7f) << 24) | (ord($h[$o + 1]) << 16) | (ord($h[$o + 2]) << 8) | ord($h[$o + 3]);
    return str_pad((string)($n % 1000000), 6, '0', STR_PAD_LEFT);
}
/* Renvoie le pas de temps accepté (tolérance de 30 s avant ou après), ou null. Un code déjà utilisé est refusé. */
function totp_verify(string $secret, string $code, ?int $last): ?int {
    $code = preg_replace('/\D/', '', $code);
    if ($secret === '' || strlen($code) !== 6) return null;
    $now = intdiv(time(), 30);
    foreach ([0, -1, 1] as $d) {
        $s = $now + $d;
        if ($last !== null && $s <= $last) continue;
        if (hash_equals(totp_code($secret, $s), $code)) return $s;
    }
    return null;
}
function totp_uri(string $secret, string $email): string {
    return 'otpauth://totp/' . rawurlencode(AUTH_TOTP_ISSUER . ':' . $email) . '?secret=' . $secret . '&issuer=' . rawurlencode(AUTH_TOTP_ISSUER) . '&algorithm=SHA1&digits=6&period=30';
}

/* Double authentification obligatoire pour les administrateurs (réglage). */
function auth_totp_required(array $u): bool {
    return ($u['role'] ?? '') === 'admin' && (bool)setting('totp_required_admin', false);
}
