<?php
// API JSON du CRM. Toutes les routes exigent une session ; les écritures exigent aussi le jeton CSRF.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
security_headers();

/* ---------- description des tables modifiables ---------- */
function ent(string $e): array {
    $E = [
        'deals' => ['title' => 's', 'value' => 'f', 'currency' => 's', 'pipeline_id' => 'i', 'stage_id' => 'i', 'status' => 'status', 'lost_reason' => 's', 'owner_id' => 'i',
            'org_id' => 'i', 'person_id' => 'i', 'expected_close_date' => 'd', 'notes' => 'txt', 'extra' => 'json', 'won_time' => 'dt', 'lost_time' => 'dt', 'close_time' => 'dt', 'stage_change_time' => 'dt'],
        'activities' => ['type' => 's', 'subject' => 's', 'due_date' => 'd', 'due_time' => 't', 'duration' => 'i', 'done' => 'b', 'done_time' => 'dt', 'owner_id' => 'i',
            'deal_id' => 'i', 'person_id' => 'i', 'org_id' => 'i', 'note' => 'txt', 'location' => 's'],
        'orgs' => ['name' => 's', 'address' => 's', 'website' => 's', 'owner_id' => 'i', 'notes' => 'txt', 'extra' => 'json'],
        'persons' => ['name' => 's', 'first_name' => 's', 'last_name' => 's', 'org_id' => 'i', 'emails' => 'list', 'phones' => 'list', 'owner_id' => 'i', 'notes' => 'txt', 'extra' => 'json'],
    ];
    if (!isset($E[$e])) fail('Type de fiche inconnu.');
    return $E[$e];
}
function cast_in(string $type, $v) {
    if ($v === null) return null;
    switch ($type) {
        case 's': $v = trim((string)$v); return $v === '' ? null : mb_substr($v, 0, 500);
        case 'txt': return (string)$v;
        case 'i': return ($v === '' || $v === false) ? null : (int)$v;
        case 'f': return (float)$v;
        case 'b': return $v ? 1 : 0;
        case 'd': return preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)$v) ? $v : null;
        case 't': return preg_match('/^\d{2}:\d{2}$/', (string)$v) ? $v : null;
        case 'dt': $ts = strtotime((string)$v); return $ts ? gmdate('Y-m-d H:i:s', $ts) : null;
        case 'status': return in_array($v, ['open', 'won', 'lost'], true) ? $v : 'open';
        case 'list': return json_encode(array_values(array_filter(array_map(fn($x) => is_array($x) ? ['value' => trim((string)($x['value'] ?? '')), 'label' => $x['label'] ?? null, 'primary' => !empty($x['primary'])] : null, (array)$v), fn($x) => $x && $x['value'] !== '')), JSON_UNESCAPED_UNICODE);
        case 'json': return is_array($v) ? json_encode(array_map(fn($x) => $x === null ? null : (string)$x, $v), JSON_UNESCAPED_UNICODE) : null;
    }
    return null;
}
const ID_COLS = ['id', 'owner_id', 'org_id', 'person_id', 'deal_id', 'pipeline_id', 'stage_id'];
function out_row(?array $r): ?array {
    if (!$r) return null;
    foreach ($r as $k => $v) {
        if (in_array($k, ID_COLS, true)) $r[$k] = $v === null ? null : (string)$v;
        elseif (in_array($k, ['add_time', 'update_time', 'won_time', 'lost_time', 'close_time', 'stage_change_time', 'done_time'], true)) $r[$k] = $v ? str_replace(' ', 'T', $v) . 'Z' : null;
        elseif (in_array($k, ['extra'], true)) $r[$k] = $v ? (json_decode($v, true) ?: new stdClass) : new stdClass;
        elseif (in_array($k, ['emails', 'phones'], true)) $r[$k] = $v ? (json_decode($v, true) ?: []) : [];
        elseif ($k === 'done') $r[$k] = (bool)$v;
        elseif ($k === 'value') $r[$k] = (float)$v;
        elseif (in_array($k, ['duration', 'pd_id'], true)) $r[$k] = $v === null ? null : (int)$v;
    }
    if (array_key_exists('done_time', $r)) $r['done_date'] = $r['done_time'] ? substr($r['done_time'], 0, 10) : null;
    return $r;
}
const DEAL_SQL = 'SELECT d.*, o.name AS org_name, p.name AS person_name FROM deals d LEFT JOIN orgs o ON o.id = d.org_id LEFT JOIN persons p ON p.id = d.person_id';
const ACT_SQL = 'SELECT a.*, d.title AS deal_title, o.name AS org_name, p.name AS person_name FROM activities a LEFT JOIN deals d ON d.id = a.deal_id LEFT JOIN orgs o ON o.id = a.org_id LEFT JOIN persons p ON p.id = a.person_id';
const PERSON_SQL = 'SELECT p.*, o.name AS org_name FROM persons p LEFT JOIN orgs o ON o.id = p.org_id';

