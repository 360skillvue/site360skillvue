<?php
// Mailchimp vers CRM, pour quelques tags choisis seulement.
// Principe : une information de Mailchimp n'entre dans le CRM que si elle sert à une action de vente (par exemple une liste d'appels).
// On « suit » donc des tags Mailchimp précis : leurs contacts sont retrouvés ou créés dans le CRM et reçoivent le tag CRM associé.
// Rien n'est écrit dans Mailchimp : lecture seule.
declare(strict_types=1);

function mc_conf(): array {
    $c = setting('mailchimp');
    $c = is_array($c) ? $c : [];
    $follow = [];
    foreach ((array)($c['follow'] ?? []) as $f) {
        if (is_array($f) && trim((string)($f['mc'] ?? '')) !== '' && trim((string)($f['crm'] ?? '')) !== '') $follow[] = ['mc' => trim((string)$f['mc']), 'crm' => trim((string)$f['crm'])];
    }
    return ['key' => (string)($c['key'] ?? ''), 'list' => (string)($c['list'] ?? ''), 'follow' => $follow, 'last' => $c['last'] ?? null];
}

/* Ce que le navigateur a le droit de voir : jamais la clé. */
function mc_public(): array {
    $c = mc_conf();
    return ['configured' => $c['key'] !== '', 'list' => $c['list'], 'follow' => $c['follow'], 'last' => $c['last']];
}

function mc_save(array $patch): void {
    $c = setting('mailchimp');
    $c = is_array($c) ? $c : [];
    set_setting('mailchimp', $patch + $c);
}

function mc_request(string $path, array $params = []): array {
    $key = mc_conf()['key'];
    if ($key === '' || !preg_match('/-([a-z]{2,4}\d{1,3})$/', $key, $m)) throw new RuntimeException("La clé Mailchimp n'est pas renseignée ou n'a pas le bon format.");
    $url = 'https://' . $m[1] . '.api.mailchimp.com/3.0' . $path . ($params ? '?' . http_build_query($params) : '');
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 40, CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERPWD => 'crm:' . $key, CURLOPT_HTTPHEADER => ['Accept: application/json']]);
    $raw = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) throw new RuntimeException('Mailchimp injoignable : ' . $err);
    $j = json_decode((string)$raw, true);
    if ($code === 401 || $code === 403) throw new RuntimeException('Mailchimp a refusé la clé.');
    if ($code >= 400 || !is_array($j)) throw new RuntimeException('Erreur Mailchimp ' . $code . (is_array($j) && !empty($j['detail']) ? ' : ' . mb_substr((string)$j['detail'], 0, 200) : ''));
    return $j;
}

function mc_lists(): array {
    $r = mc_request('/lists', ['count' => 50, 'fields' => 'lists.id,lists.name,lists.stats.member_count']);
    return array_map(fn($l) => ['id' => (string)$l['id'], 'name' => (string)$l['name'], 'members' => (int)($l['stats']['member_count'] ?? 0)], $r['lists'] ?? []);
}

/* Tags de l'audience (segments statiques) : nom vers identifiant. */
function mc_tags(string $list): array {
    $out = [];
    $offset = 0;
    do {
        $r = mc_request('/lists/' . rawurlencode($list) . '/segments', ['type' => 'static', 'count' => 200, 'offset' => $offset, 'fields' => 'segments.id,segments.name,segments.member_count,total_items']);
        foreach ($r['segments'] ?? [] as $s) $out[] = ['id' => (int)$s['id'], 'name' => (string)$s['name'], 'members' => (int)($s['member_count'] ?? 0)];
        $offset += 200;
    } while ($offset < (int)($r['total_items'] ?? 0) && $offset < 2000);
    return $out;
}

