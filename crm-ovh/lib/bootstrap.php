<?php
// Chargement commun : configuration, base de données, session, utilitaires.
declare(strict_types=1);

const CRM_VERSION = '1.0.60';
define('CRM_ROOT', dirname(__DIR__));

function crm_config(): ?array {
    static $cfg = false;
    if ($cfg === false) {
        $f = CRM_ROOT . '/config.php';
        $cfg = is_file($f) ? require $f : null;
    }
    return $cfg ?: null;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = crm_config();
    if (!$c) throw new RuntimeException('Configuration absente : lancez install.php.');
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'], (int)($c['db_port'] ?? 3306), $c['db_name']);
    $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}

function q(string $sql, array $p = []): PDOStatement {
    $st = db()->prepare($sql);
    $st->execute($p);
    return $st;
}

function now_utc(): string { return gmdate('Y-m-d H:i:s'); }

function setting(string $k, $default = null) {
    $r = q('SELECT v FROM settings WHERE k = ?', [$k])->fetchColumn();
    return $r === false ? $default : json_decode((string)$r, true);
}
function set_setting(string $k, $v): void {
    q('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [$k, json_encode($v, JSON_UNESCAPED_UNICODE)]);
}

function is_https(): bool {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || (($_SERVER['SERVER_PORT'] ?? '') == 443);
}

function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('crm360');
    session_set_cookie_params([
        'lifetime' => 0, 'path' => '/', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Lax',
    ]);
    session_start();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

/* Connexion gardée 30 jours sur l'appareil : un jeton tiré au hasard est posé dans un cookie, et seule son empreinte
   est gardée en base. Il sert à rouvrir la session quand celle du serveur a expiré. La déconnexion le supprime. */
const REMEMBER_COOKIE = 'crm360r';
const REMEMBER_DAYS = 30;

function remember_schema(): void {
    q('CREATE TABLE IF NOT EXISTS crm_remember (selector CHAR(24) NOT NULL PRIMARY KEY, token_hash CHAR(64) NOT NULL, user_id BIGINT NOT NULL, expires DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
}
function remember_cookie(string $value, int $expires): void {
    setcookie(REMEMBER_COOKIE, $value, ['expires' => $expires, 'path' => '/', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Lax']);
}
function remember_issue(int $uid): void {
    remember_schema();
    q('DELETE FROM crm_remember WHERE expires < ?', [now_utc()]);
    $sel = bin2hex(random_bytes(12)); $tok = bin2hex(random_bytes(32));
    $exp = time() + REMEMBER_DAYS * 86400;
    q('INSERT INTO crm_remember (selector, token_hash, user_id, expires) VALUES (?, ?, ?, ?)', [$sel, hash('sha256', $tok), $uid, gmdate('Y-m-d H:i:s', $exp)]);
    remember_cookie($sel . ':' . $tok, $exp);
    // Jeton de formulaire lié au cookie : il reste le même quand la session du serveur est rouverte, les pages ouvertes continuent de marcher.
    $_SESSION['csrf'] = hash_hmac('sha256', 'csrf', $tok);
}
function remember_forget(): void {
    $c = (string)($_COOKIE[REMEMBER_COOKIE] ?? '');
    if ($c === '') return;
    try { remember_schema(); q('DELETE FROM crm_remember WHERE selector = ?', [substr($c, 0, 24)]); } catch (Throwable $e) {}
    remember_cookie('', time() - 3600);
}
/* Rouvre la session à partir du cookie. Renvoie l'identifiant de l'utilisateur, ou 0. */
function remember_restore(): int {
    $c = (string)($_COOKIE[REMEMBER_COOKIE] ?? '');
    if (!preg_match('/^([0-9a-f]{24}):([0-9a-f]{64})$/', $c, $m)) return 0;
    try {
        remember_schema();
        $r = q('SELECT token_hash, user_id FROM crm_remember WHERE selector = ? AND expires > ?', [$m[1], now_utc()])->fetch();
    } catch (Throwable $e) { return 0; }
    if (!$r || !hash_equals((string)$r['token_hash'], hash('sha256', $m[2]))) return 0;
    $_SESSION['uid'] = (int)$r['user_id']; $_SESSION['seen'] = time();
    $_SESSION['csrf'] = hash_hmac('sha256', 'csrf', $m[2]);
    return (int)$r['user_id'];
}

function current_user(): ?array {
    start_session();
    static $u = null;
    if ($u === null) {
        // Session du serveur absente ou restée inactive plus de 12 h : on la rouvre si l'appareil a gardé sa connexion.
        if (empty($_SESSION['uid']) || (time() - ($_SESSION['seen'] ?? 0)) > 43200) {
            unset($_SESSION['uid']);
            if (!remember_restore()) { $u = false; return null; }
        }
        $u = q('SELECT id, name, email, role FROM users WHERE id = ? AND can_login = 1 AND active = 1', [$_SESSION['uid']])->fetch() ?: false;
        if (!$u) { $_SESSION = []; }
        else $_SESSION['seen'] = time();
    }
    return $u ?: null;
}

function json_out($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(string $msg, int $code = 400): void { json_out(['error' => $msg], $code); }

function security_headers(): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
}

function h($v): string { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }

/* Limitation des tentatives de connexion : 8 échecs par IP et par 15 minutes. */
function login_blocked(string $ip): bool {
    q('DELETE FROM login_attempts WHERE at < ?', [gmdate('Y-m-d H:i:s', time() - 900)]);
    return (int)q('SELECT COUNT(*) FROM login_attempts WHERE ip = ?', [$ip])->fetchColumn() >= 8;
}
function login_failed(string $ip): void { q('INSERT INTO login_attempts (ip, at) VALUES (?, ?)', [$ip, now_utc()]); }