function fetch_one(string $e, int $id): ?array {
    $sql = ['deals' => DEAL_SQL . ' WHERE d.id = ?', 'activities' => ACT_SQL . ' WHERE a.id = ?', 'orgs' => 'SELECT * FROM orgs WHERE id = ?', 'persons' => PERSON_SQL . ' WHERE p.id = ?'][$e];
    return out_row(q($sql, [$id])->fetch() ?: null);
}

function require_admin(array $me): void { if ($me['role'] !== 'admin') fail('Réservé aux administrateurs.', 403); }

function route(string $r, string $method, array $b, array $me): void {
    switch ($r) {
    case 'bootstrap':
        $pipes = q('SELECT id, name FROM pipelines ORDER BY position, id')->fetchAll();
        $stages = q('SELECT id, pipeline_id, name FROM stages ORDER BY position, id')->fetchAll();
        foreach ($pipes as &$p) { $p['id'] = (string)$p['id']; $p['stages'] = array_values(array_map(fn($s) => ['id' => (string)$s['id'], 'name' => $s['name']], array_filter($stages, fn($s) => (string)$s['pipeline_id'] === $p['id']))); }
        unset($p);
        $fields = ['deal' => [], 'org' => [], 'person' => []];
        foreach (q('SELECT entity, fkey, label, type, options FROM fields ORDER BY position, id')->fetchAll() as $f)
            $fields[$f['entity']][] = ['key' => $f['fkey'], 'label' => $f['label'], 'type' => $f['type'], 'options' => $f['options'] ? json_decode($f['options'], true) : []];
        $users = array_map(fn($u) => ['id' => (string)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'], 'can_login' => (bool)$u['can_login'], 'active' => (bool)$u['active']],
            q('SELECT id, name, email, role, can_login, active FROM users ORDER BY active DESC, name')->fetchAll());
        $c = crm_config();
        json_out(['me' => ['id' => (string)$me['id'], 'name' => $me['name'], 'email' => $me['email'], 'role' => $me['role']], 'users' => $users, 'pipelines' => $pipes, 'fields' => $fields,
            'importInfo' => setting('last_import'), 'pipedrive' => !empty($c['pipedrive_token']), 'version' => CRM_VERSION]);

    case 'deals':
        json_out(array_map('out_row', q(DEAL_SQL . ' ORDER BY d.id')->fetchAll()));

    case 'activities':
        foreach (['deal_id', 'org_id', 'person_id'] as $k) if (!empty($_GET[$k])) json_out(array_map('out_row', q(ACT_SQL . " WHERE a.$k = ? ORDER BY a.done, a.due_date, a.due_time", [(int)$_GET[$k]])->fetchAll()));
        $since = gmdate('Y-m-d H:i:s', time() - 45 * 86400);
        json_out(array_map('out_row', q(ACT_SQL . ' WHERE a.done = 0 OR a.done_time >= ?', [$since])->fetchAll()));

    case 'get':
        $e = (string)($_GET['e'] ?? ''); ent($e);
        $row = fetch_one($e, (int)($_GET['id'] ?? 0));
        if (!$row) fail('Fiche introuvable.', 404);
        if ($e === 'orgs') $row['persons'] = array_map('out_row', q(PERSON_SQL . ' WHERE p.org_id = ? ORDER BY p.name', [(int)$row['id']])->fetchAll());
        json_out($row);

    case 'search':
        $kind = ($_GET['kind'] ?? '') === 'person' ? 'person' : 'org';
        $qs = trim((string)($_GET['q'] ?? ''));
        $n = min(100, max(1, (int)($_GET['n'] ?? 40)));
        $toks = array_slice(array_filter(preg_split('/\s+/u', $qs)), 0, 5);
        $base = $kind === 'org' ? 'SELECT o.* FROM orgs o' : PERSON_SQL;
        $a = $kind === 'org' ? 'o' : 'p';
        if (!$toks) json_out(array_map('out_row', q("$base ORDER BY $a.update_time DESC LIMIT $n")->fetchAll()));
        $w = []; $p = [];
        foreach ($toks as $t) { $like = '%' . addcslashes($t, '%_\\') . '%';
            if ($kind === 'org') { $w[] = '(o.name LIKE ? OR o.address LIKE ?)'; array_push($p, $like, $like); }
            else { $w[] = '(p.name LIKE ? OR p.emails LIKE ? OR o.name LIKE ?)'; array_push($p, $like, $like, $like); } }
        $p[] = $toks[0] . '%';
        json_out(array_map('out_row', q("$base WHERE " . implode(' AND ', $w) . " ORDER BY ($a.name LIKE ?) DESC, $a.name LIMIT $n", $p)->fetchAll()));

    case 'create':
    case 'update':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        $e = (string)($_GET['e'] ?? ''); $cols = ent($e);
        $data = (array)($b['data'] ?? []);
        $set = [];
        foreach ($data as $k => $v) if (isset($cols[$k])) $set[$k] = cast_in($cols[$k], $v);
        if ($r === 'update') {
            $id = (int)($_GET['id'] ?? 0);
            $cur = q("SELECT * FROM `$e` WHERE id = ?", [$id])->fetch();
            if (!$cur) fail('Fiche introuvable : elle a peut-être été supprimée.', 404);
            if (isset($set['extra']) && is_array($data['extra'])) {
                $merged = array_merge($cur['extra'] ? (json_decode($cur['extra'], true) ?: []) : [], json_decode($set['extra'], true) ?: []);
                $set['extra'] = json_encode(array_filter($merged, fn($x) => $x !== null && $x !== ''), JSON_UNESCAPED_UNICODE);
            }
            if (isset($set['name']) && $set['name'] === null) unset($set['name']);
            if (isset($set['title']) && $set['title'] === null) unset($set['title']);
            $set['update_time'] = now_utc();
            q("UPDATE `$e` SET " . implode(',', array_map(fn($k) => "`$k` = ?", array_keys($set))) . ' WHERE id = ?', [...array_values($set), $id]);
        } else {
            if ($e === 'orgs' || $e === 'persons') $set['name'] = $set['name'] ?? 'Sans nom';
            if ($e === 'deals') { $set['title'] = $set['title'] ?? 'Nouvelle affaire'; $set['notes'] = $set['notes'] ?? ''; }
            $set['add_time'] = $set['update_time'] = now_utc();
            q("INSERT INTO `$e` (`" . implode('`,`', array_keys($set)) . '`) VALUES (' . implode(',', array_fill(0, count($set), '?')) . ')', array_values($set));
            $id = (int)db()->lastInsertId();
        }
        json_out(fetch_one($e, $id));

    case 'delete':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        $e = (string)($_GET['e'] ?? ''); ent($e); $id = (int)($_GET['id'] ?? 0);
        db()->beginTransaction();
        q("DELETE FROM `$e` WHERE id = ?", [$id]);
        // On détache les liens au lieu de supprimer en cascade : l'historique reste.
        if ($e === 'deals') q('UPDATE activities SET deal_id = NULL WHERE deal_id = ?', [$id]);
        if ($e === 'orgs') { q('UPDATE persons SET org_id = NULL WHERE org_id = ?', [$id]); q('UPDATE deals SET org_id = NULL WHERE org_id = ?', [$id]); q('UPDATE activities SET org_id = NULL WHERE org_id = ?', [$id]); }
        if ($e === 'persons') { q('UPDATE deals SET person_id = NULL WHERE person_id = ?', [$id]); q('UPDATE activities SET person_id = NULL WHERE person_id = ?', [$id]); }
        db()->commit();
        json_out(['ok' => true]);

    case 'pipelines':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        $in = (array)($b['pipelines'] ?? []);
        db()->beginTransaction();
        $keepP = []; $keepS = [];
        foreach (array_values($in) as $pi => $p) {
            $name = mb_substr(trim((string)($p['name'] ?? '')) ?: 'Sans nom', 0, 190);
            $pid = ctype_digit((string)($p['id'] ?? '')) ? (int)$p['id'] : 0;
            if ($pid && q('SELECT id FROM pipelines WHERE id = ?', [$pid])->fetchColumn()) q('UPDATE pipelines SET name = ?, position = ? WHERE id = ?', [$name, $pi, $pid]);
            else { q('INSERT INTO pipelines (name, position) VALUES (?, ?)', [$name, $pi]); $pid = (int)db()->lastInsertId(); }
            $keepP[] = $pid;
            foreach (array_values((array)($p['stages'] ?? [])) as $si => $s) {
                $sname = mb_substr(trim((string)($s['name'] ?? '')) ?: 'Sans nom', 0, 190);
                $sid = ctype_digit((string)($s['id'] ?? '')) ? (int)$s['id'] : 0;
                if ($sid && q('SELECT id FROM stages WHERE id = ?', [$sid])->fetchColumn()) q('UPDATE stages SET name = ?, position = ?, pipeline_id = ? WHERE id = ?', [$sname, $si, $pid, $sid]);
                else { q('INSERT INTO stages (pipeline_id, name, position) VALUES (?, ?, ?)', [$pid, $sname, $si]); $sid = (int)db()->lastInsertId(); }
                $keepS[] = $sid;
            }
        }
        $ks = $keepS ? implode(',', $keepS) : '0'; $kp = $keepP ? implode(',', $keepP) : '0';
        $used = (int)q("SELECT COUNT(*) FROM deals WHERE stage_id IS NOT NULL AND stage_id NOT IN ($ks)")->fetchColumn();
        if ($used) { db()->rollBack(); fail("$used affaire(s) sont dans une étape que vous supprimez : déplacez-les d'abord."); }
        q("DELETE FROM stages WHERE id NOT IN ($ks)");
        q("DELETE FROM pipelines WHERE id NOT IN ($kp)");
        db()->commit();
        json_out(['ok' => true]);

    case 'user_save':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        $u = (array)($b['user'] ?? []);
        $id = (int)($u['id'] ?? 0);
        $name = mb_substr(trim((string)($u['name'] ?? '')), 0, 190);
        $email = strtolower(trim((string)($u['email'] ?? ''))) ?: null;
        if ($name === '') fail('Le nom est obligatoire.');
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Adresse e-mail invalide.');
        $role = ($u['role'] ?? 'user') === 'admin' ? 'admin' : 'user';
        $canLogin = !empty($u['can_login']) ? 1 : 0; $active = array_key_exists('active', $u) ? (!empty($u['active']) ? 1 : 0) : 1;
        $pass = (string)($u['password'] ?? '');
        if ($pass !== '' && strlen($pass) < 10) fail('Le mot de passe doit faire au moins 10 caractères.');
        if ($canLogin && !$email) fail('Une adresse e-mail est nécessaire pour se connecter.');
        if ($email && q('SELECT id FROM users WHERE email = ? AND id <> ?', [$email, $id])->fetchColumn()) fail('Cette adresse e-mail est déjà utilisée.');
        if ($id === (int)$me['id'] && ($role !== 'admin' || !$canLogin)) fail('Vous ne pouvez pas retirer vos propres droits d\'administrateur.');
        if ($id) {
            $has = q('SELECT password_hash FROM users WHERE id = ?', [$id])->fetchColumn();
            if ($has === false) fail('Utilisateur introuvable.', 404);
            if ($canLogin && !$has && $pass === '') fail('Choisissez un mot de passe pour ouvrir l\'accès.');
            q('UPDATE users SET name = ?, email = ?, role = ?, can_login = ?, active = ? WHERE id = ?', [$name, $email, $role, $canLogin, $active, $id]);
            if ($pass !== '') q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($pass, PASSWORD_DEFAULT), $id]);
        } else {
            if ($canLogin && $pass === '') fail('Choisissez un mot de passe pour ouvrir l\'accès.');
            q('INSERT INTO users (name, email, password_hash, role, can_login, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [$name, $email, $pass !== '' ? password_hash($pass, PASSWORD_DEFAULT) : null, $role, $canLogin, $active, now_utc()]);
        }
        json_out(['ok' => true]);

    case 'password':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        $hash = q('SELECT password_hash FROM users WHERE id = ?', [$me['id']])->fetchColumn();
        if (!$hash || !password_verify((string)($b['current'] ?? ''), $hash)) fail('Mot de passe actuel incorrect.');
        $new = (string)($b['new'] ?? '');
        if (strlen($new) < 10) fail('Le nouveau mot de passe doit faire au moins 10 caractères.');
        q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), $me['id']]);
        json_out(['ok' => true]);

    case 'import':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        require __DIR__ . '/lib/pipedrive.php';
        @set_time_limit(120);
        json_out(import_step((array)($b['state'] ?? [])));

    case 'export':
        $what = (string)($_GET['what'] ?? '');
        $users = []; foreach (q('SELECT id, name FROM users')->fetchAll() as $u) $users[$u['id']] = $u['name'];
        $st = [];  foreach (q('SELECT s.id, s.name, p.name AS pname FROM stages s JOIN pipelines p ON p.id = s.pipeline_id')->fetchAll() as $s) $st[$s['id']] = $s;
        $types = ['call' => 'Appel', 'meeting' => 'Réunion', 'task' => 'Tâche', 'email' => 'E-mail', 'deadline' => 'Échéance', 'lunch' => 'Déjeuner'];
        $status = ['open' => 'En cours', 'won' => 'Gagnée', 'lost' => 'Perdue'];
        $vals = fn($j) => implode(', ', array_map(fn($x) => $x['value'] ?? '', $j ? (json_decode($j, true) ?: []) : []));
        if ($what === 'deals') { $head = ['Titre', 'Organisation', 'Personne', 'Valeur', 'Pipeline', 'Étape', 'Statut', 'Responsable', 'Clôture prévue', 'Créée le', 'Raison de perte', 'Notes'];
            $rows = array_map(fn($d) => [$d['title'], $d['org_name'], $d['person_name'], $d['value'], $st[$d['stage_id']]['pname'] ?? '', $st[$d['stage_id']]['name'] ?? '', $status[$d['status']] ?? '', $users[$d['owner_id']] ?? '', $d['expected_close_date'], substr((string)$d['add_time'], 0, 10), $d['lost_reason'], $d['notes']], q(DEAL_SQL)->fetchAll()); }
        elseif ($what === 'activities') { $head = ['Type', 'Objet', 'Date', 'Heure', 'Faite', 'Responsable', 'Affaire', 'Personne', 'Organisation', 'Note'];
            $rows = array_map(fn($a) => [$types[$a['type']] ?? $a['type'], $a['subject'], $a['due_date'], $a['due_time'], $a['done'] ? 'oui' : 'non', $users[$a['owner_id']] ?? '', $a['deal_title'], $a['person_name'], $a['org_name'], $a['note']], q(ACT_SQL . ' ORDER BY a.due_date DESC')->fetchAll()); }
        elseif ($what === 'orgs') { $head = ['Nom', 'Adresse', 'Site web', 'Responsable', 'Notes'];
            $rows = array_map(fn($o) => [$o['name'], $o['address'], $o['website'], $users[$o['owner_id']] ?? '', $o['notes']], q('SELECT * FROM orgs ORDER BY name')->fetchAll()); }
        elseif ($what === 'persons') { $head = ['Nom', 'Organisation', 'E-mails', 'Téléphones', 'Responsable', 'Notes'];
            $rows = array_map(fn($p) => [$p['name'], $p['org_name'], $vals($p['emails']), $vals($p['phones']), $users[$p['owner_id']] ?? '', $p['notes']], q(PERSON_SQL . ' ORDER BY p.name')->fetchAll()); }
        else fail('Export inconnu.');
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="crm-' . $what . '-' . gmdate('Y-m-d') . '.csv"');
        $out = fopen('php://output', 'w'); fwrite($out, "\xEF\xBB\xBF");
        // Neutralise les formules (protection contre l'injection CSV dans Excel)
        $clean = fn($r) => array_map(function ($v) { $v = str_replace(["\r\n", "\n", "\r"], ' ', (string)$v); return preg_match('/^[=+\-@\t]/', $v) ? "'" . $v : $v; }, $r);
        fputcsv($out, $head, ';', '"', ''); foreach ($rows as $row) fputcsv($out, $clean($row), ';', '"', '');
        exit;

    default:
        fail('Route inconnue.', 404);
    }
}

/* ---------- point d'entrée ---------- */
try {
    $me = current_user();
    if (!$me) fail('Session expirée : reconnectez-vous.', 401);
    $r = (string)($_GET['r'] ?? '');
    $method = $_SERVER['REQUEST_METHOD'];
    $body = [];
    if ($method === 'POST') {
        if (!hash_equals($_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF'] ?? ''))) fail('Jeton de sécurité invalide : rechargez la page.', 403);
        $raw = file_get_contents('php://input');
        $body = $raw ? (json_decode($raw, true) ?? []) : [];
        if (!is_array($body)) fail('Requête illisible.');
    }
    session_write_close(); // libère la session pour les requêtes parallèles
    route($r, $method, $body, $me);
} catch (Throwable $e) {
    error_log('[crm] ' . $e->getMessage());
    fail($e instanceof RuntimeException ? $e->getMessage() : 'Erreur serveur : réessayez dans un instant.', 500);
}