/* Récupère les contacts des tags suivis et les rattache au CRM. */
function mc_sync(): array {
    require_once __DIR__ . '/tags.php';
    tags_schema();
    $c = mc_conf();
    if ($c['key'] === '' || $c['list'] === '') throw new RuntimeException("Mailchimp n'est pas encore configuré.");
    if (!$c['follow']) return ['lignes' => ['Aucun tag Mailchimp suivi.'], 'crees' => 0, 'tagues' => 0];
    $ids = [];
    foreach (mc_tags($c['list']) as $t) $ids[mb_strtolower($t['name'])] = $t['id'];
    // Adresse e-mail (en minuscules) vers identifiant de la personne
    $map = [];
    foreach (q("SELECT id, emails FROM persons WHERE emails IS NOT NULL AND emails <> '' AND emails <> '[]'")->fetchAll() as $p) {
        $list = json_decode((string)$p['emails'], true);
        if (!is_array($list)) continue;
        foreach ($list as $e) { $a = strtolower(trim((string)(is_array($e) ? ($e['value'] ?? '') : $e))); if ($a !== '' && !isset($map[$a])) $map[$a] = (int)$p['id']; }
    }
    $lines = []; $created = 0; $tagged = 0;
    $now = now_utc();
    foreach ($c['follow'] as $f) {
        $sid = $ids[mb_strtolower($f['mc'])] ?? null;
        if ($sid === null) { $lines[] = 'Tag Mailchimp introuvable : ' . $f['mc']; continue; }
        $crmTag = tag_clean($f['crm']);
        $offset = 0; $seen = 0; $new = 0; $add = 0;
        do {
            $r = mc_request('/lists/' . rawurlencode($c['list']) . '/segments/' . $sid . '/members',
                ['count' => 500, 'offset' => $offset, 'fields' => 'members.email_address,members.status,members.merge_fields,total_items']);
            foreach ($r['members'] ?? [] as $m) {
                $seen++;
                $email = strtolower(trim((string)($m['email_address'] ?? '')));
                if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) continue;
                $pid = $map[$email] ?? null;
                if ($pid === null) {
                    $mf = (array)($m['merge_fields'] ?? []);
                    $first = mb_substr(trim((string)($mf['FNAME'] ?? '')), 0, 190);
                    $last = mb_substr(trim((string)($mf['LNAME'] ?? '')), 0, 190);
                    $name = trim($first . ' ' . $last) ?: $email;
                    $orgName = mb_substr(trim((string)($mf['MMERGE5'] ?? '')), 0, 255);
                    $phone = trim((string)($mf['PHONE'] ?? ''));
                    $oid = null;
                    if ($orgName !== '') {
                        $oid = q('SELECT id FROM orgs WHERE name = ? ORDER BY id LIMIT 1', [$orgName])->fetchColumn();
                        if (!$oid) { q('INSERT INTO orgs (name, add_time, update_time) VALUES (?, ?, ?)', [$orgName, $now, $now]); $oid = db()->lastInsertId(); }
                        $oid = (int)$oid;
                    }
                    q('INSERT INTO persons (name, first_name, last_name, org_id, emails, phones, add_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [mb_substr($name, 0, 255), $first !== '' ? $first : null, $last !== '' ? $last : null, $oid,
                         json_encode([['value' => $email, 'label' => null, 'primary' => true]], JSON_UNESCAPED_UNICODE),
                         $phone !== '' ? json_encode([['value' => $phone, 'label' => null, 'primary' => true]], JSON_UNESCAPED_UNICODE) : '[]', $now, $now]);
                    $pid = (int)db()->lastInsertId();
                    $map[$email] = $pid;
                    $new++;
                }
                $add += q('INSERT IGNORE INTO crm_tags (entity, entity_id, tag) VALUES (?, ?, ?)', ['person', $pid, $crmTag])->rowCount();
            }
            $offset += 500;
        } while ($offset < (int)($r['total_items'] ?? 0) && $offset < 20000);
        $lines[] = $f['mc'] . ' : ' . $seen . ' contacts dans Mailchimp, ' . $new . ' créés dans le CRM, ' . $add . ' tags « ' . $crmTag . ' » ajoutés';
        $created += $new; $tagged += $add;
    }
    $res = ['lignes' => $lines, 'crees' => $created, 'tagues' => $tagged, 'at' => $now];
    mc_save(['last' => $res]);
    return $res;
}
