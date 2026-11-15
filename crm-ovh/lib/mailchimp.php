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
    return ['key' => (string)($c['key'] ?? ''), 'list' => (string)($c['list'] ?? ''), 'follow' => $follow, 'last' => $c['last'] ?? null,
        'push_on' => !empty($c['push_on']), 'push_last' => $c['push_last'] ?? null];
}

/* Ce que le navigateur a le droit de voir : jamais la clé. */
function mc_public(): array {
    $c = mc_conf();
    return ['configured' => $c['key'] !== '', 'list' => $c['list'], 'follow' => $c['follow'], 'last' => $c['last'], 'push_on' => $c['push_on'], 'push_last' => $c['push_last']];
}

function mc_save(array $patch): void {
    $c = setting('mailchimp');
    $c = is_array($c) ? $c : [];
    set_setting('mailchimp', $patch + $c);
}

function mc_request(string $path, array $params = [], ?array $post = null): array {
    $key = mc_conf()['key'];
    if ($key === '' || !preg_match('/-([a-z]{2,4}\d{1,3})$/', $key, $m)) throw new RuntimeException("La clé Mailchimp n'est pas renseignée ou n'a pas le bon format.");
    $url = 'https://' . $m[1] . '.api.mailchimp.com/3.0' . $path . ($params ? '?' . http_build_query($params) : '');
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60, CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERPWD => 'crm:' . $key, CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/json']]);
    if ($post !== null) curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($post, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
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

/* ---------- CRM vers Mailchimp : remplace la synchronisation que faisait Pipedrive ----------
   Règle : les contacts « utiles » (liés à une affaire, une activité, un e-mail ou un tag) qui ont une adresse e-mail.
   Un contact absent de Mailchimp y est créé comme abonné ; un contact déjà présent est seulement mis à jour :
   son statut n'est jamais modifié, donc un désabonné reste désabonné. Rien n'est jamais supprimé dans Mailchimp.
   Seuls les contacts nouveaux ou modifiés depuis le dernier envoi partent (empreinte gardée dans crm_mc_push). */

// Tags du CRM transmis à Mailchimp, pour cibler une communication indépendamment de la nature de l'organisation.
// Le tag peut être posé sur la personne ou sur son organisation : dans ce cas il vaut pour toutes ses personnes.
const MC_PUSH_TAGS = ['Certification périodique'];
// Établissements de santé : tous concernés par la certification périodique. Leurs contacts reçoivent le tag d'office,
// sans avoir à le poser à la main : domaine d'activité de l'organisation ci-dessous, ou nature « certification périodique ».
const MC_HEALTH_TAG = 'Certification périodique';
const MC_HEALTH_DOMAINS = ['santé', 'lbm', 'formation santé']; // pas « ambulance » : non concerné

function mc_is_health(string $domaine, string $nature): bool {
    return in_array(mb_strtolower(trim($domaine)), MC_HEALTH_DOMAINS, true) || str_contains(mb_strtolower($nature), 'certification p');
}

function mc_push_schema(): void {
    static $done = false;
    if ($done) return;
    q('CREATE TABLE IF NOT EXISTS crm_mc_push (person_id BIGINT NOT NULL PRIMARY KEY, hash CHAR(40) NOT NULL, at DATETIME NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    // Colonne ajoutée après coup : tags déjà transmis pour cette personne.
    if (!q("SHOW COLUMNS FROM crm_mc_push LIKE 'tags'")->fetch()) q("ALTER TABLE crm_mc_push ADD COLUMN tags VARCHAR(255) NOT NULL DEFAULT ''");
    $done = true;
}

/* Valeur lisible d'un champ personnalisé (texte, ou libellé d'une liste de choix). */
function mc_field_value(array $extra, ?array $field): string {
    if (!$field) return '';
    $v = $extra[$field['fkey']] ?? '';
    if (is_array($v)) $v = implode(', ', array_map('strval', $v));
    $v = trim((string)$v);
    if ($v === '') return '';
    $opts = $field['options'] ? json_decode((string)$field['options'], true) : null;
    if (is_array($opts)) {
        foreach ($opts as $o) {
            if (is_array($o) && isset($o['id']) && (string)$o['id'] === $v) return trim((string)($o['label'] ?? ''));
        }
        if (ctype_digit($v)) return ''; // identifiant de choix inconnu : on n'envoie rien plutôt qu'un chiffre
    }
    return mb_substr($v, 0, 250);
}

/* Liste des contacts à envoyer, avec leurs champs. */
function mc_push_rows(): array {
    require_once __DIR__ . '/tags.php';
    require_once __DIR__ . '/mail.php';
    tags_schema(); mail_schema();
    $internal = array_map('strval', array_keys(mail_internal_domains()));
    $fields = ['person' => [], 'org' => []];
    foreach (q("SELECT entity, fkey, label, options FROM fields WHERE entity IN ('person', 'org')")->fetchAll() as $f) $fields[$f['entity']][mb_strtolower(trim((string)$f['label']))] = $f;
    $pick = fn(string $entity, array $labels) => array_values(array_filter(array_map(fn($l) => $fields[$entity][$l] ?? null, $labels)));
    $fPays = $pick('person', ['pays texte', 'pays']);
    $fNatP = $pick('person', ["nature de l'organisation (texte)", 'nature organisation (marketing)']);
    $fNatO = $pick('org', ["nature de l'organisation"]);
    $fDom = $pick('org', ['domaine activité', "domaine d'activité"]);
    $use = "(EXISTS (SELECT 1 FROM deals ud WHERE ud.person_id = p.id) OR EXISTS (SELECT 1 FROM activities ua WHERE ua.person_id = p.id)"
         . " OR EXISTS (SELECT 1 FROM crm_emails ue WHERE ue.person_id = p.id) OR EXISTS (SELECT 1 FROM crm_tags ut WHERE ut.entity = 'person' AND ut.entity_id = p.id)"
         . " OR EXISTS (SELECT 1 FROM deals ud2 WHERE ud2.org_id = p.org_id)"
         // Une organisation portant un tag transmis à Mailchimp rend toutes ses personnes concernées.
         . " OR EXISTS (SELECT 1 FROM crm_tags uo WHERE uo.entity = 'org' AND uo.entity_id = p.org_id AND uo.tag IN (" . implode(',', array_map(fn($t) => db()->quote($t), MC_PUSH_TAGS)) . ")))";
    // Personnes et organisations portant l'un des tags transmis à Mailchimp.
    $want = []; foreach (MC_PUSH_TAGS as $t) $want[mb_strtolower($t)] = $t;
    $tagP = []; $tagO = [];
    foreach (q("SELECT entity, entity_id, tag FROM crm_tags WHERE entity IN ('person', 'org')")->fetchAll() as $t) {
        $name = $want[mb_strtolower(trim((string)$t['tag']))] ?? null;
        if ($name === null) continue;
        if ($t['entity'] === 'person') $tagP[(int)$t['entity_id']][$name] = true; else $tagO[(int)$t['entity_id']][$name] = true;
    }
    $rows = [];
    $seen = [];
    $sql = "SELECT p.id, p.org_id, p.name, p.first_name, p.last_name, p.emails, p.phones, p.extra, o.extra AS org_extra FROM persons p LEFT JOIN orgs o ON o.id = p.org_id
            WHERE p.emails IS NOT NULL AND p.emails <> '' AND p.emails <> '[]' AND $use";
    foreach (q($sql)->fetchAll() as $p) {
        $email = '';
        foreach ((array)json_decode((string)$p['emails'], true) as $e) {
            $a = strtolower(trim((string)(is_array($e) ? ($e['value'] ?? '') : $e)));
            if ($a !== '' && filter_var($a, FILTER_VALIDATE_EMAIL)) { $email = $a; if (!is_array($e) || !empty($e['primary'])) break; }
        }
        if ($email === '' || isset($seen[$email])) continue;
        if (in_array(substr(strrchr($email, '@'), 1), $internal, true)) continue;
        $seen[$email] = true;
        $extra = $p['extra'] ? (json_decode((string)$p['extra'], true) ?: []) : [];
        $oextra = $p['org_extra'] ? (json_decode((string)$p['org_extra'], true) ?: []) : [];
        $first = trim((string)$p['first_name']); $last = trim((string)$p['last_name']);
        if ($first === '' && $last === '') { $parts = preg_split('/\s+/u', trim((string)$p['name']), 2); $first = $parts[0] ?? ''; $last = $parts[1] ?? ''; }
        $phone = '';
        foreach ((array)json_decode((string)$p['phones'], true) as $ph) { $phone = trim((string)(is_array($ph) ? ($ph['value'] ?? '') : $ph)); if ($phone !== '') break; }
        $pays = ''; foreach ($fPays as $f) { $pays = mc_field_value($extra, $f); if ($pays !== '') break; }
        $nature = ''; foreach ($fNatP as $f) { $nature = mc_field_value($extra, $f); if ($nature !== '') break; }
        if ($nature === '') foreach ($fNatO as $f) { $nature = mc_field_value($oextra, $f); if ($nature !== '') break; }
        $tagSet = ($tagP[(int)$p['id']] ?? []) + ($p['org_id'] ? ($tagO[(int)$p['org_id']] ?? []) : []);
        $domaine = ''; foreach ($fDom as $f) { $domaine = mc_field_value($oextra, $f); if ($domaine !== '') break; }
        if (mc_is_health($domaine, $nature)) $tagSet[MC_HEALTH_TAG] = true;
        $tags = array_keys($tagSet);
        sort($tags);
        $rows[] = ['id' => (int)$p['id'], 'email' => $email, 'first' => mb_substr($first, 0, 100), 'last' => mb_substr($last, 0, 100), 'phone' => mb_substr($phone, 0, 40), 'pays' => $pays, 'nature' => $nature,
            'tags' => implode('|', $tags)];
    }
    return $rows;
}

/* Pour information : contacts d'établissements de santé qui ont une adresse e-mail mais ne sont pas « utiles » (donc pas envoyés à Mailchimp). */
function mc_health_outside(): int {
    $fields = [];
    foreach (q("SELECT entity, fkey, label, options FROM fields WHERE entity IN ('person', 'org')")->fetchAll() as $f) $fields[$f['entity']][mb_strtolower(trim((string)$f['label']))] = $f;
    $fDom = $fields['org']['domaine activité'] ?? null;
    $fNatO = $fields['org']["nature de l'organisation"] ?? null;
    $fNatP = $fields['person']['nature organisation (marketing)'] ?? null;
    $use = "(EXISTS (SELECT 1 FROM deals ud WHERE ud.person_id = p.id) OR EXISTS (SELECT 1 FROM activities ua WHERE ua.person_id = p.id)"
         . " OR EXISTS (SELECT 1 FROM crm_emails ue WHERE ue.person_id = p.id) OR EXISTS (SELECT 1 FROM crm_tags ut WHERE ut.entity = 'person' AND ut.entity_id = p.id)"
         . " OR EXISTS (SELECT 1 FROM deals ud2 WHERE ud2.org_id = p.org_id))";
    $n = 0;
    foreach (q("SELECT p.extra, o.extra AS org_extra FROM persons p LEFT JOIN orgs o ON o.id = p.org_id WHERE p.emails IS NOT NULL AND p.emails <> '' AND p.emails <> '[]' AND NOT $use")->fetchAll() as $p) {
        $extra = $p['extra'] ? (json_decode((string)$p['extra'], true) ?: []) : [];
        $oextra = $p['org_extra'] ? (json_decode((string)$p['org_extra'], true) ?: []) : [];
        $nature = mc_field_value($extra, $fNatP); if ($nature === '') $nature = mc_field_value($oextra, $fNatO);
        if (mc_is_health(mc_field_value($oextra, $fDom), $nature)) $n++;
    }
    return $n;
}

/* Champs de l'audience Mailchimp, retrouvés par leur nom : pays et nature de l'organisation. */
function mc_merge_tags(string $list): array {
    $r = mc_request('/lists/' . rawurlencode($list) . '/merge-fields', ['count' => 100, 'fields' => 'merge_fields.tag,merge_fields.name']);
    $out = ['pays' => null, 'nature' => null, 'phone' => null];
    foreach ($r['merge_fields'] ?? [] as $f) {
        $n = mb_strtolower((string)$f['name']); $t = (string)$f['tag'];
        if ($out['pays'] === null && ($n === 'pays' || str_starts_with($n, 'pays') || $n === 'country')) $out['pays'] = $t;
        if ($out['nature'] === null && str_contains($n, 'nature')) $out['nature'] = $t;
        if ($out['phone'] === null && ($t === 'PHONE' || str_contains($n, 'téléphone') || str_contains($n, 'phone'))) $out['phone'] = $t;
    }
    return $out;
}

/* Envoie vers Mailchimp les contacts nouveaux ou modifiés. Avec $dry, compte seulement, sans rien envoyer. */
function mc_push(bool $dry = false): array {
    mc_push_schema();
    $c = mc_conf();
    if ($c['key'] === '' || $c['list'] === '') throw new RuntimeException("Mailchimp n'est pas encore configuré.");
    $rows = mc_push_rows();
    $known = []; $knownTags = [];
    foreach (q('SELECT person_id, hash, tags FROM crm_mc_push')->fetchAll() as $k) { $known[(int)$k['person_id']] = (string)$k['hash']; $knownTags[(int)$k['person_id']] = (string)$k['tags']; }
    $todo = [];
    foreach ($rows as $r) {
        // L'empreinte des champs reste celle d'origine ; les tags sont comparés à part, pour ne renvoyer que ce qui a changé.
        $h = sha1(implode('|', [$r['email'], $r['first'], $r['last'], $r['phone'], $r['pays'], $r['nature']]));
        $fieldsChanged = ($known[$r['id']] ?? '') !== $h;
        $tagsChanged = ($knownTags[$r['id']] ?? '') !== $r['tags'];
        if ($fieldsChanged || $tagsChanged) $todo[] = $r + ['hash' => $h, 'fields_changed' => $fieldsChanged, 'tags_before' => $knownTags[$r['id']] ?? ''];
    }
    if ($dry) {
        $withTag = count(array_filter($rows, fn($r) => str_contains('|' . $r['tags'] . '|', '|' . MC_HEALTH_TAG . '|')));
        return ['utiles' => count($rows), 'a_envoyer' => count($todo), 'deja' => count($rows) - count($todo), 'certification' => $withTag, 'sante_hors_utiles' => mc_health_outside()];
    }
    $sent = 0; $batches = [];
    if ($todo) {
        $tags = mc_merge_tags($c['list']);
        $now = now_utc();
        foreach (array_chunk($todo, 400) as $chunk) {
            $ops = [];
            foreach ($chunk as $r) {
                // On n'envoie que les champs renseignés, pour ne jamais effacer une valeur déjà présente dans Mailchimp.
                $mf = [];
                if ($r['first'] !== '') $mf['FNAME'] = $r['first'];
                if ($r['last'] !== '') $mf['LNAME'] = $r['last'];
                if ($r['phone'] !== '' && $tags['phone']) $mf[$tags['phone']] = $r['phone'];
                if ($r['pays'] !== '' && $tags['pays']) $mf[$tags['pays']] = $r['pays'];
                if ($r['nature'] !== '' && $tags['nature']) $mf[$tags['nature']] = $r['nature'];
                $body = ['email_address' => $r['email'], 'status_if_new' => 'subscribed'];
                if ($mf) $body['merge_fields'] = $mf;
                $ops[] = ['method' => 'PUT', 'path' => '/lists/' . $c['list'] . '/members/' . md5($r['email']), 'params' => ['skip_merge_validation' => 'true'],
                    'body' => json_encode($body, JSON_UNESCAPED_UNICODE)];
                // Tags : on pose ceux qui viennent d'apparaître, on retire seulement ceux que le CRM avait lui-même posés.
                $now_t = $r['tags'] === '' ? [] : explode('|', $r['tags']);
                $before_t = $r['tags_before'] === '' ? [] : explode('|', $r['tags_before']);
                $chg = [];
                foreach (array_diff($now_t, $before_t) as $t) $chg[] = ['name' => $t, 'status' => 'active'];
                foreach (array_diff($before_t, $now_t) as $t) $chg[] = ['name' => $t, 'status' => 'inactive'];
                if ($chg) $ops[] = ['method' => 'POST', 'path' => '/lists/' . $c['list'] . '/members/' . md5($r['email']) . '/tags', 'body' => json_encode(['tags' => $chg], JSON_UNESCAPED_UNICODE)];
            }
            $res = mc_request('/batches', [], ['operations' => $ops]);
            if (empty($res['id'])) throw new RuntimeException('Mailchimp n\'a pas accepté le lot de contacts.');
            $batches[] = (string)$res['id'];
            foreach ($chunk as $r) q('INSERT INTO crm_mc_push (person_id, hash, tags, at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE hash = VALUES(hash), tags = VALUES(tags), at = VALUES(at)', [$r['id'], $r['hash'], $r['tags'], $now]);
            $sent += count($chunk);
        }
    }
    $res = ['utiles' => count($rows), 'envoyes' => $sent, 'lots' => $batches, 'at' => now_utc()];
    mc_save(['push_last' => $res, 'push_on' => true]);
    return $res;
}

/* État d'un lot envoyé : nombre d'opérations réussies et en erreur. */
function mc_batch_status(string $id): array {
    $r = mc_request('/batches/' . rawurlencode($id), ['fields' => 'id,status,total_operations,finished_operations,errored_operations']);
    return ['etat' => (string)($r['status'] ?? ''), 'total' => (int)($r['total_operations'] ?? 0), 'finis' => (int)($r['finished_operations'] ?? 0), 'erreurs' => (int)($r['errored_operations'] ?? 0)];
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
