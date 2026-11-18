<?php
// Outils proposés à Claude par le serveur MCP du CRM. Chaque outil agit au nom de l'utilisateur connecté.
// Aucun outil ne supprime de données.
declare(strict_types=1);

const MCP_TZ = 'Europe/Paris';
const MCP_TYPES = ['call' => 'Appel', 'meeting' => 'Réunion', 'task' => 'Tâche', 'email' => 'E-mail', 'deadline' => 'Échéance', 'lunch' => 'Déjeuner'];
const MCP_STATUS = ['open' => 'en cours', 'won' => 'gagnée', 'lost' => 'perdue'];

final class McpToolError extends RuntimeException {}

/* ---------- utilitaires ---------- */
function mcp_today(): string { return (new DateTime('now', new DateTimeZone(MCP_TZ)))->format('Y-m-d'); }
function mcp_local(?string $utc): ?string {
    if (!$utc) return null;
    $d = new DateTime($utc, new DateTimeZone('UTC')); $d->setTimezone(new DateTimeZone(MCP_TZ));
    return $d->format('Y-m-d H:i');
}
function mcp_norm(string $s): string {
    $s = mb_strtolower(trim($s));
    $t = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
    return preg_replace('/[^a-z0-9]+/', ' ', $t !== false ? $t : $s);
}
function mcp_like(string $s): string { return '%' . addcslashes($s, '%_\\') . '%'; }
function mcp_int($v, string $what): int {
    if (!is_numeric($v) || (int)$v <= 0) throw new McpToolError("Identifiant $what invalide.");
    return (int)$v;
}
function mcp_date($v, string $what): ?string {
    if ($v === null || $v === '') return null;
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$v)) throw new McpToolError("$what : date attendue au format AAAA-MM-JJ.");
    return (string)$v;
}
function mcp_time($v): ?string {
    if ($v === null || $v === '') return null;
    if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string)$v)) throw new McpToolError('Heure attendue au format HH:MM.');
    return (string)$v;
}
function mcp_exists(string $table, int $id): void {
    if (!q("SELECT 1 FROM `$table` WHERE id = ?", [$id])->fetchColumn()) {
        $n = ['deals' => 'Affaire', 'orgs' => 'Organisation', 'persons' => 'Personne', 'activities' => 'Activité'][$table] ?? 'Fiche';
        throw new McpToolError("$n n° $id introuvable.");
    }
}
function mcp_users(): array {
    static $u = null;
    if ($u === null) { $u = []; foreach (q('SELECT id, name, email, active FROM users')->fetchAll() as $r) $u[(int)$r['id']] = $r; }
    return $u;
}
function mcp_user_name($id): ?string { return $id ? (mcp_users()[(int)$id]['name'] ?? null) : null; }
/* « me », un e-mail ou un nom (même partiel) vers l'identifiant d'un membre de l'équipe. */
function mcp_user_id($who, array $me): int {
    $w = trim((string)$who);
    if ($w === '' || mb_strtolower($w) === 'me' || mb_strtolower($w) === 'moi') return (int)$me['id'];
    if (ctype_digit($w) && isset(mcp_users()[(int)$w])) return (int)$w;
    $found = [];
    foreach (mcp_users() as $id => $u) {
        if (!$u['active']) continue;
        if ($u['email'] && strtolower($u['email']) === strtolower($w)) return $id;
        if (str_contains(mcp_norm($u['name']), mcp_norm($w))) $found[] = $id;
    }
    if (count($found) === 1) return $found[0];
    if (!$found) throw new McpToolError("Personne de l'équipe introuvable : $w. Utilisez list_pipelines pour voir l'équipe.");
    throw new McpToolError("Plusieurs personnes correspondent à « $w » : précisez avec l'e-mail.");
}
function mcp_pipelines(): array {
    $ps = q('SELECT id, name FROM pipelines ORDER BY position, id')->fetchAll();
    $ss = q('SELECT id, pipeline_id, name FROM stages ORDER BY position, id')->fetchAll();
    foreach ($ps as &$p) { $p['id'] = (int)$p['id']; $p['stages'] = array_values(array_map(fn($s) => ['id' => (int)$s['id'], 'name' => $s['name']], array_filter($ss, fn($s) => (int)$s['pipeline_id'] === $p['id']))); }
    return $ps;
}
function mcp_find_pipeline($v): array {
    $ps = mcp_pipelines();
    if (!$ps) throw new McpToolError('Aucun pipeline n\'existe dans le CRM.');
    if ($v === null || $v === '') return $ps[0];
    foreach ($ps as $p) if ((string)$p['id'] === (string)$v) return $p;
    $m = array_values(array_filter($ps, fn($p) => str_contains(mcp_norm($p['name']), mcp_norm((string)$v))));
    if (count($m) === 1) return $m[0];
    throw new McpToolError('Pipeline introuvable ou ambigu : ' . $v . '. Pipelines : ' . implode(', ', array_map(fn($p) => $p['name'], $ps)) . '.');
}
/* Étape par identifiant ou par nom, dans un pipeline donné (ou dans tous si aucun). */
function mcp_find_stage($v, ?array $pipe): array {
    $pool = [];
    foreach ($pipe ? [$pipe] : mcp_pipelines() as $p) foreach ($p['stages'] as $s) $pool[] = $s + ['pipeline_id' => $p['id'], 'pipeline' => $p['name']];
    foreach ($pool as $s) if ((string)$s['id'] === (string)$v) return $s;
    $exact = array_values(array_filter($pool, fn($s) => mcp_norm($s['name']) === mcp_norm((string)$v)));
    if (count($exact) === 1) return $exact[0];
    $m = array_values(array_filter($pool, fn($s) => str_contains(mcp_norm($s['name']), mcp_norm((string)$v))));
    if (count($m) === 1) return $m[0];
    $names = implode(', ', array_map(fn($s) => $s['name'], $pool));
    throw new McpToolError('Étape introuvable ou ambiguë : ' . $v . '. Étapes possibles : ' . $names . '.');
}
function mcp_stage_info($stageId): array {
    if (!$stageId) return [null, null];
    $r = q('SELECT s.name, p.name AS pname FROM stages s JOIN pipelines p ON p.id = s.pipeline_id WHERE s.id = ?', [$stageId])->fetch();
    return $r ? [$r['pname'], $r['name']] : [null, null];
}
function mcp_extra_labeled(string $entity, ?string $json): array {
    $ex = $json ? (json_decode($json, true) ?: []) : [];
    if (!$ex) return [];
    $labels = [];
    foreach (q('SELECT fkey, label FROM fields WHERE entity = ?', [$entity])->fetchAll() as $f) $labels[$f['fkey']] = $f['label'];
    $out = [];
    foreach ($ex as $k => $v) if ($v !== null && $v !== '') $out[$labels[$k] ?? $k] = $v;
    return $out;
}
function mcp_tags(string $entity, int $id): array {
    if (!function_exists('tags_of')) { if (is_file(__DIR__ . '/tags.php')) require_once __DIR__ . '/tags.php'; else return []; }
    try { return tags_of($entity, $id); } catch (Throwable $e) { return []; }
}
function mcp_list_json(?string $j): array { return array_values(array_map(fn($x) => $x['value'] ?? '', $j ? (json_decode($j, true) ?: []) : [])); }
function mcp_append_note(?string $old, string $text, array $me): string {
    $stamp = (new DateTime('now', new DateTimeZone(MCP_TZ)))->format('d/m/Y H:i');
    $entry = "[$stamp, {$me['name']}] " . trim($text);
    return trim((string)$old) === '' ? $entry : rtrim((string)$old) . "\n\n" . $entry;
}

