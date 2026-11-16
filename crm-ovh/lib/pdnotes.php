<?php
// Reprise ponctuelle des notes de Pipedrive, oubliées par l'import d'origine.
// Chaque note devient une activité de type « note », déjà faite, datée du jour où elle a été écrite, et rattachée à la
// même affaire, la même personne et la même organisation que dans Pipedrive. Elle apparaît ainsi dans l'historique de la
// fiche et dans le bloc « Où en est-on ? ». Une note déjà reprise n'est jamais reprise deux fois.
// Ne touche ni aux pipelines, ni aux étapes, ni aux fiches existantes.
declare(strict_types=1);

/* Reprise ponctuelle des prospects de Pipedrive (pistes jamais transformées en affaire).
   Leurs personnes et organisations sont déjà dans le CRM, mais sans rien qui les distingue. Chaque prospect laisse donc
   une note datée sur sa personne (ou son organisation) et lui pose le tag « Prospect Pipedrive », ce qui la fait
   apparaître dans les contacts utiles. Aucune affaire n'est créée. Un prospect déjà repris ne l'est pas deux fois. */
function pd_leads_step(array $state): array {
    require_once __DIR__ . '/tags.php';
    tags_schema();
    q('CREATE TABLE IF NOT EXISTS crm_pd_leads (pd_id VARCHAR(64) NOT NULL PRIMARY KEY, activity_id BIGINT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    if (!isset($state['start'])) $state = ['start' => 0, 'lus' => 0, 'repris' => 0, 'deja' => 0, 'sans_fiche' => 0, 'tags' => 0, 'done' => false];
    $r = pd_request('/v1/leads', ['start' => (int)$state['start'], 'limit' => 200, 'archived_status' => 'all']);
    $users = [];
    foreach (q('SELECT id, pd_id FROM users WHERE pd_id IS NOT NULL')->fetchAll() as $u) $users[(int)$u['pd_id']] = (int)$u['id'];
    foreach ((array)($r['data'] ?? []) as $l) {
        $state['lus']++;
        $pdId = (string)($l['id'] ?? '');
        if ($pdId === '' || strlen($pdId) > 64) continue;
        if (q('SELECT 1 FROM crm_pd_leads WHERE pd_id = ?', [$pdId])->fetchColumn()) { $state['deja']++; continue; }
        $person = pd_local('persons', $l['person_id'] ?? null);
        $org = pd_local('orgs', $l['organization_id'] ?? null);
        if (!$person && !$org) { $state['sans_fiche']++; continue; }
        if ($person && !$org) { $o = q('SELECT org_id FROM persons WHERE id = ?', [$person])->fetchColumn(); $org = $o ? (int)$o : null; }
        $when = pd_time((string)($l['add_time'] ?? '')) ?: now_utc();
        $title = trim((string)($l['title'] ?? '')) ?: 'sans titre';
        $val = isset($l['value']['amount']) && $l['value']['amount'] ? "\nMontant estimé : " . $l['value']['amount'] . ' ' . ($l['value']['currency'] ?? '') : '';
        $note = 'Prospect repris de Pipedrive, jamais transformé en affaire.' . $val . (!empty($l['is_archived']) ? "\nIl était archivé dans Pipedrive." : '');
        q('INSERT INTO activities (type, subject, due_date, done, done_time, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 1, ?, ?, NULL, ?, ?, ?, ?, ?)',
            ['note', mb_substr('Prospect Pipedrive : ' . $title, 0, 500), substr($when, 0, 10), $when, $users[(int)($l['owner_id'] ?? 0)] ?? null, $person, $org, $note, $when, $when]);
        q('INSERT IGNORE INTO crm_pd_leads (pd_id, activity_id) VALUES (?, ?)', [$pdId, (int)db()->lastInsertId()]);
        $state['tags'] += q('INSERT IGNORE INTO crm_tags (entity, entity_id, tag) VALUES (?, ?, ?)', [$person ? 'person' : 'org', $person ?: $org, 'Prospect Pipedrive'])->rowCount();
        $state['repris']++;
    }
    $pg = (array)($r['additional_data']['pagination'] ?? []);
    if (!empty($pg['more_items_in_collection']) && isset($pg['next_start'])) $state['start'] = (int)$pg['next_start'];
    else $state['done'] = true;
    return $state;
}

function pd_notes_step(array $state): array {
    q('CREATE TABLE IF NOT EXISTS crm_pd_notes (pd_id BIGINT NOT NULL PRIMARY KEY, activity_id BIGINT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
    if (!isset($state['start'])) $state = ['start' => 0, 'lues' => 0, 'creees' => 0, 'deja' => 0, 'vides' => 0, 'sans_fiche' => 0, 'done' => false];
    $r = pd_request('/v1/notes', ['start' => (int)$state['start'], 'limit' => 200, 'sort' => 'add_time ASC']);
    $users = [];
    foreach (q('SELECT id, LOWER(email) AS email FROM users WHERE email IS NOT NULL')->fetchAll() as $u) $users[(string)$u['email']] = (int)$u['id'];
    foreach ((array)($r['data'] ?? []) as $n) {
        $state['lues']++;
        $pdId = (int)($n['id'] ?? 0);
        if (!$pdId) continue;
        if (q('SELECT 1 FROM crm_pd_notes WHERE pd_id = ?', [$pdId])->fetchColumn()) { $state['deja']++; continue; }
        $text = html_to_text((string)($n['content'] ?? ''));
        if ($text === '') { $state['vides']++; continue; }
        $deal = pd_local('deals', $n['deal_id'] ?? null);
        $person = pd_local('persons', $n['person_id'] ?? null);
        $org = pd_local('orgs', $n['org_id'] ?? null);
        // Note d'un prospect non transformé, ou d'une fiche absente du CRM : rien à quoi la rattacher.
        if (!$deal && !$person && !$org) { $state['sans_fiche']++; continue; }
        if ($deal && (!$person || !$org)) {
            $d = q('SELECT person_id, org_id FROM deals WHERE id = ?', [$deal])->fetch();
            if ($d) { $person = $person ?: ($d['person_id'] ? (int)$d['person_id'] : null); $org = $org ?: ($d['org_id'] ? (int)$d['org_id'] : null); }
        }
        if ($person && !$org) { $o = q('SELECT org_id FROM persons WHERE id = ?', [$person])->fetchColumn(); $org = $o ? (int)$o : null; }
        $when = pd_time((string)($n['add_time'] ?? '')) ?: now_utc();
        $owner = $users[strtolower((string)($n['user']['email'] ?? ''))] ?? null;
        $first = trim((string)strtok($text, "\n"));
        $subject = 'Note : ' . (mb_strlen($first) > 90 ? mb_substr($first, 0, 90) . '…' : $first);
        q('INSERT INTO activities (type, subject, due_date, done, done_time, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)',
            ['note', mb_substr($subject, 0, 500), substr($when, 0, 10), $when, $owner, $deal, $person, $org, mb_substr($text, 0, 20000), $when, $when]);
        q('INSERT IGNORE INTO crm_pd_notes (pd_id, activity_id) VALUES (?, ?)', [$pdId, (int)db()->lastInsertId()]);
        $state['creees']++;
    }
    $pg = (array)($r['additional_data']['pagination'] ?? []);
    if (!empty($pg['more_items_in_collection']) && isset($pg['next_start'])) $state['start'] = (int)$pg['next_start'];
    else $state['done'] = true;
    return $state;
}
