<?php
// Rattachement des e-mails Microsoft 365 aux fiches du CRM.
// Chaque utilisateur connecte sa propre boîte (autorisation déléguée, lecture seule). Le CRM ne garde que les messages
// dont l'expéditeur ou un destinataire est une personne connue du CRM : objet, aperçu, date, adresses et lien vers Outlook.
declare(strict_types=1);

const MS_SCOPE = 'offline_access User.Read Mail.Read';
const MS_SELECT = 'id,internetMessageId,subject,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,webLink,isDraft,parentFolderId';

function mail_schema(): void {
    static $done = false;
    if ($done) return;
    q("CREATE TABLE IF NOT EXISTS crm_emails (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      msg_key CHAR(40) NOT NULL,
      user_id INT UNSIGNED NULL,
      direction ENUM('in','out') NOT NULL DEFAULT 'in',
      from_addr VARCHAR(255) NULL,
      to_addrs TEXT NULL,
      subject VARCHAR(500) NULL,
      preview TEXT NULL,
      sent_at DATETIME NOT NULL,
      person_id INT UNSIGNED NULL,
      org_id INT UNSIGNED NULL,
      deal_id INT UNSIGNED NULL,
      web_link TEXT NULL,
      UNIQUE KEY u_key (msg_key), KEY k_person (person_id), KEY k_org (org_id), KEY k_deal (deal_id), KEY k_sent (sent_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $done = true;
}

function ms_app(): ?array {
    $a = setting('ms_app');
    return (is_array($a) && !empty($a['tenant']) && !empty($a['client_id']) && !empty($a['secret'])) ? $a : null;
}
function ms_redirect_uri(): string {
    return 'https://' . ($_SERVER['HTTP_HOST'] ?? 'crm.360skillvue.com') . '/msauth.php';
}
function ms_tokens(): array {
    $t = setting('ms_tokens', []);
    return is_array($t) ? $t : [];
}
function ms_save_token(int $uid, array $data): void {
    $t = ms_tokens();
    $t[(string)$uid] = $data + (isset($t[(string)$uid]) && is_array($t[(string)$uid]) ? $t[(string)$uid] : []);
    set_setting('ms_tokens', (object)$t);
}
function ms_forget_token(int $uid): void {
    $t = ms_tokens();
    unset($t[(string)$uid]);
    set_setting('ms_tokens', (object)$t);
}

function ms_http(string $method, string $url, array $headers = [], ?string $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $raw = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) throw new RuntimeException('Connexion à Microsoft impossible : ' . $err);
    $j = json_decode((string)$raw, true);
    return [$code, is_array($j) ? $j : []];
}

function ms_token_request(array $fields): array {
    $app = ms_app();
    if (!$app) throw new RuntimeException("La connexion Microsoft n'est pas encore configurée.");
    $post = http_build_query($fields + ['client_id' => $app['client_id'], 'client_secret' => $app['secret'], 'scope' => MS_SCOPE]);
    [$code, $j] = ms_http('POST', 'https://login.microsoftonline.com/' . rawurlencode((string)$app['tenant']) . '/oauth2/v2.0/token',
        ['Content-Type: application/x-www-form-urlencoded'], $post);
    if ($code !== 200 || empty($j['access_token'])) {
        $why = (string)($j['error_description'] ?? $j['error'] ?? ('code ' . $code));
        throw new RuntimeException('Microsoft a refusé la connexion : ' . mb_substr($why, 0, 300));
    }
    return $j;
}

/* Adresse où envoyer l'utilisateur pour qu'il autorise la lecture de sa boîte. */
function ms_authorize_url(string $state): string {
    $app = ms_app();
    if (!$app) throw new RuntimeException("La connexion Microsoft n'est pas encore configurée.");
    return 'https://login.microsoftonline.com/' . rawurlencode((string)$app['tenant']) . '/oauth2/v2.0/authorize?' . http_build_query([
        'client_id' => $app['client_id'], 'response_type' => 'code', 'redirect_uri' => ms_redirect_uri(), 'response_mode' => 'query',
        'scope' => MS_SCOPE, 'state' => $state, 'prompt' => 'select_account']);
}

/* Fin de l'autorisation : échange le code contre un jeton et retient la boîte de l'utilisateur. */
function ms_connect(int $uid, string $code): string {
    $j = ms_token_request(['grant_type' => 'authorization_code', 'code' => $code, 'redirect_uri' => ms_redirect_uri()]);
    if (empty($j['refresh_token'])) throw new RuntimeException("Microsoft n'a pas fourni d'autorisation durable : vérifiez la permission offline_access.");
    [$c, $me] = ms_http('GET', 'https://graph.microsoft.com/v1.0/me?%24select=mail,userPrincipalName', ['Authorization: Bearer ' . $j['access_token']]);
    if ($c !== 200) throw new RuntimeException('Lecture du profil Microsoft impossible (code ' . $c . ').');
    $email = strtolower(trim((string)($me['mail'] ?? '') ?: (string)($me['userPrincipalName'] ?? '')));
    ms_save_token($uid, ['refresh' => $j['refresh_token'], 'email' => $email, 'connected_at' => now_utc(), 'last_sync' => null]);
    return $email;
}

/* Domaines internes (ceux de l'équipe et des boîtes connectées) : leurs adresses ne comptent jamais comme des contacts. */
function mail_internal_domains(): array {
    $d = [];
    $add = function ($email) use (&$d) { $p = strrchr(strtolower(trim((string)$email)), '@'); if ($p !== false && strlen($p) > 1) $d[substr($p, 1)] = true; };
    foreach (q("SELECT email FROM users WHERE email IS NOT NULL AND email <> ''")->fetchAll() as $u) $add($u['email']);
    foreach (ms_tokens() as $t) if (is_array($t)) $add($t['email'] ?? '');
    foreach ((array)setting('mail_internal_domains', []) as $x) if (is_string($x) && $x !== '') $d[strtolower($x)] = true;
    return $d;
}

/* Adresse e-mail (en minuscules) vers [identifiant de la personne, identifiant de son organisation]. */
function mail_person_map(): array {
    $m = [];
    $internal = mail_internal_domains();
    foreach (q("SELECT id, org_id, emails FROM persons WHERE emails IS NOT NULL AND emails <> '' AND emails <> '[]'")->fetchAll() as $p) {
        $list = json_decode((string)$p['emails'], true);
        if (!is_array($list)) continue;
        foreach ($list as $e) {
            $a = strtolower(trim((string)(is_array($e) ? ($e['value'] ?? '') : $e)));
            $dom = strrchr($a, '@');
            if ($a === '' || $dom === false || isset($internal[substr($dom, 1)])) continue;
            if (!isset($m[$a])) $m[$a] = [(int)$p['id'], $p['org_id'] === null ? null : (int)$p['org_id']];
        }
    }
    return $m;
}

/* Récupère les nouveaux messages de la boîte d'un utilisateur et rattache ceux qui concernent un contact du CRM. */
function mail_sync_user(int $uid, ?array $map = null, bool $full = false): array {
    mail_schema();
    $all = ms_tokens();
    $t = $all[(string)$uid] ?? null;
    if (!is_array($t) || empty($t['refresh'])) throw new RuntimeException("Cette boîte n'est pas connectée à Microsoft.");
    $j = ms_token_request(['grant_type' => 'refresh_token', 'refresh_token' => $t['refresh']]);
    if (!empty($j['refresh_token'])) ms_save_token($uid, ['refresh' => $j['refresh_token']]);
    if ($map === null) $map = mail_person_map();
    // Relecture complète : on repart de zéro pour cette boîte (les e-mails ne sont qu'une copie de ce qui est dans Outlook).
    if ($full) q('DELETE FROM crm_emails WHERE user_id = ?', [$uid]);
    $own = strtolower((string)($t['email'] ?? ''));
    $sinceTs = (!$full && !empty($t['last_sync'])) ? (strtotime($t['last_sync'] . ' UTC') - 3600) : (time() - 60 * 86400);
    $since = gmdate('Y-m-d\TH:i:s\Z', $sinceTs);
    $started = now_utc();
    // Dossier « Éléments envoyés » : sert à reconnaître les messages envoyés, quelle que soit l'adresse d'expédition utilisée (alias).
    [$fc, $fd] = ms_http('GET', 'https://graph.microsoft.com/v1.0/me/mailFolders/sentitems?%24select=id', ['Authorization: Bearer ' . $j['access_token']]);
    $sentId = $fc === 200 ? (string)($fd['id'] ?? '') : '';
    $url = 'https://graph.microsoft.com/v1.0/me/messages?%24select=' . MS_SELECT
        . '&%24filter=' . rawurlencode('receivedDateTime ge ' . $since) . '&%24orderby=' . rawurlencode('receivedDateTime asc') . '&%24top=100';
    $addr = fn($x) => strtolower(trim((string)(is_array($x) ? ($x['emailAddress']['address'] ?? '') : '')));
    $seen = 0; $kept = 0; $pages = 0; $lastDt = null;
    while ($url && $pages < 40) {
        $pages++;
        [$code, $r] = ms_http('GET', $url, ['Authorization: Bearer ' . $j['access_token']]);
        if ($code !== 200) throw new RuntimeException('Lecture de la boîte impossible (code ' . $code . ') : ' . mb_substr((string)($r['error']['message'] ?? ''), 0, 200));
        foreach ($r['value'] ?? [] as $m) {
            $seen++;
            $ts = strtotime((string)($m['receivedDateTime'] ?? '')) ?: time();
            $lastDt = gmdate('Y-m-d H:i:s', $ts);
            if (!empty($m['isDraft'])) continue;
            $from = $addr($m['from'] ?? null);
            $tos = array_values(array_filter(array_map($addr, array_merge((array)($m['toRecipients'] ?? []), (array)($m['ccRecipients'] ?? [])))));
            $dir = (($sentId !== '' && (string)($m['parentFolderId'] ?? '') === $sentId) || ($own !== '' && $from === $own)) ? 'out' : 'in';
            $cands = $dir === 'out' ? $tos : array_merge([$from], $tos);
            $hit = null;
            foreach ($cands as $a) { if ($a !== '' && isset($map[$a])) { $hit = $map[$a]; break; } }
            if (!$hit) continue;
            [$pid, $oid] = $hit;
            if ($oid !== null) $deal = q("SELECT id FROM deals WHERE status = 'open' AND (person_id = ? OR org_id = ?) ORDER BY update_time DESC LIMIT 1", [$pid, $oid])->fetchColumn();
            else $deal = q("SELECT id FROM deals WHERE status = 'open' AND person_id = ? ORDER BY update_time DESC LIMIT 1", [$pid])->fetchColumn();
            $key = sha1((string)(($m['internetMessageId'] ?? '') ?: ($m['id'] ?? uniqid('', true))));
            $st = q('INSERT IGNORE INTO crm_emails (msg_key, user_id, direction, from_addr, to_addrs, subject, preview, sent_at, person_id, org_id, deal_id, web_link)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$key, $uid, $dir, mb_substr($from, 0, 255), mb_substr(implode(', ', $tos), 0, 2000), mb_substr((string)($m['subject'] ?? ''), 0, 500),
                 mb_substr((string)($m['bodyPreview'] ?? ''), 0, 1000), gmdate('Y-m-d H:i:s', $ts), $pid, $oid, $deal ? (int)$deal : null, mb_substr((string)($m['webLink'] ?? ''), 0, 2000)]);
            $kept += $st->rowCount();
        }
        $url = isset($r['@odata.nextLink']) ? (string)$r['@odata.nextLink'] : null;
    }
    // S'il reste des pages, on reprendra au dernier message lu ; sinon à l'heure de début de cette synchronisation.
    $total = (int)q('SELECT COUNT(*) FROM crm_emails')->fetchColumn();
    $res = ['lus' => $seen, 'rattaches' => $kept, 'reste' => $url ? true : false, 'total' => $total, 'contacts' => count($map)];
    ms_save_token($uid, ['last_sync' => ($url && $lastDt) ? $lastDt : $started, 'last_result' => $res]);
    return $res;
}

