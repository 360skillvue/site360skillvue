<?php
// Import depuis l'API Pipedrive, découpé en étapes courtes (une page de 500 fiches par appel)
// pour rester sous la limite de temps d'exécution de l'hébergement mutualisé.
declare(strict_types=1);

function pd_request(string $path, array $params = []): array {
    $c = crm_config();
    $token = $c['pipedrive_token'] ?? '';
    if ($token === '') throw new RuntimeException('Aucun jeton Pipedrive : ajoutez pipedrive_token dans config.php.');
    $base = rtrim($c['pipedrive_base'] ?? 'https://api.pipedrive.com', '/');
    $url = $base . $path . ($params ? '?' . http_build_query($params) : '');
    for ($try = 0; ; $try++) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 40, CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_HTTPHEADER => ['x-api-token: ' . $token, 'Accept: application/json']]);
        $body = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $cerr = curl_error($ch); curl_close($ch);
        if ($body === false) { if ($try < 2) { sleep(2); continue; } throw new RuntimeException('Pipedrive injoignable : ' . $cerr); }
        if ($code === 429 && $try < 4) { sleep(2 + $try * 2); continue; }
        if ($code === 401) throw new RuntimeException('Jeton Pipedrive refusé : vérifiez pipedrive_token dans config.php.');
        if ($code >= 400) { if ($code >= 500 && $try < 2) { sleep(2); continue; } throw new RuntimeException("Erreur Pipedrive $code sur $path"); }
        $j = json_decode($body, true);
        if (!is_array($j)) throw new RuntimeException('Réponse Pipedrive illisible.');
        return $j;
    }
}

function pd_time(?string $t): ?string {
    if (!$t) return null;
    $ts = strtotime($t);
    return $ts ? gmdate('Y-m-d H:i:s', $ts) : null;
}

function pd_custom($v): ?string {
    if ($v === null || $v === '') return null;
    if (is_array($v)) {
        if (array_is_list($v)) { $xs = array_filter(array_map('pd_custom', $v), fn($x) => $x !== null && $x !== ''); return $xs ? implode(', ', $xs) : null; }
        if (isset($v['label'])) return (string)$v['label'];
        if (isset($v['formatted_address'])) return (string)$v['formatted_address'];
        if (isset($v['value'])) return $v['value'] === null ? null : (isset($v['currency']) ? $v['value'] . ' ' . $v['currency'] : (string)$v['value']);
        if (isset($v['name'])) return (string)$v['name'];
        return null;
    }
    if (is_bool($v)) return $v ? 'oui' : 'non';
    return (string)$v;
}
function pd_extra(?array $cf): ?string {
    $out = [];
    foreach ($cf ?? [] as $k => $v) { $s = pd_custom($v); if ($s !== null) $out[$k] = $s; }
    return $out ? json_encode($out, JSON_UNESCAPED_UNICODE) : null;
}

