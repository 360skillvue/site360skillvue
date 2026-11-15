<?php
// Calendly vers CRM : les rendez-vous commerciaux pris en ligne deviennent des activités « Réunion ».
// Seuls les types de rendez-vous cochés dans les Réglages sont repris : ni les classes virtuelles, ni les téléconsultations.
// Lecture seule : rien n'est modifié dans Calendly.
declare(strict_types=1);

const CAL_DEFAULT_NAMES = ['ScanUp - Laure Dellamonica', 'Biologie e-learning/ScanUp', 'Présentation ScanUp', 'Point ScanUp', 'Échange découverte – ScanUp'];
// Rendez-vous pris sur un compte partagé : à qui les attribuer dans le CRM.
const CAL_OWNER_MAP = ['hello@360skillvue.com' => 'maxime.bailloud@360skillvue.ch'];

function cal_conf(): array {
    $c = setting('calendly');
    $c = is_array($c) ? $c : [];
    $names = array_key_exists('names', $c) && is_array($c['names']) ? array_values(array_filter(array_map(fn($n) => trim((string)$n), $c['names']), fn($n) => $n !== '')) : CAL_DEFAULT_NAMES;
    return ['token' => (string)($c['token'] ?? ''), 'names' => $names, 'last' => $c['last'] ?? null];
}

/* Ce que le navigateur a le droit de voir : jamais la clé. */
function cal_public(): array {
    $c = cal_conf();
    // La longueur de la clé (jamais la clé) aide à repérer un collage incomplet ou en double.
    return ['configured' => $c['token'] !== '', 'len' => strlen($c['token']), 'names' => $c['names'], 'last' => $c['last']];
}

function cal_save(array $patch): void {
    $c = setting('calendly');
    $c = is_array($c) ? $c : [];
    set_setting('calendly', $patch + $c);
}

function cal_schema(): void {
    static $done = false;
    if ($done) return;
    q('CREATE TABLE IF NOT EXISTS crm_calendly (uuid VARCHAR(64) NOT NULL PRIMARY KEY, activity_id BIGINT NULL, canceled TINYINT NOT NULL DEFAULT 0, at DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    $done = true;
}

function cal_request(string $pathOrUrl, array $params = []): array {
    $token = cal_conf()['token'];
    if ($token === '') throw new RuntimeException("La clé d'accès Calendly n'est pas renseignée.");
    $url = (str_starts_with($pathOrUrl, 'https://api.calendly.com/') ? $pathOrUrl : 'https://api.calendly.com' . $pathOrUrl) . ($params ? '?' . http_build_query($params) : '');
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 40, CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_USERAGENT => 'crm-sync/1.0',
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/json', 'Authorization: Bearer ' . $token]]);
    $raw = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) throw new RuntimeException('Calendly injoignable : ' . $err);
    $j = json_decode((string)$raw, true);
    if ($code === 401 || $code === 403) {
        // Détail utile au diagnostic : code de la réponse, message de Calendly, forme de la clé (jamais la clé elle-même).
        $why = is_array($j) ? trim((string)($j['title'] ?? '') . ' ' . (string)($j['message'] ?? '')) : mb_substr(trim(strip_tags((string)$raw)), 0, 120);
        throw new RuntimeException("Calendly a refusé la clé d'accès (réponse $code" . ($why !== '' ? ' : ' . mb_substr($why, 0, 200) : '') . ' ; clé de ' . strlen($token) . ' caractères, ' . substr_count($token, '.') . ' points).');
    }
    if ($code >= 400 || !is_array($j)) throw new RuntimeException('Erreur Calendly ' . $code . (is_array($j) && !empty($j['message']) ? ' : ' . mb_substr((string)$j['message'], 0, 200) : ''));
    return $j;
}

/* Compte connecté : adresse de l'utilisateur et de son organisation Calendly. */
function cal_me(): array {
    $r = cal_request('/users/me')['resource'] ?? [];
    if (empty($r['uri'])) throw new RuntimeException('Réponse inattendue de Calendly.');
    return ['user' => (string)$r['uri'], 'org' => (string)($r['current_organization'] ?? ''), 'name' => (string)($r['name'] ?? '')];
}

/* Noms des types de rendez-vous actifs, pour les cases à cocher des Réglages. */
function cal_type_names(): array {
    $me = cal_me();
    $params = ['count' => 100, 'active' => 'true'] + ($me['org'] !== '' ? ['organization' => $me['org']] : ['user' => $me['user']]);
    try { $r = cal_request('/event_types', $params); }
    catch (RuntimeException $e) { $r = cal_request('/event_types', ['count' => 100, 'active' => 'true', 'user' => $me['user']]); }
    $out = [];
    foreach ($r['collection'] ?? [] as $t) { $n = trim((string)($t['name'] ?? '')); if ($n !== '') $out[$n] = (string)($t['profile']['name'] ?? ''); }
    ksort($out);
    return array_map(fn($n, $who) => ['name' => (string)$n, 'who' => $who], array_keys($out), array_values($out));
}