/* Toutes les boîtes connectées (tâche planifiée). Renvoie une ligne de compte rendu par boîte. */
function mail_sync_all(): array {
    $out = [];
    $map = null;
    foreach (ms_tokens() as $uid => $t) {
        if (!is_array($t) || empty($t['refresh'])) continue;
        try {
            if ($map === null) $map = mail_person_map();
            $r = mail_sync_user((int)$uid, $map);
            $out[] = 'E-mails ' . ($t['email'] ?? $uid) . ' : ' . $r['lus'] . ' lus, ' . $r['rattaches'] . ' rattachés';
        } catch (Throwable $e) {
            $out[] = 'E-mails ' . ($t['email'] ?? $uid) . ' : échec, ' . $e->getMessage();
        }
    }
    return $out;
}

/* E-mails d'une fiche. Pour une affaire : ceux rattachés à l'affaire et ceux de sa personne. */
function mail_list(string $kind, int $id): array {
    mail_schema();
    $sql = 'SELECT e.id, e.direction, e.from_addr, e.to_addrs, e.subject, e.preview, e.sent_at, e.web_link, p.name AS person_name
            FROM crm_emails e LEFT JOIN persons p ON p.id = e.person_id WHERE ';
    if ($kind === 'deal') {
        $pid = q('SELECT person_id FROM deals WHERE id = ?', [$id])->fetchColumn();
        if ($pid) { $sql .= '(e.deal_id = ? OR e.person_id = ?)'; $args = [$id, (int)$pid]; }
        else { $sql .= 'e.deal_id = ?'; $args = [$id]; }
    } elseif ($kind === 'org') { $sql .= 'e.org_id = ?'; $args = [$id]; }
    else { $sql .= 'e.person_id = ?'; $args = [$id]; }
    $rows = q($sql . ' ORDER BY e.sent_at DESC LIMIT 200', $args)->fetchAll();
    foreach ($rows as &$r) { $r['id'] = (string)$r['id']; $r['sent_at'] = str_replace(' ', 'T', (string)$r['sent_at']) . 'Z'; }
    unset($r);
    return $rows;
}

