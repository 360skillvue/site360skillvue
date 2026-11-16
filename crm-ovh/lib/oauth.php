<?php
// Connexion de Claude (et de tout client MCP) au CRM selon OAuth 2.1 : enregistrement du client, autorisation par un compte
// du CRM, échange du code contre un jeton (PKCE obligatoire). Seules les empreintes des codes et des jetons sont gardées en base.
declare(strict_types=1);

const OAUTH_ACCESS_TTL = 3600;          // 1 heure
const OAUTH_REFRESH_TTL = 60 * 86400;   // 60 jours
const OAUTH_CODE_TTL = 600;             // 10 minutes

function oauth_schema(): void {
    static $done = false;
    if ($done) return;
    q("CREATE TABLE IF NOT EXISTS crm_oauth_clients (
        client_id CHAR(32) NOT NULL PRIMARY KEY,
        name VARCHAR(190) NOT NULL DEFAULT '',
        redirect_uris TEXT NOT NULL,
        created_at DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    q("CREATE TABLE IF NOT EXISTS crm_oauth_codes (
        code_hash CHAR(64) NOT NULL PRIMARY KEY,
        client_id CHAR(32) NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        redirect_uri VARCHAR(1000) NOT NULL,
        challenge VARCHAR(128) NOT NULL,
        expires DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    q("CREATE TABLE IF NOT EXISTS crm_oauth_tokens (
        token_hash CHAR(64) NOT NULL PRIMARY KEY,
        kind ENUM('access','refresh') NOT NULL,
        client_id CHAR(32) NOT NULL,
        user_id INT UNSIGNED NOT NULL,
        expires DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        last_used DATETIME NULL,
        KEY k_user (user_id), KEY k_exp (expires)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $done = true;
}

/* Adresse de base du CRM, par exemple https://crm.360skillvue.com */
function crm_base_url(): string {
    $scheme = is_https() ? 'https' : 'http';
    $host = preg_replace('/[^A-Za-z0-9.\-:\[\]]/', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $dir = rtrim(str_replace('\\', '/', dirname((string)($_SERVER['SCRIPT_NAME'] ?? '/'))), '/');
    return $scheme . '://' . $host . ($dir === '.' ? '' : $dir);
}

/* Adresses de retour acceptées : Claude (claude.ai, claude.com) et les outils qui tournent sur l'ordinateur (localhost). */
function oauth_redirect_allowed(string $uri): bool {
    $p = parse_url($uri);
    if (!$p || empty($p['scheme']) || empty($p['host']) || isset($p['fragment'])) return false;
    $host = strtolower($p['host']);
    if ($p['scheme'] === 'https' && in_array($host, ['claude.ai', 'claude.com', 'www.claude.ai', 'www.claude.com'], true)) return true;
    if ($p['scheme'] === 'http' && in_array($host, ['localhost', '127.0.0.1'], true)) return true;
    return false;
}

function oauth_client(string $id): ?array {
    oauth_schema();
    if (!preg_match('/^[a-f0-9]{32}$/', $id)) return null;
    $c = q('SELECT * FROM crm_oauth_clients WHERE client_id = ?', [$id])->fetch();
    if (!$c) return null;
    $c['redirect_uris'] = json_decode($c['redirect_uris'], true) ?: [];
    return $c;
}

function oauth_register(array $in): array {
    oauth_schema();
    $uris = array_values(array_filter((array)($in['redirect_uris'] ?? []), 'is_string'));
    if (!$uris) throw new InvalidArgumentException('redirect_uris manquant');
    foreach ($uris as $u) if (!oauth_redirect_allowed($u)) throw new InvalidArgumentException('Adresse de retour refusée : ' . $u);
    // Limite simple contre les enregistrements en masse
    if ((int)q('SELECT COUNT(*) FROM crm_oauth_clients WHERE created_at > ?', [gmdate('Y-m-d H:i:s', time() - 3600)])->fetchColumn() > 50)
        throw new InvalidArgumentException('Trop d\'enregistrements récents, réessayez plus tard.');
    $id = bin2hex(random_bytes(16));
    $name = mb_substr(trim((string)($in['client_name'] ?? 'Client MCP')), 0, 190);
    q('INSERT INTO crm_oauth_clients (client_id, name, redirect_uris, created_at) VALUES (?, ?, ?, ?)', [$id, $name, json_encode($uris), now_utc()]);
    return ['client_id' => $id, 'client_id_issued_at' => time(), 'client_name' => $name, 'redirect_uris' => $uris,
            'grant_types' => ['authorization_code', 'refresh_token'], 'response_types' => ['code'], 'token_endpoint_auth_method' => 'none'];
}

function oauth_issue_code(string $clientId, int $userId, string $redirect, string $challenge): string {
    oauth_schema();
    q('DELETE FROM crm_oauth_codes WHERE expires < ?', [now_utc()]);
    $code = bin2hex(random_bytes(32));
    q('INSERT INTO crm_oauth_codes (code_hash, client_id, user_id, redirect_uri, challenge, expires) VALUES (?, ?, ?, ?, ?, ?)',
      [hash('sha256', $code), $clientId, $userId, $redirect, $challenge, gmdate('Y-m-d H:i:s', time() + OAUTH_CODE_TTL)]);
    return $code;
}

function oauth_tokens_for(string $clientId, int $userId): array {
    oauth_schema();
    q('DELETE FROM crm_oauth_tokens WHERE expires < ?', [now_utc()]);
    $access = bin2hex(random_bytes(32)); $refresh = bin2hex(random_bytes(32)); $now = now_utc();
    q('INSERT INTO crm_oauth_tokens (token_hash, kind, client_id, user_id, expires, created_at) VALUES (?, \'access\', ?, ?, ?, ?)',
      [hash('sha256', $access), $clientId, $userId, gmdate('Y-m-d H:i:s', time() + OAUTH_ACCESS_TTL), $now]);
    q('INSERT INTO crm_oauth_tokens (token_hash, kind, client_id, user_id, expires, created_at) VALUES (?, \'refresh\', ?, ?, ?, ?)',
      [hash('sha256', $refresh), $clientId, $userId, gmdate('Y-m-d H:i:s', time() + OAUTH_REFRESH_TTL), $now]);
    return ['access_token' => $access, 'token_type' => 'Bearer', 'expires_in' => OAUTH_ACCESS_TTL, 'refresh_token' => $refresh, 'scope' => 'crm'];
}

/* Échange au point d'accès des jetons. Lève InvalidArgumentException avec le code d'erreur OAuth. */
function oauth_token_exchange(array $in): array {
    oauth_schema();
    $grant = (string)($in['grant_type'] ?? '');
    $client = oauth_client((string)($in['client_id'] ?? ''));
    if (!$client) throw new InvalidArgumentException('invalid_client');
    if ($grant === 'authorization_code') {
        $code = (string)($in['code'] ?? '');
        $row = q('SELECT * FROM crm_oauth_codes WHERE code_hash = ?', [hash('sha256', $code)])->fetch();
        if ($row) q('DELETE FROM crm_oauth_codes WHERE code_hash = ?', [$row['code_hash']]); // usage unique
        if (!$row || $row['expires'] < now_utc() || $row['client_id'] !== $client['client_id']) throw new InvalidArgumentException('invalid_grant');
        if ((string)($in['redirect_uri'] ?? '') !== $row['redirect_uri']) throw new InvalidArgumentException('invalid_grant');
        $verifier = (string)($in['code_verifier'] ?? '');
        $calc = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
        if ($verifier === '' || !hash_equals($row['challenge'], $calc)) throw new InvalidArgumentException('invalid_grant');
        if (!oauth_user_ok((int)$row['user_id'])) throw new InvalidArgumentException('invalid_grant');
        return oauth_tokens_for($client['client_id'], (int)$row['user_id']);
    }
    if ($grant === 'refresh_token') {
        $h = hash('sha256', (string)($in['refresh_token'] ?? ''));
        $row = q("SELECT * FROM crm_oauth_tokens WHERE token_hash = ? AND kind = 'refresh'", [$h])->fetch();
        if (!$row || $row['expires'] < now_utc() || $row['client_id'] !== $client['client_id'] || !oauth_user_ok((int)$row['user_id']))
            throw new InvalidArgumentException('invalid_grant');
        q('DELETE FROM crm_oauth_tokens WHERE token_hash = ?', [$h]); // rotation : l'ancien jeton ne sert qu'une fois
        return oauth_tokens_for($client['client_id'], (int)$row['user_id']);
    }
    throw new InvalidArgumentException('unsupported_grant_type');
}

function oauth_user_ok(int $id): bool {
    return (bool)q('SELECT 1 FROM users WHERE id = ? AND can_login = 1 AND active = 1', [$id])->fetchColumn();
}

/* Utilisateur du CRM correspondant au jeton « Bearer » de la requête, ou null. */
function oauth_bearer_user(): ?array {
    oauth_schema();
    $hdr = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($hdr === '' && function_exists('getallheaders')) { foreach (getallheaders() as $k => $v) if (strtolower($k) === 'authorization') $hdr = (string)$v; }
    if (!preg_match('/^Bearer\s+([a-f0-9]{64})$/i', trim($hdr), $m)) return null;
    $row = q("SELECT t.token_hash, t.client_id, t.last_used, u.id, u.name, u.email, u.role FROM crm_oauth_tokens t JOIN users u ON u.id = t.user_id
              WHERE t.token_hash = ? AND t.kind = 'access' AND t.expires > ? AND u.can_login = 1 AND u.active = 1", [hash('sha256', strtolower($m[1])), now_utc()])->fetch();
    if (!$row) return null;
    if (!$row['last_used'] || strtotime($row['last_used'] . ' UTC') < time() - 300) q('UPDATE crm_oauth_tokens SET last_used = ? WHERE token_hash = ?', [now_utc(), $row['token_hash']]);
    return ['id' => (int)$row['id'], 'name' => $row['name'], 'email' => $row['email'], 'role' => $row['role'], 'client_id' => $row['client_id']];
}

/* Connexions actives (jetons de renouvellement en cours) d'un utilisateur, pour les réglages. */
function oauth_connections(?int $userId = null): array {
    oauth_schema();
    $sql = "SELECT t.client_id, c.name AS client, t.user_id, u.name AS user, MIN(t.created_at) AS since, MAX(t.expires) AS until
            FROM crm_oauth_tokens t JOIN crm_oauth_clients c ON c.client_id = t.client_id JOIN users u ON u.id = t.user_id
            WHERE t.kind = 'refresh' AND t.expires > ?" . ($userId ? ' AND t.user_id = ?' : '') . ' GROUP BY t.client_id, c.name, t.user_id, u.name ORDER BY since DESC';
    return q($sql, $userId ? [now_utc(), $userId] : [now_utc()])->fetchAll();
}
function oauth_revoke(int $userId, string $clientId): void {
    oauth_schema();
    q('DELETE FROM crm_oauth_tokens WHERE user_id = ? AND client_id = ?', [$userId, $clientId]);
}