/* ---------- mise en forme ---------- */
function mcp_fmt_deal(array $d, bool $full = false): array {
    [$pname, $sname] = mcp_stage_info($d['stage_id']);
    $o = ['id' => (int)$d['id'], 'titre' => $d['title'], 'statut' => MCP_STATUS[$d['status']] ?? $d['status'], 'valeur' => (float)$d['value'], 'devise' => $d['currency'],
          'pipeline' => $pname, 'etape' => $sname, 'responsable' => mcp_user_name($d['owner_id']),
          'organisation' => $d['org_id'] ? ['id' => (int)$d['org_id'], 'nom' => $d['org_name'] ?? null] : null,
          'personne' => $d['person_id'] ? ['id' => (int)$d['person_id'], 'nom' => $d['person_name'] ?? null] : null,
          'cloture_prevue' => $d['expected_close_date'], 'creee_le' => mcp_local($d['add_time']), 'modifiee_le' => mcp_local($d['update_time'])];
    if (array_key_exists('next_due', $d)) $o['prochaine_activite'] = $d['next_due'] ? trim($d['next_due'] . ' ' . ($d['next_subject'] ?? '')) : null;
    if ($d['status'] === 'lost') $o['raison_perte'] = $d['lost_reason'];
    if ($d['status'] === 'won') $o['gagnee_le'] = mcp_local($d['won_time']);
    if ($full) {
        $o['notes'] = $d['notes'];
        $o['champs'] = mcp_extra_labeled('deal', $d['extra']) ?: new stdClass;
        $o['tags'] = mcp_tags('deal', (int)$d['id']);
    }
    return $o;
}
function mcp_fmt_act(array $a): array {
    return ['id' => (int)$a['id'], 'type' => MCP_TYPES[$a['type']] ?? $a['type'], 'objet' => $a['subject'], 'date' => $a['due_date'], 'heure' => $a['due_time'],
        'duree_min' => $a['duration'] !== null ? (int)$a['duration'] : null, 'faite' => (bool)$a['done'], 'faite_le' => mcp_local($a['done_time']),
        'responsable' => mcp_user_name($a['owner_id']),
        'affaire' => $a['deal_id'] ? ['id' => (int)$a['deal_id'], 'titre' => $a['deal_title'] ?? null] : null,
        'organisation' => $a['org_id'] ? ['id' => (int)$a['org_id'], 'nom' => $a['org_name'] ?? null] : null,
        'personne' => $a['person_id'] ? ['id' => (int)$a['person_id'], 'nom' => $a['person_name'] ?? null] : null,
        'note' => $a['note'] !== null && $a['note'] !== '' ? mb_substr($a['note'], 0, 2000) : null];
}
function mcp_fmt_org(array $o, bool $full = false): array {
    $r = ['id' => (int)$o['id'], 'nom' => $o['name'], 'adresse' => $o['address'], 'site_web' => $o['website'], 'responsable' => mcp_user_name($o['owner_id'])];
    if ($full) { $r['notes'] = $o['notes']; $r['champs'] = mcp_extra_labeled('org', $o['extra']) ?: new stdClass; $r['tags'] = mcp_tags('org', (int)$o['id']); }
    return $r;
}
function mcp_fmt_person(array $p, bool $full = false): array {
    $r = ['id' => (int)$p['id'], 'nom' => $p['name'], 'organisation' => $p['org_id'] ? ['id' => (int)$p['org_id'], 'nom' => $p['org_name'] ?? null] : null,
          'emails' => mcp_list_json($p['emails']), 'telephones' => mcp_list_json($p['phones']), 'responsable' => mcp_user_name($p['owner_id'])];
    if ($full) { $r['notes'] = $p['notes']; $r['champs'] = mcp_extra_labeled('person', $p['extra']) ?: new stdClass; $r['tags'] = mcp_tags('person', (int)$p['id']); }
    return $r;
}

const MCP_DEAL_SQL = 'SELECT d.*, o.name AS org_name, p.name AS person_name FROM deals d LEFT JOIN orgs o ON o.id = d.org_id LEFT JOIN persons p ON p.id = d.person_id';
const MCP_ACT_SQL = 'SELECT a.*, d.title AS deal_title, o.name AS org_name, p.name AS person_name FROM activities a LEFT JOIN deals d ON d.id = a.deal_id LEFT JOIN orgs o ON o.id = a.org_id LEFT JOIN persons p ON p.id = a.person_id';
const MCP_PERSON_SQL = 'SELECT p.*, o.name AS org_name FROM persons p LEFT JOIN orgs o ON o.id = p.org_id';

function mcp_get_deal_row(int $id): array { $r = q(MCP_DEAL_SQL . ' WHERE d.id = ?', [$id])->fetch(); if (!$r) throw new McpToolError("Affaire n° $id introuvable."); return $r; }
function mcp_get_act_row(int $id): array { $r = q(MCP_ACT_SQL . ' WHERE a.id = ?', [$id])->fetch(); if (!$r) throw new McpToolError("Activité n° $id introuvable."); return $r; }
function mcp_acts_for(string $col, int $id, int $limit = 40): array {
    return array_map('mcp_fmt_act', q(MCP_ACT_SQL . " WHERE a.$col = ? ORDER BY a.done ASC, COALESCE(a.due_date, '9999-12-31') ASC, a.due_time ASC LIMIT $limit", [$id])->fetchAll());
}