/* État de la connexion, pour l'écran Réglages. Le secret n'est jamais renvoyé. */
function mail_status(array $me): array {
    $a = setting('ms_app');
    $a = is_array($a) ? $a : [];
    $tokens = ms_tokens();
    $mine = $tokens[(string)$me['id']] ?? null;
    $boxes = [];
    if ($me['role'] === 'admin' && $tokens) {
        $names = [];
        foreach (q('SELECT id, name FROM users')->fetchAll() as $u) $names[(string)$u['id']] = $u['name'];
        foreach ($tokens as $uid => $t) if (is_array($t) && !empty($t['refresh'])) $boxes[] = ['name' => $names[(string)$uid] ?? '', 'email' => $t['email'] ?? '', 'last_sync' => $t['last_sync'] ?? null];
    }
    return [
        'configured' => ms_app() !== null,
        'tenant' => $me['role'] === 'admin' ? ($a['tenant'] ?? '') : '',
        'client_id' => $me['role'] === 'admin' ? ($a['client_id'] ?? '') : '',
        'redirect_uri' => ms_redirect_uri(),
        'mine' => (is_array($mine) && !empty($mine['refresh'])) ? ['email' => $mine['email'] ?? '', 'last_sync' => $mine['last_sync'] ?? null, 'last_result' => $mine['last_result'] ?? null] : null,
        'boxes' => $boxes,
    ];
}
