<?php
// Reprise ponctuelle des notes de Pipedrive, oubliées par l'import d'origine.
// Chaque note devient une activité de type « note », déjà faite, datée du jour où elle a été écrite, et rattachée à la
// même affaire, la même personne et la même organisation que dans Pipedrive. Elle apparaît ainsi dans l'historique de la
// fiche et dans le bloc « Où en est-on ? ». Une note déjà reprise n'est jamais reprise deux fois.
// Ne touche ni aux pipelines, ni aux étapes, ni aux fiches existantes.
declare(strict_types=1);

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