function html_to_text(?string $h): string {
    if (!$h) return '';
    $s = preg_replace(['~<br\s*/?>~i', '~</(div|p|li|h\d)>~i', '~<li[^>]*>~i'], ["\n", "\n", '• '], $h);
    $s = html_entity_decode(strip_tags($s), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $s = str_replace("\u{00a0}", ' ', $s);
    return trim(preg_replace("~\n{3,}~", "\n\n", $s));
}

/* Table de correspondance identifiant Pipedrive vers identifiant local. */
function pd_map(string $table, bool $reset = false): array {
    static $m = [];
    if ($reset || !isset($m[$table])) {
        $m[$table] = [];
        foreach (q("SELECT pd_id, id FROM `$table` WHERE pd_id IS NOT NULL")->fetchAll() as $r) $m[$table][(int)$r['pd_id']] = (int)$r['id'];
    }
    return $m[$table];
}
function pd_local(string $table, $pdId): ?int {
    if (!$pdId) return null;
    return pd_map($table)[(int)$pdId] ?? null;
}

/* Insertion ou mise à jour en lot, clé d'unicité : pd_id. Les colonnes absentes de $update ne sont jamais écrasées. */
function upsert_rows(string $table, array $rows, array $update): void {
    if (!$rows) return;
    $cols = array_keys($rows[0]);
    $ph = '(' . implode(',', array_fill(0, count($cols), '?')) . ')';
    foreach (array_chunk($rows, 200) as $chunk) {
        $sql = "INSERT INTO `$table` (`" . implode('`,`', $cols) . "`) VALUES " . implode(',', array_fill(0, count($chunk), $ph))
             . ' ON DUPLICATE KEY UPDATE ' . implode(',', array_map(fn($c) => "`$c`=VALUES(`$c`)", $update));
        $p = [];
        foreach ($chunk as $r) foreach ($cols as $c) $p[] = $r[$c];
        q($sql, $p);
    }
}

function import_meta(): array {
    // Équipe
    $n = 0;
    foreach ((pd_request('/api/v1/users')['data'] ?? []) as $u) {
        $email = isset($u['email']) ? strtolower((string)$u['email']) : null;
        $id = q('SELECT id FROM users WHERE pd_id = ?', [$u['id']])->fetchColumn();
        if (!$id && $email) $id = q('SELECT id FROM users WHERE email = ?', [$email])->fetchColumn();
        if ($id) q('UPDATE users SET pd_id = ?, active = ? WHERE id = ?', [$u['id'], !empty($u['active_flag']) ? 1 : 0, $id]);
        else q('INSERT INTO users (name, email, role, can_login, active, pd_id, created_at) VALUES (?, ?, \'user\', 0, ?, ?, ?)',
               [$u['name'] ?: 'Sans nom', $email, !empty($u['active_flag']) ? 1 : 0, $u['id'], now_utc()]);
        $n++;
    }
    pd_map('users', true);
    // Pipelines et étapes
    $pipes = pd_request('/api/v2/pipelines', ['limit' => 500])['data'] ?? [];
    upsert_rows('pipelines', array_map(fn($p) => ['name' => trim((string)$p['name']), 'position' => (int)($p['order_nr'] ?? 0), 'pd_id' => $p['id']], $pipes), ['name', 'position']);
    pd_map('pipelines', true);
    $stages = pd_request('/api/v2/stages', ['limit' => 500])['data'] ?? [];
    upsert_rows('stages', array_values(array_filter(array_map(fn($s) => pd_local('pipelines', $s['pipeline_id']) ? ['pipeline_id' => pd_local('pipelines', $s['pipeline_id']), 'name' => trim((string)$s['name']),
        'position' => (int)($s['order_nr'] ?? 0), 'pd_id' => $s['id']] : null, $stages))), ['pipeline_id', 'name', 'position']);
    pd_map('stages', true);
    // Champs personnalisés
    foreach (['deal' => 'dealFields', 'org' => 'organizationFields', 'person' => 'personFields'] as $entity => $ep) {
        $start = 0; $pos = 0;
        do {
            $r = pd_request("/api/v1/$ep", ['start' => $start, 'limit' => 500]);
            foreach ($r['data'] ?? [] as $f) {
                if (!preg_match('/^[0-9a-f]{40}$/', (string)($f['key'] ?? ''))) continue;
                $opts = array_values(array_filter(array_map(fn($o) => $o['label'] ?? null, $f['options'] ?? [])));
                q('INSERT INTO fields (entity, fkey, label, type, options, position) VALUES (?, ?, ?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE label = VALUES(label), type = VALUES(type), options = VALUES(options), position = VALUES(position)',
                  [$entity, $f['key'], $f['name'], $f['field_type'] ?? 'varchar', $opts ? json_encode($opts, JSON_UNESCAPED_UNICODE) : null, $pos++]);
            }
            $pg = $r['additional_data']['pagination'] ?? [];
            $start = !empty($pg['more_items_in_collection']) ? (int)$pg['next_start'] : -1;
        } while ($start >= 0);
    }
    return ['équipe' => $n, 'pipelines' => count($pipes), 'étapes' => count($stages)];
}

function import_page(string $step, ?string $cursor, ?string $since): array {
    $ep = ['orgs' => 'organizations', 'persons' => 'persons', 'deals' => 'deals', 'activities' => 'activities'][$step];
    $params = ['limit' => 500];
    if ($step !== 'activities') $params['include_option_labels'] = 'true';
    if ($cursor) $params['cursor'] = $cursor;
    if ($since) $params['updated_since'] = gmdate('Y-m-d\TH:i:s\Z', strtotime($since . ' UTC'));
    $r = pd_request("/api/v2/$ep", $params);
    $data = $r['data'] ?? [];
    $now = now_utc(); $rows = [];
    $own = fn($x) => pd_local('users', $x);
    if ($step === 'orgs') {
        foreach ($data as $o) $rows[] = ['name' => mb_substr((string)($o['name'] ?: 'Sans nom'), 0, 255), 'address' => mb_substr((string)($o['address']['value'] ?? $o['address']['formatted_address'] ?? ''), 0, 500) ?: null,
            'website' => $o['website'] ?? null, 'owner_id' => $own($o['owner_id'] ?? null), 'extra' => pd_extra($o['custom_fields'] ?? null), 'pd_id' => $o['id'],
            'add_time' => pd_time($o['add_time'] ?? null) ?? $now, 'update_time' => pd_time($o['update_time'] ?? null) ?? $now];
        upsert_rows('orgs', $rows, ['name', 'address', 'website', 'owner_id', 'extra', 'update_time']);
        pd_map('orgs', true);
    } elseif ($step === 'persons') {
        $clean = fn($xs) => json_encode(array_values(array_map(fn($x) => ['value' => $x['value'], 'label' => $x['label'] ?? null, 'primary' => !empty($x['primary'])],
            array_filter($xs ?? [], fn($x) => !empty($x['value'])))), JSON_UNESCAPED_UNICODE);
        foreach ($data as $p) $rows[] = ['name' => mb_substr((string)($p['name'] ?: 'Sans nom'), 0, 255), 'first_name' => $p['first_name'] ?? null, 'last_name' => $p['last_name'] ?? null,
            'org_id' => pd_local('orgs', $p['org_id'] ?? null), 'emails' => $clean($p['emails'] ?? []), 'phones' => $clean($p['phones'] ?? []), 'owner_id' => $own($p['owner_id'] ?? null),
            'extra' => pd_extra($p['custom_fields'] ?? null), 'pd_id' => $p['id'], 'add_time' => pd_time($p['add_time'] ?? null) ?? $now, 'update_time' => pd_time($p['update_time'] ?? null) ?? $now];
        upsert_rows('persons', $rows, ['name', 'first_name', 'last_name', 'org_id', 'emails', 'phones', 'owner_id', 'extra', 'update_time']);
        pd_map('persons', true);
    } elseif ($step === 'deals') {
        foreach ($data as $d) {
            if (!empty($d['is_deleted'])) continue;
            $rows[] = ['title' => mb_substr((string)($d['title'] ?: 'Sans titre'), 0, 255), 'value' => (float)($d['value'] ?? 0), 'currency' => $d['currency'] ?? 'EUR',
                'pipeline_id' => pd_local('pipelines', $d['pipeline_id'] ?? null), 'stage_id' => pd_local('stages', $d['stage_id'] ?? null),
                'status' => in_array($d['status'] ?? '', ['open', 'won', 'lost'], true) ? $d['status'] : 'open', 'lost_reason' => $d['lost_reason'] ?? null,
                'owner_id' => $own($d['owner_id'] ?? null), 'org_id' => pd_local('orgs', $d['org_id'] ?? null), 'person_id' => pd_local('persons', $d['person_id'] ?? null),
                'expected_close_date' => $d['expected_close_date'] ?? null, 'extra' => pd_extra($d['custom_fields'] ?? null), 'pd_id' => $d['id'],
                'add_time' => pd_time($d['add_time'] ?? null) ?? $now, 'update_time' => pd_time($d['update_time'] ?? null) ?? $now,
                'won_time' => pd_time($d['won_time'] ?? null), 'lost_time' => pd_time($d['lost_time'] ?? null), 'close_time' => pd_time($d['close_time'] ?? null), 'stage_change_time' => pd_time($d['stage_change_time'] ?? null)];
        }
        upsert_rows('deals', $rows, ['title', 'value', 'currency', 'pipeline_id', 'stage_id', 'status', 'lost_reason', 'owner_id', 'org_id', 'person_id', 'expected_close_date', 'extra',
            'update_time', 'won_time', 'lost_time', 'close_time', 'stage_change_time']);
        pd_map('deals', true);
    } else {
        $tz = new DateTimeZone('Europe/Paris');
        foreach ($data as $a) {
            if (!empty($a['is_deleted'])) continue;
            $d = $a['due_date'] ?? null; $t = $a['due_time'] ?? null;
            if ($d && $t) { try { $dt = new DateTime($d . ' ' . substr($t, 0, 5), new DateTimeZone('UTC')); $dt->setTimezone($tz); $d = $dt->format('Y-m-d'); $t = $dt->format('H:i'); } catch (Throwable $e) {} }
            $dur = null; if (!empty($a['duration'])) { [$hh, $mm] = array_map('intval', explode(':', $a['duration']) + [0, 0]); $dur = $hh * 60 + $mm; }
            $done = !empty($a['done']);
            $loc = $a['location'] ?? null; if (is_array($loc)) $loc = $loc['value'] ?? null;
            $rows[] = ['type' => mb_substr((string)($a['type'] ?: 'task'), 0, 40), 'subject' => mb_substr((string)($a['subject'] ?? ''), 0, 500), 'due_date' => $d ?: null, 'due_time' => $t ? substr($t, 0, 5) : null,
                'duration' => $dur, 'done' => $done ? 1 : 0, 'done_time' => $done ? (pd_time($a['marked_as_done_time'] ?? null) ?? ($d ? $d . ' 12:00:00' : $now)) : null,
                'owner_id' => $own($a['owner_id'] ?? null), 'deal_id' => pd_local('deals', $a['deal_id'] ?? null), 'person_id' => pd_local('persons', $a['person_id'] ?? null),
                'org_id' => pd_local('orgs', $a['org_id'] ?? null), 'note' => html_to_text($a['note'] ?? null), 'location' => $loc ? mb_substr((string)$loc, 0, 500) : null, 'pd_id' => $a['id'],
                'add_time' => pd_time($a['add_time'] ?? null) ?? $now, 'update_time' => pd_time($a['update_time'] ?? null) ?? $now];
        }
        upsert_rows('activities', $rows, ['type', 'subject', 'due_date', 'due_time', 'duration', 'done', 'done_time', 'owner_id', 'deal_id', 'person_id', 'org_id', 'note', 'location', 'update_time']);
    }
    return ['count' => count($data), 'next' => $r['additional_data']['next_cursor'] ?? null];
}

/* Une étape d'import. $state est renvoyé tel quel par le navigateur ou la tâche planifiée jusqu'à step = done. */
function import_step(array $state): array {
    $order = ['meta', 'orgs', 'persons', 'deals', 'activities', 'done'];
    if (empty($state['step'])) {
        $since = ($state['mode'] ?? 'full') === 'inc' ? (setting('last_import')['at'] ?? null) : null;
        $state = ['mode' => $since ? 'inc' : 'full', 'step' => 'meta', 'cursor' => null, 'since' => $since, 'started' => now_utc(), 'counts' => [], 'log' => []];
    }
    $step = $state['step'];
    if (!in_array($step, $order, true)) throw new RuntimeException('Étape inconnue.');
    if ($step === 'meta') {
        $c = import_meta();
        $state['log'][] = "Équipe {$c['équipe']}, pipelines {$c['pipelines']}, étapes {$c['étapes']}";
        $state['step'] = 'orgs';
    } elseif ($step !== 'done') {
        $r = import_page($step, $state['cursor'] ?? null, $state['since'] ?? null);
        $state['counts'][$step] = ($state['counts'][$step] ?? 0) + $r['count'];
        $labels = ['orgs' => 'Organisations', 'persons' => 'Personnes', 'deals' => 'Affaires', 'activities' => 'Activités'];
        $state['log'][] = $labels[$step] . ' : ' . $state['counts'][$step] . ' lues';
        if ($r['next']) $state['cursor'] = $r['next'];
        else { $state['cursor'] = null; $state['step'] = $order[array_search($step, $order, true) + 1]; }
    }
    if ($state['step'] === 'done' && empty($state['finished'])) {
        $state['finished'] = now_utc();
        set_setting('last_import', ['at' => $state['started'], 'counts' => $state['counts'], 'mode' => $state['mode']]);
        $state['log'][] = 'Import terminé.';
    }
    $state['log'] = array_slice($state['log'], -40);
    $state['pct'] = (int)round(array_search($state['step'], $order, true) / (count($order) - 1) * 100);
    return $state;
}
