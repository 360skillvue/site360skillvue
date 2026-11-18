<?php
// Contacts liés à une affaire : la personne principale, celles ajoutées à la main, les personnes de l'organisation,
// celles qui figurent dans les activités de l'affaire et celles qui ont échangé des e-mails rattachés à l'affaire
// ou à son organisation. Les adresses e-mail des échanges qui ne correspondent à aucune fiche sont proposées à la création.
declare(strict_types=1);

const DC_OWN_DOMAINS = ['360skillvue.com', '360skillvue.ch', 'biologie-elearning.fr', 'scanup.fr'];

function dc_table(): void {
    static $done = false; if ($done) return;
    q('CREATE TABLE IF NOT EXISTS crm_deal_persons (deal_id INT UNSIGNED NOT NULL, person_id INT UNSIGNED NOT NULL, add_time DATETIME NOT NULL,
       PRIMARY KEY (deal_id, person_id), KEY k_person (person_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    $done = true;
}

/* Valeurs d'une liste d'e-mails ou de téléphones stockée en JSON (liste de chaînes ou d'objets {value}). */
function dc_values($raw): array {
    $j = is_string($raw) ? json_decode($raw, true) : $raw;
    if (!is_array($j)) return [];
    $out = [];
    foreach ($j as $v) { $v = is_array($v) ? (string)($v['value'] ?? '') : (string)$v; $v = trim($v); if ($v !== '') $out[] = $v; }
    return array_values(array_unique($out));
}

function dc_addrs(string $s): array {
    preg_match_all('/[A-Za-z0-9._%+\'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/', $s, $m);
    return array_values(array_unique(array_map('strtolower', $m[0])));
}

function dc_own(string $addr): bool {
    $dom = substr(strrchr($addr, '@') ?: '', 1);
    foreach (DC_OWN_DOMAINS as $d) if ($dom === $d || str_ends_with($dom, '.' . $d)) return true;
    return (bool)q('SELECT id FROM users WHERE LOWER(email) = ?', [$addr])->fetchColumn();
}

function deal_contacts(int $dealId): array {
    dc_table();
    $d = q('SELECT id, person_id, org_id FROM deals WHERE id = ?', [$dealId])->fetch();
    if (!$d) throw new RuntimeException('Affaire introuvable.');
    $roles = []; // person_id => liste des raisons
    $add = function ($pid, string $why) use (&$roles) { $pid = (int)$pid; if ($pid > 0 && !in_array($why, $roles[$pid] ?? [], true)) $roles[$pid][] = $why; };
    if ($d['person_id']) $add($d['person_id'], 'principal');
    foreach (q('SELECT person_id FROM crm_deal_persons WHERE deal_id = ?', [$dealId])->fetchAll(PDO::FETCH_COLUMN) as $pid) $add($pid, 'ajouté');
    if ($d['org_id']) foreach (q('SELECT id FROM persons WHERE org_id = ? ORDER BY name LIMIT 60', [(int)$d['org_id']])->fetchAll(PDO::FETCH_COLUMN) as $pid) $add($pid, 'organisation');
    foreach (q('SELECT DISTINCT person_id FROM activities WHERE deal_id = ? AND person_id IS NOT NULL', [$dealId])->fetchAll(PDO::FETCH_COLUMN) as $pid) $add($pid, 'activités');

    // Adresses des e-mails rattachés à l'affaire ou à son organisation
    $unknown = [];
    $hasMails = (bool)q("SHOW TABLES LIKE 'crm_emails'")->fetch();
    if ($hasMails) {
        $rows = $d['org_id']
            ? q('SELECT from_addr, to_addrs FROM crm_emails WHERE deal_id = ? OR org_id = ? ORDER BY sent_at DESC LIMIT 300', [$dealId, (int)$d['org_id']])->fetchAll()
            : q('SELECT from_addr, to_addrs FROM crm_emails WHERE deal_id = ? ORDER BY sent_at DESC LIMIT 300', [$dealId])->fetchAll();
        $seen = [];
        foreach ($rows as $r) foreach (dc_addrs(($r['from_addr'] ?? '') . ' ' . ($r['to_addrs'] ?? '')) as $a) {
            if (isset($seen[$a]) || dc_own($a)) continue; $seen[$a] = true;
            $pid = q('SELECT id FROM persons WHERE LOWER(emails) LIKE ? LIMIT 1', ['%' . str_replace(['%', '_'], ['\\%', '\\_'], $a) . '%'])->fetchColumn();
            if ($pid) $add($pid, 'e-mails'); else $unknown[] = $a;
        }
    }

    $out = [];
    if ($roles) {
        $ids = implode(',', array_map('intval', array_keys($roles)));
        foreach (q("SELECT p.id, p.name, p.emails, p.phones, p.org_id, o.name AS org_name FROM persons p LEFT JOIN orgs o ON o.id = p.org_id WHERE p.id IN ($ids)")->fetchAll() as $p) {
            $out[] = ['id' => (int)$p['id'], 'name' => $p['name'], 'org_id' => $p['org_id'] ? (int)$p['org_id'] : null, 'org_name' => $p['org_name'],
                      'emails' => dc_values($p['emails']), 'phones' => dc_values($p['phones']), 'roles' => $roles[(int)$p['id']]];
        }
        $rank = ['principal' => 0, 'ajouté' => 1, 'activités' => 2, 'e-mails' => 3, 'organisation' => 4];
        usort($out, fn($a, $b) => [min(array_map(fn($r) => $rank[$r] ?? 9, $a['roles'])), $a['name']] <=> [min(array_map(fn($r) => $rank[$r] ?? 9, $b['roles'])), $b['name']]);
    }
    return ['deal_id' => $dealId, 'contacts' => $out, 'unknown' => array_slice($unknown, 0, 30)];
}

function deal_contact_link(int $dealId, int $personId, bool $link): void {
    dc_table();
    if (!q('SELECT id FROM deals WHERE id = ?', [$dealId])->fetchColumn()) throw new RuntimeException('Affaire introuvable.');
    if (!q('SELECT id FROM persons WHERE id = ?', [$personId])->fetchColumn()) throw new RuntimeException('Personne introuvable.');
    if ($link) q('INSERT IGNORE INTO crm_deal_persons (deal_id, person_id, add_time) VALUES (?, ?, ?)', [$dealId, $personId, now_utc()]);
    else q('DELETE FROM crm_deal_persons WHERE deal_id = ? AND person_id = ?', [$dealId, $personId]);
}
