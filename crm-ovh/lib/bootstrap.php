<?php
// Chargement commun : configuration, base de données, session, utilitaires.
declare(strict_types=1);

const CRM_VERSION = '1.0.0';
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

function current_user(): ?array {
    start_session();
    if (empty($_SESSION['uid'])) return null;
    static $u = null;
    if ($u === null) {
        $u = q('SELECT id, name, email, role FROM users WHERE id = ? AND can_login = 1', [$_SESSION['uid']])->fetch() ?: false;
        // Expiration après 12 h d'inactivité
        if ($u && (time() - ($_SESSION['seen'] ?? 0)) > 43200) { $u = false; }
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