function cal_owner_id(string $hostEmail): ?int {
    $hostEmail = strtolower(trim($hostEmail));
    $target = CAL_OWNER_MAP[$hostEmail] ?? $hostEmail;
    $id = $target !== '' ? q('SELECT id FROM users WHERE LOWER(email) = ? AND active = 1', [$target])->fetchColumn() : false;
    if (!$id) $id = q("SELECT id FROM users WHERE role = 'admin' AND active = 1 ORDER BY id LIMIT 1")->fetchColumn();
    return $id ? (int)$id : null;
}

/* Lit les rendez-vous récents et à venir, et crée ou annule les activités correspondantes. */
function cal_sync(): array {
    cal_schema();
    $c = cal_conf();
    if ($c['token'] === '') throw new RuntimeException("Calendly n'est pas encore configuré.");
    $allowed = array_flip(array_map('mb_strtolower', $c['names']));
    if (!$allowed) return ['lignes' => ['Aucun type de rendez-vous suivi.'], 'crees' => 0, 'annules' => 0];
    $me = cal_me();
    $scope = $me['org'] !== '' ? ['organization' => $me['org']] : ['user' => $me['user']];
    $now = now_utc();
    $paris = new DateTimeZone('Europe/Paris');
    $created = 0; $canceled = 0; $newPersons = 0; $seenEvents = 0;
    $url = '/scheduled_events';
    $params = ['count' => 100, 'min_start_time' => gmdate('Y-m-d\TH:i:s\Z', time() - 86400), 'sort' => 'start_time:asc'] + $scope;
    for ($page = 0; $page < 5 && $url; $page++) {
        try { $r = cal_request($url, $params); }
        catch (RuntimeException $e) {
            // Compte sans droit d'administration sur l'organisation : on se limite aux rendez-vous de l'utilisateur.
            if ($page === 0 && isset($params['organization'])) { unset($params['organization']); $params['user'] = $me['user']; $r = cal_request($url, $params); }
            else throw $e;
        }
        foreach ($r['collection'] ?? [] as $ev) {
            $name = trim((string)($ev['name'] ?? ''));
            if (!isset($allowed[mb_strtolower($name)])) continue;
            $seenEvents++;
            $uuid = basename((string)($ev['uri'] ?? ''));
            if ($uuid === '' || strlen($uuid) > 64) continue;
            $known = q('SELECT activity_id, canceled FROM crm_calendly WHERE uuid = ?', [$uuid])->fetch();
            $isCanceled = ($ev['status'] ?? '') === 'canceled';
            if ($known) {
                if ($isCanceled && !(int)$known['canceled']) {
                    if ($known['activity_id']) q("UPDATE activities SET subject = CONCAT('Annulé : ', subject), done = 1, done_time = ?, update_time = ? WHERE id = ? AND done = 0", [$now, $now, (int)$known['activity_id']]);
                    q('UPDATE crm_calendly SET canceled = 1 WHERE uuid = ?', [$uuid]);
                    $canceled++;
                }
                continue;
            }
            if ($isCanceled) continue;

            // Invités du rendez-vous : le premier encore inscrit devient la personne de l'activité.
            $inv = cal_request('/scheduled_events/' . rawurlencode($uuid) . '/invitees', ['count' => 50])['collection'] ?? [];
            $inv = array_values(array_filter($inv, fn($i) => ($i['status'] ?? 'active') === 'active'));
            if (!$inv) continue;
            $first = $inv[0];
            $email = strtolower(trim((string)($first['email'] ?? '')));
            $pname = trim((string)($first['name'] ?? '')) ?: $email;
            $company = ''; $phone = trim((string)($first['text_reminder_number'] ?? '')); $answers = [];
            foreach ((array)($first['questions_and_answers'] ?? []) as $qa) {
                $qq = trim((string)($qa['question'] ?? '')); $aa = trim((string)($qa['answer'] ?? ''));
                if ($aa === '') continue;
                $answers[] = $qq . ' ' . $aa;
                $low = mb_strtolower($qq);
                if ($company === '' && str_contains($low, 'entreprise')) $company = mb_substr($aa, 0, 255);
                if ($phone === '' && (str_contains($low, 'téléphone') || str_contains($low, 'telephone'))) $phone = mb_substr($aa, 0, 40);
            }

            $pid = null; $oid = null;
            if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $like = '%"' . addcslashes($email, '%_\\') . '"%';
                $p = q('SELECT id, org_id FROM persons WHERE LOWER(emails) LIKE ? ORDER BY id LIMIT 1', [$like])->fetch();
                if ($p) { $pid = (int)$p['id']; $oid = $p['org_id'] ? (int)$p['org_id'] : null; }
                else {
                    if ($company !== '') {
                        $oid = q('SELECT id FROM orgs WHERE name = ? ORDER BY id LIMIT 1', [$company])->fetchColumn();
                        if (!$oid) { q('INSERT INTO orgs (name, add_time, update_time) VALUES (?, ?, ?)', [$company, $now, $now]); $oid = db()->lastInsertId(); }
                        $oid = (int)$oid;
                    }
                    $fn = trim((string)($first['first_name'] ?? '')); $ln = trim((string)($first['last_name'] ?? ''));
                    if ($fn === '' && $ln === '' && str_contains($pname, ' ')) { $fn = strtok($pname, ' '); $ln = trim(substr($pname, strlen($fn))); }
                    q('INSERT INTO persons (name, first_name, last_name, org_id, emails, phones, add_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [mb_substr($pname, 0, 255), $fn !== '' ? mb_substr($fn, 0, 190) : null, $ln !== '' ? mb_substr($ln, 0, 190) : null, $oid,
                         json_encode([['value' => $email, 'label' => null, 'primary' => true]], JSON_UNESCAPED_UNICODE),
                         $phone !== '' ? json_encode([['value' => $phone, 'label' => null, 'primary' => true]], JSON_UNESCAPED_UNICODE) : '[]', $now, $now]);
                    $pid = (int)db()->lastInsertId();
                    $newPersons++;
                }
            }
            // Affaire en cours de la personne, sinon de son organisation. Aucune affaire n'est créée ici.
            $deal = null;
            if ($pid) $deal = q("SELECT id FROM deals WHERE status = 'open' AND person_id = ? ORDER BY update_time DESC LIMIT 1", [$pid])->fetchColumn() ?: null;
            if (!$deal && $oid) $deal = q("SELECT id FROM deals WHERE status = 'open' AND org_id = ? ORDER BY update_time DESC LIMIT 1", [$oid])->fetchColumn() ?: null;

            $start = new DateTime((string)$ev['start_time']); $end = new DateTime((string)($ev['end_time'] ?? $ev['start_time']));
            $duration = max(0, (int)round(($end->getTimestamp() - $start->getTimestamp()) / 60));
            $start->setTimezone($paris);
            $host = (string)($ev['event_memberships'][0]['user_email'] ?? '');
            $join = (string)($ev['location']['join_url'] ?? '');
            $note = "Rendez-vous pris sur Calendly.\n" . ($join !== '' ? "Lien de la visio : $join\n" : '')
                . ($answers ? implode("\n", $answers) . "\n" : '')
                . (count($inv) > 1 ? 'Autres inscrits : ' . implode(', ', array_map(fn($i) => trim((string)($i['name'] ?? '')) . ' (' . (string)($i['email'] ?? '') . ')', array_slice($inv, 1))) . "\n" : '')
                . ((array)($ev['event_guests'] ?? []) ? 'Invités en copie : ' . implode(', ', array_map(fn($g) => (string)($g['email'] ?? ''), (array)$ev['event_guests'])) . "\n" : '');
            $ownerId = cal_owner_id($host);
            q('INSERT INTO activities (type, subject, due_date, due_time, duration, done, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)',
                ['meeting', mb_substr($name . ' : ' . $pname . ($company !== '' ? ' (' . $company . ')' : ''), 0, 500), $start->format('Y-m-d'), $start->format('H:i'), $duration ?: null,
                 $ownerId, $deal ? (int)$deal : null, $pid, $oid, mb_substr(trim($note), 0, 5000), $now, $now]);
            q('INSERT INTO crm_calendly (uuid, activity_id, canceled, at) VALUES (?, ?, 0, ?)', [$uuid, (int)db()->lastInsertId(), $now]);
            $created++;
        }
        $url = (string)($r['pagination']['next_page'] ?? '');
        $params = [];
    }
    $res = ['lignes' => [$seenEvents . ' rendez-vous suivis lus, ' . $created . ' activités créées, ' . $newPersons . ' personnes créées, ' . $canceled . ' annulations'],
        'crees' => $created, 'annules' => $canceled, 'personnes' => $newPersons, 'at' => $now];
    cal_save(['last' => $res]);
    return $res;
}