/* ---------- définition des outils ---------- */
function mcp_tool_defs(): array {
    $s = fn(string $d, array $extra = []) => ['type' => 'string', 'description' => $d] + $extra;
    $i = fn(string $d) => ['type' => 'integer', 'description' => $d];
    $obj = fn(array $props, array $req = []) => ['type' => 'object', 'properties' => (object)$props, 'required' => $req, 'additionalProperties' => false];
    $ro = ['readOnlyHint' => true, 'destructiveHint' => false, 'openWorldHint' => false];
    $rw = ['readOnlyHint' => false, 'destructiveHint' => false, 'idempotentHint' => false, 'openWorldHint' => false];
    $owner = $s("Responsable : « me » pour l'utilisateur connecté, l'e-mail ou le nom d'un membre de l'équipe.");
    $typeEnum = $s('Type d\'activité.', ['enum' => array_keys(MCP_TYPES)]);
    return [
        ['name' => 'list_pipelines', 'title' => 'Pipelines, étapes et équipe', 'annotations' => $ro + ['title' => 'Pipelines, étapes et équipe'],
         'description' => "Liste les pipelines du CRM avec leurs étapes dans l'ordre, et les membres de l'équipe (nom, e-mail). À appeler avant de créer ou de déplacer une affaire.",
         'inputSchema' => $obj([])],
        ['name' => 'search_contacts', 'title' => 'Chercher une organisation ou une personne', 'annotations' => $ro + ['title' => 'Chercher un contact'],
         'description' => 'Cherche des organisations et des personnes par nom, e-mail ou nom d\'organisation. Renvoie leurs identifiants pour les autres outils.',
         'inputSchema' => $obj(['query' => $s('Texte à chercher (nom, e-mail, organisation).'), 'kind' => $s('Type de fiche.', ['enum' => ['all', 'org', 'person']]), 'limit' => $i('Nombre maximum de résultats par type (défaut 15, maximum 50).')], ['query'])],
        ['name' => 'get_organization', 'title' => 'Fiche d\'une organisation', 'annotations' => $ro + ['title' => 'Fiche organisation'],
         'description' => 'Donne la fiche complète d\'une organisation : coordonnées, notes, champs complémentaires, personnes, affaires et activités.',
         'inputSchema' => $obj(['id' => $i('Identifiant de l\'organisation.')], ['id'])],
        ['name' => 'get_person', 'title' => 'Fiche d\'une personne', 'annotations' => $ro + ['title' => 'Fiche personne'],
         'description' => 'Donne la fiche complète d\'une personne : organisation, e-mails, téléphones, notes, affaires et activités.',
         'inputSchema' => $obj(['id' => $i('Identifiant de la personne.')], ['id'])],
        ['name' => 'list_deals', 'title' => 'Lister les affaires', 'annotations' => $ro + ['title' => 'Lister les affaires'],
         'description' => 'Liste les affaires avec filtres. Par défaut : affaires en cours de toute l\'équipe, les plus récemment modifiées d\'abord. Chaque affaire indique sa prochaine activité prévue.',
         'inputSchema' => $obj(['status' => $s('Statut.', ['enum' => ['open', 'won', 'lost', 'all']]), 'pipeline' => $s('Nom ou identifiant du pipeline.'), 'stage' => $s('Nom ou identifiant de l\'étape.'),
            'owner' => $s("Responsable : « me », « all » (défaut), e-mail ou nom."), 'query' => $s('Texte cherché dans le titre de l\'affaire ou le nom de l\'organisation.'),
            'org_id' => $i('Seulement les affaires de cette organisation.'), 'person_id' => $i('Seulement les affaires de cette personne.'),
            'without_next_activity' => ['type' => 'boolean', 'description' => 'Seulement les affaires en cours sans aucune activité prévue.'], 'limit' => $i('Nombre maximum (défaut 50, maximum 200).')])],
        ['name' => 'get_deal', 'title' => 'Fiche d\'une affaire', 'annotations' => $ro + ['title' => 'Fiche affaire'],
         'description' => 'Donne la fiche complète d\'une affaire : étape, valeur, organisation, personne, notes, champs complémentaires, tags, tous les contacts liés (personne principale, contacts ajoutés, personnes de l\'organisation, des activités et des e-mails, avec les adresses e-mail sans fiche) et toutes ses activités (à faire et historique).',
         'inputSchema' => $obj(['id' => $i('Identifiant de l\'affaire.')], ['id'])],
        ['name' => 'list_activities', 'title' => 'Lister les activités', 'annotations' => $ro + ['title' => 'Lister les activités'],
         'description' => 'Liste les activités (appels, réunions, tâches, e-mails, échéances). Par défaut : les activités à faire de l\'utilisateur connecté. Les dates sont à l\'heure de Paris.',
         'inputSchema' => $obj(['scope' => $s('overdue = en retard, today = aujourd\'hui, upcoming = 7 prochains jours, todo = toutes celles à faire (défaut), done = faites récemment.', ['enum' => ['overdue', 'today', 'upcoming', 'todo', 'done']]),
            'owner' => $s("« me » (défaut), « all », e-mail ou nom."), 'type' => $typeEnum, 'deal_id' => $i('Seulement pour cette affaire.'), 'org_id' => $i('Seulement pour cette organisation.'),
            'person_id' => $i('Seulement pour cette personne.'), 'days' => $i('Pour scope=done : nombre de jours en arrière (défaut 14).'), 'limit' => $i('Nombre maximum (défaut 50, maximum 200).')])],
        ['name' => 'create_activity', 'title' => 'Planifier une activité', 'annotations' => $rw + ['title' => 'Planifier une activité'],
         'description' => 'Crée une activité (appel, réunion, tâche…), éventuellement liée à une affaire, une organisation ou une personne. Liée à une affaire, elle reprend son organisation et sa personne. Mettre done=true pour garder la trace d\'un échange déjà fait.',
         'inputSchema' => $obj(['subject' => $s('Objet de l\'activité.'), 'type' => $typeEnum, 'due_date' => $s('Date AAAA-MM-JJ (défaut : aujourd\'hui).'), 'due_time' => $s('Heure HH:MM, heure de Paris.'),
            'duration_min' => $i('Durée en minutes.'), 'note' => $s('Note ou compte rendu.'), 'deal_id' => $i('Affaire liée.'), 'org_id' => $i('Organisation liée.'), 'person_id' => $i('Personne liée.'),
            'owner' => $owner, 'done' => ['type' => 'boolean', 'description' => 'Déjà faite.']], ['subject'])],
        ['name' => 'update_activity', 'title' => 'Modifier une activité', 'annotations' => $rw + ['title' => 'Modifier une activité'],
         'description' => 'Modifie une activité : la marquer faite ou à refaire, la reporter, changer son objet, sa note, son responsable ou ses liens. Seuls les champs fournis changent.',
         'inputSchema' => $obj(['id' => $i('Identifiant de l\'activité.'), 'done' => ['type' => 'boolean', 'description' => 'true = faite, false = à faire.'], 'subject' => $s('Nouvel objet.'), 'type' => $typeEnum,
            'due_date' => $s('Nouvelle date AAAA-MM-JJ.'), 'due_time' => $s('Nouvelle heure HH:MM (chaîne vide pour retirer l\'heure).'), 'duration_min' => $i('Durée en minutes.'),
            'note' => $s('Remplace la note.'), 'append_note' => $s('Texte ajouté à la fin de la note existante.'), 'deal_id' => $i('Affaire liée (0 pour retirer).'),
            'org_id' => $i('Organisation liée (0 pour retirer).'), 'person_id' => $i('Personne liée (0 pour retirer).'), 'owner' => $owner], ['id'])],
        ['name' => 'create_deal', 'title' => 'Créer une affaire', 'annotations' => $rw + ['title' => 'Créer une affaire'],
         'description' => 'Crée une affaire. L\'organisation peut être donnée par identifiant ou par nom (créée si elle n\'existe pas). Sans pipeline ni étape, l\'affaire va dans la première étape du premier pipeline.',
         'inputSchema' => $obj(['title' => $s('Titre de l\'affaire.'), 'org_id' => $i('Organisation existante.'), 'org_name' => $s('Nom de l\'organisation si org_id est inconnu.'), 'person_id' => $i('Personne liée.'),
            'value' => ['type' => 'number', 'description' => 'Valeur en euros.'], 'pipeline' => $s('Nom ou identifiant du pipeline.'), 'stage' => $s('Nom ou identifiant de l\'étape.'),
            'owner' => $owner, 'expected_close_date' => $s('Date de clôture prévue AAAA-MM-JJ.'), 'notes' => $s('Notes de départ.')], ['title'])],
        ['name' => 'update_deal', 'title' => 'Modifier une affaire', 'annotations' => $rw + ['title' => 'Modifier une affaire'],
         'description' => 'Modifie une affaire : changer d\'étape ou de pipeline, la marquer gagnée, perdue (avec la raison) ou la rouvrir, changer sa valeur, son titre, son responsable, sa date de clôture, ses liens ou ses champs complémentaires. Seuls les champs fournis changent.',
         'inputSchema' => $obj(['id' => $i('Identifiant de l\'affaire.'), 'title' => $s('Nouveau titre.'), 'stage' => $s('Nouvelle étape (nom ou identifiant).'), 'pipeline' => $s('Nouveau pipeline (nom ou identifiant).'),
            'status' => $s('Nouveau statut.', ['enum' => ['open', 'won', 'lost']]), 'lost_reason' => $s('Raison de la perte.'), 'value' => ['type' => 'number', 'description' => 'Valeur en euros.'],
            'owner' => $owner, 'expected_close_date' => $s('Date AAAA-MM-JJ (chaîne vide pour retirer).'), 'org_id' => $i('Organisation (0 pour retirer).'), 'person_id' => $i('Personne principale (0 pour retirer).'),
            'add_contacts' => ['type' => 'array', 'items' => ['type' => 'integer'], 'description' => 'Identifiants de personnes à lier à l\'affaire comme contacts (en plus de la personne principale).'],
            'remove_contacts' => ['type' => 'array', 'items' => ['type' => 'integer'], 'description' => 'Identifiants de personnes ajoutées à délier de l\'affaire (la fiche personne n\'est pas supprimée).'],
            'fields' => ['type' => 'object', 'description' => 'Champs complémentaires à modifier, par leur libellé exact tel que donné par get_deal (valeur texte ; chaîne vide pour vider).', 'additionalProperties' => ['type' => 'string']]], ['id'])],
        ['name' => 'add_note', 'title' => 'Ajouter une note', 'annotations' => $rw + ['title' => 'Ajouter une note'],
         'description' => 'Ajoute une note datée et signée à la fin des notes d\'une affaire, d\'une organisation ou d\'une personne, sans effacer les notes existantes.',
         'inputSchema' => $obj(['target' => $s('Type de fiche.', ['enum' => ['deal', 'org', 'person']]), 'id' => $i('Identifiant de la fiche.'), 'text' => $s('Texte de la note.')], ['target', 'id', 'text'])],
        ['name' => 'create_organization', 'title' => 'Créer une organisation', 'annotations' => $rw + ['title' => 'Créer une organisation'],
         'description' => 'Crée une organisation. Vérifiez d\'abord avec search_contacts qu\'elle n\'existe pas déjà.',
         'inputSchema' => $obj(['name' => $s('Nom.'), 'address' => $s('Adresse.'), 'website' => $s('Site web.'), 'owner' => $owner, 'notes' => $s('Notes.')], ['name'])],
        ['name' => 'update_organization', 'title' => 'Modifier une organisation', 'annotations' => $rw + ['title' => 'Modifier une organisation'],
         'description' => 'Modifie le nom, l\'adresse, le site web ou le responsable d\'une organisation. Seuls les champs fournis changent.',
         'inputSchema' => $obj(['id' => $i('Identifiant.'), 'name' => $s('Nouveau nom.'), 'address' => $s('Adresse.'), 'website' => $s('Site web.'), 'owner' => $owner], ['id'])],
        ['name' => 'create_person', 'title' => 'Créer une personne', 'annotations' => $rw + ['title' => 'Créer une personne'],
         'description' => 'Crée une personne, éventuellement rattachée à une organisation. Vérifiez d\'abord avec search_contacts qu\'elle n\'existe pas déjà.',
         'inputSchema' => $obj(['name' => $s('Prénom et nom.'), 'org_id' => $i('Organisation de rattachement.'), 'emails' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Adresses e-mail, la principale en premier.'],
            'phones' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Téléphones, le principal en premier.'], 'owner' => $owner, 'notes' => $s('Notes.')], ['name'])],
        ['name' => 'update_person', 'title' => 'Modifier une personne', 'annotations' => $rw + ['title' => 'Modifier une personne'],
         'description' => 'Modifie une personne. Les listes emails et phones remplacent les listes existantes ; add_email et add_phone ajoutent sans rien retirer. Seuls les champs fournis changent.',
         'inputSchema' => $obj(['id' => $i('Identifiant.'), 'name' => $s('Prénom et nom.'), 'org_id' => $i('Organisation (0 pour retirer).'),
            'emails' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Remplace toutes les adresses e-mail.'], 'add_email' => $s('Adresse e-mail à ajouter.'),
            'phones' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'Remplace tous les téléphones.'], 'add_phone' => $s('Téléphone à ajouter.'), 'owner' => $owner], ['id'])],
    ];
}

/* ---------- exécution ---------- */
function mcp_call_tool(string $name, array $a, array $me) {
    $now = now_utc();
    $lim = fn($v, $def, $max) => max(1, min($max, (int)($v ?: $def)));
    switch ($name) {
    case 'list_pipelines':
        $team = array_values(array_map(fn($u) => ['id' => (int)$u['id'], 'nom' => $u['name'], 'email' => $u['email']], array_filter(mcp_users(), fn($u) => $u['active'])));
        return ['pipelines' => array_map(fn($p) => ['id' => $p['id'], 'nom' => $p['name'], 'etapes' => array_map(fn($s) => ['id' => $s['id'], 'nom' => $s['name']], $p['stages'])], mcp_pipelines()),
                'equipe' => $team, 'utilisateur_connecte' => ['id' => (int)$me['id'], 'nom' => $me['name']], 'aujourd_hui' => mcp_today()];

    case 'search_contacts':
        $qs = trim((string)($a['query'] ?? ''));
        if ($qs === '') throw new McpToolError('Indiquez un texte à chercher.');
        $kind = $a['kind'] ?? 'all'; $n = $lim($a['limit'] ?? 0, 15, 50);
        $toks = array_slice(array_values(array_filter(preg_split('/\s+/u', $qs))), 0, 5);
        $out = [];
        if ($kind !== 'person') {
            $w = []; $p = []; foreach ($toks as $t) { $w[] = '(o.name LIKE ? OR o.address LIKE ?)'; array_push($p, mcp_like($t), mcp_like($t)); }
            $p[] = $toks[0] . '%';
            $out['organisations'] = array_map(fn($o) => mcp_fmt_org($o) + ['affaires_en_cours' => (int)q("SELECT COUNT(*) FROM deals WHERE org_id = ? AND status = 'open'", [$o['id']])->fetchColumn()],
                q('SELECT o.* FROM orgs o WHERE ' . implode(' AND ', $w) . " ORDER BY (o.name LIKE ?) DESC, o.name LIMIT $n", $p)->fetchAll());
        }
        if ($kind !== 'org') {
            $w = []; $p = []; foreach ($toks as $t) { $w[] = '(p.name LIKE ? OR p.emails LIKE ? OR o.name LIKE ?)'; array_push($p, mcp_like($t), mcp_like($t), mcp_like($t)); }
            $p[] = $toks[0] . '%';
            $out['personnes'] = array_map(fn($x) => mcp_fmt_person($x), q(MCP_PERSON_SQL . ' WHERE ' . implode(' AND ', $w) . " ORDER BY (p.name LIKE ?) DESC, p.name LIMIT $n", $p)->fetchAll());
        }
        return $out;

    case 'get_organization':
        $id = mcp_int($a['id'] ?? null, "d'organisation");
        $o = q('SELECT * FROM orgs WHERE id = ?', [$id])->fetch();
        if (!$o) throw new McpToolError("Organisation n° $id introuvable.");
        return mcp_fmt_org($o, true) + [
            'personnes' => array_map(fn($x) => mcp_fmt_person($x), q(MCP_PERSON_SQL . ' WHERE p.org_id = ? ORDER BY p.name LIMIT 100', [$id])->fetchAll()),
            'affaires' => array_map(fn($d) => mcp_fmt_deal($d), q(MCP_DEAL_SQL . " WHERE d.org_id = ? ORDER BY d.status = 'open' DESC, d.update_time DESC LIMIT 50", [$id])->fetchAll()),
            'activites' => mcp_acts_for('org_id', $id)];

    case 'get_person':
        $id = mcp_int($a['id'] ?? null, 'de personne');
        $p = q(MCP_PERSON_SQL . ' WHERE p.id = ?', [$id])->fetch();
        if (!$p) throw new McpToolError("Personne n° $id introuvable.");
        return mcp_fmt_person($p, true) + [
            'affaires' => array_map(fn($d) => mcp_fmt_deal($d), q(MCP_DEAL_SQL . " WHERE d.person_id = ? ORDER BY d.status = 'open' DESC, d.update_time DESC LIMIT 50", [$id])->fetchAll()),
            'activites' => mcp_acts_for('person_id', $id)];

    case 'list_deals':
        $w = []; $p = [];
        $st = $a['status'] ?? 'open';
        if ($st !== 'all') { if (!isset(MCP_STATUS[$st])) throw new McpToolError('Statut inconnu.'); $w[] = 'd.status = ?'; $p[] = $st; }
        $pipe = null;
        if (!empty($a['pipeline'])) { $pipe = mcp_find_pipeline($a['pipeline']); $w[] = 'd.pipeline_id = ?'; $p[] = $pipe['id']; }
        if (!empty($a['stage'])) { $s = mcp_find_stage($a['stage'], $pipe); $w[] = 'd.stage_id = ?'; $p[] = $s['id']; }
        $own = (string)($a['owner'] ?? 'all');
        if ($own !== '' && mb_strtolower($own) !== 'all') { $w[] = 'd.owner_id = ?'; $p[] = mcp_user_id($own, $me); }
        if (!empty($a['query'])) { $w[] = '(d.title LIKE ? OR o.name LIKE ?)'; array_push($p, mcp_like((string)$a['query']), mcp_like((string)$a['query'])); }
        if (!empty($a['org_id'])) { $w[] = 'd.org_id = ?'; $p[] = (int)$a['org_id']; }
        if (!empty($a['person_id'])) { $w[] = 'd.person_id = ?'; $p[] = (int)$a['person_id']; }
        $next = "(SELECT CONCAT_WS(' ', a2.due_date, a2.due_time) FROM activities a2 WHERE a2.deal_id = d.id AND a2.done = 0 ORDER BY COALESCE(a2.due_date, '9999-12-31'), a2.due_time LIMIT 1)";
        $nextSub = "(SELECT a3.subject FROM activities a3 WHERE a3.deal_id = d.id AND a3.done = 0 ORDER BY COALESCE(a3.due_date, '9999-12-31'), a3.due_time LIMIT 1)";
        if (!empty($a['without_next_activity'])) $w[] = "d.status = 'open' AND NOT EXISTS (SELECT 1 FROM activities a4 WHERE a4.deal_id = d.id AND a4.done = 0)";
        $n = $lim($a['limit'] ?? 0, 50, 200);
        $sql = "SELECT d.*, o.name AS org_name, p.name AS person_name, $next AS next_due, $nextSub AS next_subject FROM deals d LEFT JOIN orgs o ON o.id = d.org_id LEFT JOIN persons p ON p.id = d.person_id"
             . ($w ? ' WHERE ' . implode(' AND ', $w) : '') . " ORDER BY d.update_time DESC LIMIT $n";
        $rows = q($sql, $p)->fetchAll();
        $total = (int)q('SELECT COUNT(*) FROM deals d LEFT JOIN orgs o ON o.id = d.org_id' . ($w ? ' WHERE ' . implode(' AND ', $w) : ''), $p)->fetchColumn();
        return ['total' => $total, 'affichees' => count($rows), 'affaires' => array_map(fn($d) => mcp_fmt_deal($d), $rows)];

    case 'get_deal':
        $id = mcp_int($a['id'] ?? null, "d'affaire");
        require_once __DIR__ . '/contacts.php';
        $dc = deal_contacts($id);
        return mcp_fmt_deal(mcp_get_deal_row($id), true) + ['contacts' => array_map(fn($c) => ['id' => $c['id'], 'nom' => $c['name'], 'organisation' => $c['org_name'], 'emails' => $c['emails'], 'telephones' => $c['phones'], 'lien' => implode(', ', $c['roles'])], $dc['contacts']),
            'adresses_sans_fiche' => $dc['unknown'], 'activites' => mcp_acts_for('deal_id', $id, 100)];

    case 'list_activities':
        $w = []; $p = []; $t = mcp_today();
        $scope = $a['scope'] ?? 'todo';
        if ($scope === 'done') { $days = max(1, min(365, (int)($a['days'] ?? 14))); $w[] = 'a.done = 1 AND a.done_time >= ?'; $p[] = gmdate('Y-m-d H:i:s', time() - $days * 86400); }
        else {
            $w[] = 'a.done = 0';
            if ($scope === 'overdue') { $w[] = 'a.due_date < ?'; $p[] = $t; }
            elseif ($scope === 'today') { $w[] = 'a.due_date = ?'; $p[] = $t; }
            elseif ($scope === 'upcoming') { $w[] = 'a.due_date BETWEEN ? AND ?'; array_push($p, $t, (new DateTime($t))->modify('+7 days')->format('Y-m-d')); }
            elseif ($scope !== 'todo') throw new McpToolError('scope inconnu.');
        }
        $own = (string)($a['owner'] ?? 'me');
        if (mb_strtolower($own) !== 'all') { $w[] = 'a.owner_id = ?'; $p[] = mcp_user_id($own, $me); }
        if (!empty($a['type'])) { $w[] = 'a.type = ?'; $p[] = (string)$a['type']; }
        foreach (['deal_id', 'org_id', 'person_id'] as $k) if (!empty($a[$k])) { $w[] = "a.$k = ?"; $p[] = (int)$a[$k]; }
        $n = $lim($a['limit'] ?? 0, 50, 200);
        $order = $scope === 'done' ? 'a.done_time DESC' : "COALESCE(a.due_date, '9999-12-31') ASC, a.due_time ASC";
        $rows = q(MCP_ACT_SQL . ' WHERE ' . implode(' AND ', $w) . " ORDER BY $order LIMIT $n", $p)->fetchAll();
        return ['aujourd_hui' => $t, 'nombre' => count($rows), 'activites' => array_map('mcp_fmt_act', $rows)];

    case 'create_activity':
        $subject = trim((string)($a['subject'] ?? ''));
        if ($subject === '') throw new McpToolError('L\'objet de l\'activité est obligatoire.');
        $type = (string)($a['type'] ?? 'task'); if (!isset(MCP_TYPES[$type])) throw new McpToolError('Type d\'activité inconnu.');
        $row = ['type' => $type, 'subject' => mb_substr($subject, 0, 500), 'due_date' => mcp_date($a['due_date'] ?? null, 'due_date') ?? mcp_today(), 'due_time' => mcp_time($a['due_time'] ?? null),
                'duration' => isset($a['duration_min']) ? max(0, (int)$a['duration_min']) : null, 'note' => (string)($a['note'] ?? ''), 'owner_id' => mcp_user_id($a['owner'] ?? 'me', $me),
                'deal_id' => null, 'org_id' => null, 'person_id' => null, 'done' => !empty($a['done']) ? 1 : 0, 'done_time' => !empty($a['done']) ? $now : null, 'add_time' => $now, 'update_time' => $now];
        if (!empty($a['deal_id'])) { $d = mcp_get_deal_row((int)$a['deal_id']); $row['deal_id'] = (int)$d['id']; $row['org_id'] = $d['org_id'] ? (int)$d['org_id'] : null; $row['person_id'] = $d['person_id'] ? (int)$d['person_id'] : null; }
        if (!empty($a['org_id'])) { mcp_exists('orgs', (int)$a['org_id']); $row['org_id'] = (int)$a['org_id']; }
        if (!empty($a['person_id'])) { mcp_exists('persons', (int)$a['person_id']); $row['person_id'] = (int)$a['person_id'];
            if (!$row['org_id']) { $po = q('SELECT org_id FROM persons WHERE id = ?', [(int)$a['person_id']])->fetchColumn(); if ($po) $row['org_id'] = (int)$po; } }
        q('INSERT INTO activities (`' . implode('`,`', array_keys($row)) . '`) VALUES (' . implode(',', array_fill(0, count($row), '?')) . ')', array_values($row));
        return ['cree' => true, 'activite' => mcp_fmt_act(mcp_get_act_row((int)db()->lastInsertId()))];

    case 'update_activity':
        $id = mcp_int($a['id'] ?? null, "d'activité"); $cur = mcp_get_act_row($id);
        $set = [];
        if (array_key_exists('done', $a)) { $set['done'] = $a['done'] ? 1 : 0; $set['done_time'] = $a['done'] ? ($cur['done'] ? $cur['done_time'] : $now) : null; }
        if (isset($a['subject']) && trim((string)$a['subject']) !== '') $set['subject'] = mb_substr(trim((string)$a['subject']), 0, 500);
        if (isset($a['type'])) { if (!isset(MCP_TYPES[$a['type']])) throw new McpToolError('Type d\'activité inconnu.'); $set['type'] = $a['type']; }
        if (array_key_exists('due_date', $a)) $set['due_date'] = mcp_date($a['due_date'], 'due_date');
        if (array_key_exists('due_time', $a)) $set['due_time'] = mcp_time($a['due_time']);
        if (array_key_exists('duration_min', $a)) $set['duration'] = $a['duration_min'] === null ? null : max(0, (int)$a['duration_min']);
        if (array_key_exists('note', $a)) $set['note'] = (string)$a['note'];
        if (!empty($a['append_note'])) $set['note'] = mcp_append_note($set['note'] ?? $cur['note'], (string)$a['append_note'], $me);
        foreach (['deal_id' => 'deals', 'org_id' => 'orgs', 'person_id' => 'persons'] as $k => $tbl) if (array_key_exists($k, $a)) {
            $v = (int)$a[$k]; if ($v) mcp_exists($tbl, $v); $set[$k] = $v ?: null; }
        if (isset($a['owner'])) $set['owner_id'] = mcp_user_id($a['owner'], $me);
        if (!$set) throw new McpToolError('Aucune modification demandée.');
        $set['update_time'] = $now;
        q('UPDATE activities SET ' . implode(',', array_map(fn($k) => "`$k` = ?", array_keys($set))) . ' WHERE id = ?', [...array_values($set), $id]);
        return ['modifie' => true, 'activite' => mcp_fmt_act(mcp_get_act_row($id))];

    case 'create_deal':
        $title = trim((string)($a['title'] ?? ''));
        if ($title === '') throw new McpToolError('Le titre de l\'affaire est obligatoire.');
        $pipe = mcp_find_pipeline($a['pipeline'] ?? null);
        $stage = !empty($a['stage']) ? mcp_find_stage($a['stage'], $pipe) : ($pipe['stages'][0] ?? null);
        if (!$stage) throw new McpToolError('Ce pipeline n\'a aucune étape.');
        $orgId = null;
        if (!empty($a['org_id'])) { mcp_exists('orgs', (int)$a['org_id']); $orgId = (int)$a['org_id']; }
        elseif (!empty($a['org_name'])) {
            $nm = trim((string)$a['org_name']);
            $orgId = (int)q('SELECT id FROM orgs WHERE name = ? ORDER BY id LIMIT 1', [$nm])->fetchColumn();
            if (!$orgId) { q('INSERT INTO orgs (name, owner_id, add_time, update_time) VALUES (?, ?, ?, ?)', [mb_substr($nm, 0, 255), $me['id'], $now, $now]); $orgId = (int)db()->lastInsertId(); }
        }
        $personId = null;
        if (!empty($a['person_id'])) { mcp_exists('persons', (int)$a['person_id']); $personId = (int)$a['person_id'];
            if (!$orgId) { $po = q('SELECT org_id FROM persons WHERE id = ?', [$personId])->fetchColumn(); if ($po) $orgId = (int)$po; } }
        $row = ['title' => mb_substr($title, 0, 255), 'value' => (float)($a['value'] ?? 0), 'currency' => 'EUR', 'pipeline_id' => $pipe['id'], 'stage_id' => $stage['id'], 'status' => 'open',
                'owner_id' => mcp_user_id($a['owner'] ?? 'me', $me), 'org_id' => $orgId, 'person_id' => $personId, 'expected_close_date' => mcp_date($a['expected_close_date'] ?? null, 'expected_close_date'),
                'notes' => (string)($a['notes'] ?? ''), 'add_time' => $now, 'update_time' => $now, 'stage_change_time' => $now];
        q('INSERT INTO deals (`' . implode('`,`', array_keys($row)) . '`) VALUES (' . implode(',', array_fill(0, count($row), '?')) . ')', array_values($row));
        return ['cree' => true, 'affaire' => mcp_fmt_deal(mcp_get_deal_row((int)db()->lastInsertId()))];

    case 'update_deal':
        $id = mcp_int($a['id'] ?? null, "d'affaire"); $cur = mcp_get_deal_row($id);
        $set = [];
        if (isset($a['title']) && trim((string)$a['title']) !== '') $set['title'] = mb_substr(trim((string)$a['title']), 0, 255);
        if (array_key_exists('value', $a)) $set['value'] = (float)$a['value'];
        if (!empty($a['pipeline'])) {
            $pipe = mcp_find_pipeline($a['pipeline']);
            $stage = !empty($a['stage']) ? mcp_find_stage($a['stage'], $pipe) : ($pipe['stages'][0] ?? null);
            if (!$stage) throw new McpToolError('Ce pipeline n\'a aucune étape.');
            $set['pipeline_id'] = $pipe['id']; $set['stage_id'] = $stage['id']; $set['stage_change_time'] = $now;
        } elseif (!empty($a['stage'])) {
            $pipe = $cur['pipeline_id'] ? (array_values(array_filter(mcp_pipelines(), fn($p) => $p['id'] === (int)$cur['pipeline_id']))[0] ?? null) : null;
            $stage = mcp_find_stage($a['stage'], $pipe);
            $set['stage_id'] = $stage['id']; $set['pipeline_id'] = $stage['pipeline_id']; $set['stage_change_time'] = $now;
        }
        if (!empty($a['status'])) {
            $s = (string)$a['status']; if (!isset(MCP_STATUS[$s])) throw new McpToolError('Statut inconnu.');
            $set['status'] = $s;
            if ($s === 'won') { $set['won_time'] = $now; $set['close_time'] = $now; $set['lost_time'] = null; }
            if ($s === 'lost') { $set['lost_time'] = $now; $set['close_time'] = $now; $set['won_time'] = null; }
            if ($s === 'open') { $set['won_time'] = $set['lost_time'] = $set['close_time'] = null; }
        }
        if (array_key_exists('lost_reason', $a)) $set['lost_reason'] = mb_substr((string)$a['lost_reason'], 0, 500) ?: null;
        if (isset($a['owner'])) $set['owner_id'] = mcp_user_id($a['owner'], $me);
        if (array_key_exists('expected_close_date', $a)) $set['expected_close_date'] = mcp_date($a['expected_close_date'], 'expected_close_date');
        foreach (['org_id' => 'orgs', 'person_id' => 'persons'] as $k => $tbl) if (array_key_exists($k, $a)) { $v = (int)$a[$k]; if ($v) mcp_exists($tbl, $v); $set[$k] = $v ?: null; }
        if (!empty($a['fields']) && is_array($a['fields'])) {
            $defs = []; foreach (q("SELECT fkey, label FROM fields WHERE entity = 'deal'")->fetchAll() as $f) $defs[mcp_norm($f['label'])] = $f['fkey'];
            $ex = $cur['extra'] ? (json_decode($cur['extra'], true) ?: []) : [];
            foreach ($a['fields'] as $label => $val) {
                $key = $defs[mcp_norm((string)$label)] ?? null;
                if (!$key) throw new McpToolError('Champ complémentaire inconnu : ' . $label . '. Libellés possibles : ' . implode(', ', q("SELECT label FROM fields WHERE entity = 'deal' ORDER BY position")->fetchAll(PDO::FETCH_COLUMN)) . '.');
                if ($val === null || $val === '') unset($ex[$key]); else $ex[$key] = (string)$val;
            }
            $set['extra'] = $ex ? json_encode($ex, JSON_UNESCAPED_UNICODE) : null;
        }
        $links = 0;
        foreach (['add_contacts' => true, 'remove_contacts' => false] as $k => $on) if (!empty($a[$k]) && is_array($a[$k])) {
            require_once __DIR__ . '/contacts.php';
            foreach ($a[$k] as $pid) { $pid = (int)$pid; mcp_exists('persons', $pid); deal_contact_link($id, $pid, $on); $links++; }
        }
        if (!$set && !$links) throw new McpToolError('Aucune modification demandée.');
        $set['update_time'] = $now;
        q('UPDATE deals SET ' . implode(',', array_map(fn($k) => "`$k` = ?", array_keys($set))) . ' WHERE id = ?', [...array_values($set), $id]);
        $after = mcp_get_deal_row($id);
        $res = ['modifie' => true, 'affaire' => mcp_fmt_deal($after)];
        if ($after['status'] === 'open' && !q('SELECT 1 FROM activities WHERE deal_id = ? AND done = 0', [$id])->fetchColumn())
            $res['attention'] = 'Cette affaire en cours n\'a aucune activité prévue : proposez de planifier la prochaine étape.';
        return $res;

    case 'add_note':
        $tbl = ['deal' => 'deals', 'org' => 'orgs', 'person' => 'persons'][$a['target'] ?? ''] ?? null;
        if (!$tbl) throw new McpToolError('target doit valoir deal, org ou person.');
        $id = mcp_int($a['id'] ?? null, 'de fiche'); mcp_exists($tbl, $id);
        $text = trim((string)($a['text'] ?? '')); if ($text === '') throw new McpToolError('Le texte de la note est vide.');
        $old = q("SELECT notes FROM `$tbl` WHERE id = ?", [$id])->fetchColumn();
        q("UPDATE `$tbl` SET notes = ?, update_time = ? WHERE id = ?", [mcp_append_note($old === false ? '' : (string)$old, $text, $me), $now, $id]);
        return ['ajoute' => true, 'fiche' => $a['target'] . ' n° ' . $id];

    case 'create_organization':
        $nm = trim((string)($a['name'] ?? '')); if ($nm === '') throw new McpToolError('Le nom est obligatoire.');
        $dup = q('SELECT id, name FROM orgs WHERE name = ? LIMIT 1', [$nm])->fetch();
        q('INSERT INTO orgs (name, address, website, owner_id, notes, add_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [mb_substr($nm, 0, 255), ($a['address'] ?? '') !== '' ? mb_substr((string)$a['address'], 0, 500) : null, ($a['website'] ?? '') !== '' ? mb_substr((string)$a['website'], 0, 500) : null,
           mcp_user_id($a['owner'] ?? 'me', $me), (string)($a['notes'] ?? ''), $now, $now]);
        $o = q('SELECT * FROM orgs WHERE id = ?', [(int)db()->lastInsertId()])->fetch();
        return ['cree' => true, 'organisation' => mcp_fmt_org($o)] + ($dup ? ['attention' => "Une organisation du même nom existait déjà (n° {$dup['id']})."] : []);

    case 'update_organization':
        $id = mcp_int($a['id'] ?? null, "d'organisation"); mcp_exists('orgs', $id);
        $set = [];
        if (isset($a['name']) && trim((string)$a['name']) !== '') $set['name'] = mb_substr(trim((string)$a['name']), 0, 255);
        foreach (['address', 'website'] as $k) if (array_key_exists($k, $a)) $set[$k] = (string)$a[$k] !== '' ? mb_substr((string)$a[$k], 0, 500) : null;
        if (isset($a['owner'])) $set['owner_id'] = mcp_user_id($a['owner'], $me);
        if (!$set) throw new McpToolError('Aucune modification demandée.');
        $set['update_time'] = $now;
        q('UPDATE orgs SET ' . implode(',', array_map(fn($k) => "`$k` = ?", array_keys($set))) . ' WHERE id = ?', [...array_values($set), $id]);
        return ['modifie' => true, 'organisation' => mcp_fmt_org(q('SELECT * FROM orgs WHERE id = ?', [$id])->fetch())];

    case 'create_person':
    case 'update_person':
        $list = fn($xs) => json_encode(array_values(array_map(fn($v, $i) => ['value' => trim((string)$v), 'label' => null, 'primary' => $i === 0], $xs, array_keys($xs))), JSON_UNESCAPED_UNICODE);
        $clean = fn($xs) => array_values(array_filter(array_map('trim', array_map('strval', (array)$xs)), fn($v) => $v !== ''));
        if ($name === 'create_person') {
            $nm = trim((string)($a['name'] ?? '')); if ($nm === '') throw new McpToolError('Le nom est obligatoire.');
            $org = !empty($a['org_id']) ? (int)$a['org_id'] : null; if ($org) mcp_exists('orgs', $org);
            $parts = preg_split('/\s+/u', $nm, 2);
            q('INSERT INTO persons (name, first_name, last_name, org_id, emails, phones, owner_id, notes, add_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [mb_substr($nm, 0, 255), $parts[0], $parts[1] ?? null, $org, $list($clean($a['emails'] ?? [])), $list($clean($a['phones'] ?? [])), mcp_user_id($a['owner'] ?? 'me', $me), (string)($a['notes'] ?? ''), $now, $now]);
            return ['cree' => true, 'personne' => mcp_fmt_person(q(MCP_PERSON_SQL . ' WHERE p.id = ?', [(int)db()->lastInsertId()])->fetch())];
        }
        $id = mcp_int($a['id'] ?? null, 'de personne');
        $cur = q('SELECT * FROM persons WHERE id = ?', [$id])->fetch(); if (!$cur) throw new McpToolError("Personne n° $id introuvable.");
        $set = [];
        if (isset($a['name']) && trim((string)$a['name']) !== '') { $nm = trim((string)$a['name']); $parts = preg_split('/\s+/u', $nm, 2);
            $set['name'] = mb_substr($nm, 0, 255); $set['first_name'] = $parts[0]; $set['last_name'] = $parts[1] ?? null; }
        if (array_key_exists('org_id', $a)) { $v = (int)$a['org_id']; if ($v) mcp_exists('orgs', $v); $set['org_id'] = $v ?: null; }
        foreach (['emails' => 'add_email', 'phones' => 'add_phone'] as $k => $add) {
            $vals = array_key_exists($k, $a) ? $clean($a[$k]) : mcp_list_json($cur[$k]);
            if (!empty($a[$add]) && !in_array(trim((string)$a[$add]), $vals, true)) $vals[] = trim((string)$a[$add]);
            if (array_key_exists($k, $a) || !empty($a[$add])) $set[$k] = $list($vals);
        }
        if (isset($a['owner'])) $set['owner_id'] = mcp_user_id($a['owner'], $me);
        if (!$set) throw new McpToolError('Aucune modification demandée.');
        $set['update_time'] = $now;
        q('UPDATE persons SET ' . implode(',', array_map(fn($k) => "`$k` = ?", array_keys($set))) . ' WHERE id = ?', [...array_values($set), $id]);
        return ['modifie' => true, 'personne' => mcp_fmt_person(q(MCP_PERSON_SQL . ' WHERE p.id = ?', [$id])->fetch())];
    }
    throw new McpToolError("Outil inconnu : $name.");
}
