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
const ID_COLS = ['id', 'owner_id', 'org_id', 'person_id', 'deal_id', 'pipeline_id', 'stage_id', 'contact_id'];
function out_row(?array $r): ?array {
    if (!$r) return null;
    foreach ($r as $k => $v) {
        if (in_array($k, ID_COLS, true)) $r[$k] = $v === null ? null : (string)$v;
        elseif (in_array($k, ['add_time', 'update_time', 'won_time', 'lost_time', 'close_time', 'stage_change_time', 'done_time'], true)) $r[$k] = $v ? str_replace(' ', 'T', $v) . 'Z' : null;
        elseif (in_array($k, ['extra'], true)) $r[$k] = $v ? (json_decode($v, true) ?: new stdClass) : new stdClass;
        elseif (in_array($k, ['emails', 'phones', 'contact_emails', 'contact_phones'], true)) $r[$k] = $v ? (json_decode($v, true) ?: []) : [];
        elseif ($k === 'done') $r[$k] = (bool)$v;
        elseif ($k === 'value') $r[$k] = (float)$v;
        elseif (in_array($k, ['duration', 'pd_id'], true)) $r[$k] = $v === null ? null : (int)$v;
    }
    if (array_key_exists('done_time', $r)) $r['done_date'] = $r['done_time'] ? substr($r['done_time'], 0, 10) : null;
    return $r;
}
// Contact affiché avec l'affaire ou l'activité : la personne liée, sinon celle de l'affaire, sinon la première personne de l'organisation.
const DEAL_SQL = 'SELECT d.*, o.name AS org_name, p.name AS person_name, pc.id AS contact_id, pc.name AS contact_name, pc.emails AS contact_emails, pc.phones AS contact_phones
  FROM deals d LEFT JOIN orgs o ON o.id = d.org_id LEFT JOIN persons p ON p.id = d.person_id
  LEFT JOIN persons pc ON pc.id = COALESCE(d.person_id, (SELECT MIN(px.id) FROM persons px WHERE px.org_id = d.org_id))';
const ACT_SQL = 'SELECT a.*, d.title AS deal_title, o.name AS org_name, p.name AS person_name, pc.id AS contact_id, pc.name AS contact_name, pc.emails AS contact_emails, pc.phones AS contact_phones
  FROM activities a LEFT JOIN deals d ON d.id = a.deal_id LEFT JOIN orgs o ON o.id = a.org_id LEFT JOIN persons p ON p.id = a.person_id
  LEFT JOIN persons pc ON pc.id = COALESCE(a.person_id, d.person_id, (SELECT MIN(px.id) FROM persons px WHERE px.org_id = COALESCE(a.org_id, d.org_id)))';
const PERSON_SQL = 'SELECT p.*, o.name AS org_name FROM persons p LEFT JOIN orgs o ON o.id = p.org_id';

function fetch_one(string $e, int $id): ?array {
    $sql = ['deals' => DEAL_SQL . ' WHERE d.id = ?', 'activities' => ACT_SQL . ' WHERE a.id = ?', 'orgs' => 'SELECT * FROM orgs WHERE id = ?', 'persons' => PERSON_SQL . ' WHERE p.id = ?'][$e];
    return out_row(q($sql, [$id])->fetch() ?: null);
}

/* Conditions SQL « fiche utile » : liée à une affaire, à une activité, à un e-mail ou à un tag.
   Une personne compte aussi si son organisation a une affaire ; une organisation compte aussi si l'un de ses contacts est utile.
   Alias attendus : p pour persons, o pour orgs. */
function useful_sql(): array {
    require_once __DIR__ . '/lib/tags.php';
    require_once __DIR__ . '/lib/mail.php';
    tags_schema(); mail_schema();
    $pUse = "(EXISTS (SELECT 1 FROM deals ud WHERE ud.person_id = p.id) OR EXISTS (SELECT 1 FROM activities ua WHERE ua.person_id = p.id)"
          . " OR EXISTS (SELECT 1 FROM crm_emails ue WHERE ue.person_id = p.id) OR EXISTS (SELECT 1 FROM crm_tags ut WHERE ut.entity = 'person' AND ut.entity_id = p.id)"
          . " OR EXISTS (SELECT 1 FROM deals ud2 WHERE ud2.org_id = p.org_id))";
    $pUseX = str_replace(['p.id', 'p.org_id'], ['px.id', 'px.org_id'], $pUse);
    $oUse = "(EXISTS (SELECT 1 FROM deals vd WHERE vd.org_id = o.id) OR EXISTS (SELECT 1 FROM activities va WHERE va.org_id = o.id)"
          . " OR EXISTS (SELECT 1 FROM crm_emails ve WHERE ve.org_id = o.id) OR EXISTS (SELECT 1 FROM crm_tags vt WHERE vt.entity = 'org' AND vt.entity_id = o.id)"
          . " OR EXISTS (SELECT 1 FROM persons px WHERE px.org_id = o.id AND $pUseX))";
    return ['person' => $pUse, 'org' => $oUse];
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
        $hidden = array_flip((array)setting('hidden_fields', []));
        foreach (q('SELECT entity, fkey, label, type, options FROM fields ORDER BY position, id')->fetchAll() as $f)
            $fields[$f['entity']][] = ['key' => $f['fkey'], 'label' => $f['label'], 'type' => $f['type'], 'options' => $f['options'] ? json_decode($f['options'], true) : [],
                'hidden' => isset($hidden[$f['entity'] . ':' . $f['fkey']])];
        $users = array_map(fn($u) => ['id' => (string)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'], 'can_login' => (bool)$u['can_login'], 'active' => (bool)$u['active']],
            q('SELECT id, name, email, role, can_login, active FROM users ORDER BY active DESC, name')->fetchAll());
        $c = crm_config();
        json_out(['me' => ['id' => (string)$me['id'], 'name' => $me['name'], 'email' => $me['email'], 'role' => $me['role']], 'users' => $users, 'pipelines' => $pipes, 'fields' => $fields,
            'cadrage' => (object)(array)setting('cadrage_links', []),
            'importInfo' => setting('last_import'), 'pipedrive' => !empty($c['pipedrive_token']), 'version' => CRM_VERSION]);

    case 'deals':
        json_out(array_map('out_row', q(DEAL_SQL . ' ORDER BY d.id')->fetchAll()));

    case 'activities':
        foreach (['deal_id', 'org_id', 'person_id'] as $k) if (!empty($_GET[$k])) json_out(array_map('out_row', q(ACT_SQL . " WHERE a.$k = ? ORDER BY a.done, a.due_date, a.due_time", [(int)$_GET[$k]])->fetchAll()));
        $since = gmdate('Y-m-d H:i:s', time() - 45 * 86400);
        // Repère « à vérifier » : nombre d'e-mails échangés avec l'organisation (ou la personne) depuis la création d'une activité encore à faire.
        // Les notes (dont celles reprises de Pipedrive) restent visibles sur les fiches : elles ne sont pas chargées ici,
        // sinon la liste pèse près d'un mégaoctet à chaque actualisation.
        $acts = array_map('out_row', q(ACT_SQL . " WHERE a.done = 0 OR (a.done_time >= ? AND a.type <> 'note')", [$since])->fetchAll());
        try {
            require_once __DIR__ . '/lib/mail.php';
            mail_schema();
            $cnt = q("SELECT a.id, COUNT(e.id) AS n FROM activities a JOIN crm_emails e ON e.sent_at > a.add_time
                      AND ((a.org_id IS NOT NULL AND e.org_id = a.org_id) OR (a.org_id IS NULL AND a.person_id IS NOT NULL AND e.person_id = a.person_id))
                      WHERE a.done = 0 GROUP BY a.id")->fetchAll(PDO::FETCH_KEY_PAIR);
            foreach ($acts as &$x) $x['mails_since'] = (int)($cnt[(int)$x['id']] ?? 0);
            unset($x);
        } catch (Throwable $ex) { error_log('[crm] repère activités ' . $ex->getMessage()); }
        json_out($acts);

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
        $w = []; $p = [];
        // Filtre facultatif par tag : seules les fiches portant ce tag.
        $tag = trim((string)($_GET['tag'] ?? ''));
        if ($tag !== '') {
            require_once __DIR__ . '/lib/tags.php';
            tags_schema();
            $w[] = "EXISTS (SELECT 1 FROM crm_tags t WHERE t.entity = '$kind' AND t.entity_id = $a.id AND t.tag = ?)";
            $p[] = $tag;
            $n = 500;
        }
        // Par défaut la liste des contacts ne montre que les fiches utiles ; les autres restent en base.
        if (!empty($_GET['useful'])) $w[] = useful_sql()[$kind];
        if (!$toks) json_out(array_map('out_row', q($base . ($w ? ' WHERE ' . implode(' AND ', $w) : '') . ' ORDER BY ' . ($tag !== '' ? "$a.name" : "$a.update_time DESC") . " LIMIT $n", $p)->fetchAll()));
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
        $billing = null;
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
            if ($e === 'deals') {
                // Rappel de facturation si l'affaire vient d'arriver à l'étape de signature ou à celle des livrables.
                try {
                    require_once __DIR__ . '/lib/billing.php';
                    $after = q('SELECT * FROM deals WHERE id = ?', [$id])->fetch();
                    if ($after) $billing = billing_on_deal_update($cur, $after, $me);
                } catch (Throwable $ex) { error_log('[crm] facturation ' . $ex->getMessage()); }
            }
        } else {
            if ($e === 'orgs' || $e === 'persons') $set['name'] = $set['name'] ?? 'Sans nom';
            if ($e === 'deals') { $set['title'] = $set['title'] ?? 'Nouvelle affaire'; $set['notes'] = $set['notes'] ?? ''; }
            $set['add_time'] = $set['update_time'] = now_utc();
            q("INSERT INTO `$e` (`" . implode('`,`', array_keys($set)) . '`) VALUES (' . implode(',', array_fill(0, count($set), '?')) . ')', array_values($set));
            $id = (int)db()->lastInsertId();
        }
        $row = fetch_one($e, $id);
        if ($billing && $row) $row['_billing'] = $billing;
        json_out($row);

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

    case 'tags_overview':
        require __DIR__ . '/lib/tags.php';
        json_out(tags_overview());

    case 'tags':
        require __DIR__ . '/lib/tags.php';
        $te = (string)($_GET['e'] ?? '');
        if (!array_key_exists($te, TAG_TABLES)) fail('Type de fiche inconnu.');
        if ($method === 'POST') json_out(['tags' => tags_set($te, (int)($_GET['id'] ?? 0), (array)($b['tags'] ?? []))]);
        json_out(['tags' => tags_of($te, (int)($_GET['id'] ?? 0))]);

    case 'tags_import':
        // Reprise ponctuelle des étiquettes Pipedrive : ne touche ni aux fiches, ni aux étapes, ni aux pipelines.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        require __DIR__ . '/lib/pipedrive.php';
        require __DIR__ . '/lib/tags.php';
        @set_time_limit(120);
        json_out(tags_import_step((array)($b['state'] ?? [])));

    case 'backup':
        // Sauvegardes de la base : liste, lancement à la demande, téléchargement. Réservé aux administrateurs.
        require_admin($me);
        require __DIR__ . '/lib/backup.php';
        try {
            if ($method === 'POST') { $r = backup_run(); json_out(['fait' => $r, 'liste' => backup_list()]); }
            if (!empty($_GET['file'])) {
                $name = basename((string)$_GET['file']);
                if (!preg_match('/^crm-[0-9-]+\.sql\.gz$/', $name) || !is_file(backup_dir() . '/' . $name)) fail('Sauvegarde introuvable.', 404);
                header('Content-Type: application/gzip');
                header('Content-Disposition: attachment; filename="' . $name . '"');
                header('Content-Length: ' . filesize(backup_dir() . '/' . $name));
                header('Cache-Control: no-store');
                readfile(backup_dir() . '/' . $name);
                exit;
            }
            json_out(['liste' => backup_list()]);
        } catch (RuntimeException $ex) { fail($ex->getMessage()); }

    case 'notes_import':
        // Reprise ponctuelle des notes Pipedrive, par pages : ne touche ni aux fiches, ni aux étapes, ni aux pipelines.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        require __DIR__ . '/lib/pipedrive.php';
        require __DIR__ . '/lib/pdnotes.php';
        @set_time_limit(120);
        try { json_out(!empty($_GET['leads']) ? pd_leads_step((array)($b['state'] ?? [])) : pd_notes_step((array)($b['state'] ?? []))); }
        catch (RuntimeException $ex) { fail($ex->getMessage()); }

    case 'mail_status':
        require __DIR__ . '/lib/mail.php';
        json_out(mail_status($me));

    case 'mail_conf':
        // Identifiants de l'application déclarée chez Microsoft. Le secret n'est jamais renvoyé au navigateur.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        require __DIR__ . '/lib/mail.php';
        $old = setting('ms_app'); $old = is_array($old) ? $old : [];
        $tenant = trim((string)($b['tenant'] ?? '')); $client = trim((string)($b['client_id'] ?? '')); $secret = trim((string)($b['secret'] ?? ''));
        if (!preg_match('/^[A-Za-z0-9.\-]{3,100}$/', $tenant)) fail("L'identifiant de l'annuaire n'a pas le bon format.");
        if (!preg_match('/^[A-Za-z0-9\-]{10,100}$/', $client)) fail("L'identifiant de l'application n'a pas le bon format.");
        if ($secret === '') $secret = (string)($old['secret'] ?? '');
        if ($secret === '') fail("Le secret de l'application est obligatoire.");
        set_setting('ms_app', ['tenant' => $tenant, 'client_id' => $client, 'secret' => $secret]);
        json_out(mail_status($me));

    case 'mail_sync':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require __DIR__ . '/lib/mail.php';
        @set_time_limit(180);
        json_out(mail_sync_user((int)$me['id'], null, !empty($b['full'])));

    case 'mail_send':
        // Envoi d'un e-mail depuis la boîte Microsoft de l'utilisateur connecté, rattaché à la fiche.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require __DIR__ . '/lib/mail.php';
        $to = [];
        foreach (preg_split('/[\s,;]+/', strtolower(trim((string)($b['to'] ?? '')))) as $a) { if ($a === '') continue; if (!filter_var($a, FILTER_VALIDATE_EMAIL)) fail('Adresse e-mail invalide : ' . mb_substr($a, 0, 80)); $to[$a] = true; }
        $to = array_keys($to);
        if (!$to) fail('Indiquez au moins un destinataire.');
        if (count($to) > 10) fail('Dix destinataires au maximum.');
        $subject = mb_substr(trim((string)($b['subject'] ?? '')), 0, 250);
        $text = mb_substr(trim((string)($b['body'] ?? '')), 0, 20000);
        if ($subject === '') fail("L'objet est obligatoire.");
        if ($text === '') fail('Le message est vide.');
        // Pièces jointes : nom, type et contenu en base64. Trois mégaoctets au total, limite d'un envoi direct chez Microsoft.
        $files = []; $total = 0;
        foreach ((array)($b['attachments'] ?? []) as $f) {
            if (!is_array($f)) continue;
            $name = mb_substr(trim(str_replace(['/', '\\', "\0"], '_', (string)($f['name'] ?? ''))), 0, 150);
            $data = preg_replace('/\s+/', '', (string)($f['data'] ?? ''));
            if ($name === '' || $data === '' || base64_decode($data, true) === false) fail('Une pièce jointe est illisible.');
            $total += (int)(strlen($data) * 3 / 4);
            $type = preg_match('/^[\w.+-]+\/[\w.+-]+$/', (string)($f['type'] ?? '')) ? (string)$f['type'] : 'application/octet-stream';
            $files[] = ['name' => $name, 'type' => $type, 'data' => $data];
        }
        if (count($files) > 10) fail('Dix pièces jointes au maximum.');
        if ($total > 3 * 1024 * 1024) fail('Les pièces jointes dépassent 3 Mo au total.');
        try { json_out(mail_send((int)$me['id'], $to, $subject, $text, !empty($b['person_id']) ? (int)$b['person_id'] : null, !empty($b['deal_id']) ? (int)$b['deal_id'] : null, $files, !empty($b['track']))); }
        catch (RuntimeException $ex) { fail($ex->getMessage()); }

    case 'mail_sig':
        // Signature de l'utilisateur connecté, ajoutée à la fin des e-mails envoyés depuis le CRM.
        require __DIR__ . '/lib/mail.php';
        if ($method === 'POST') mail_signature_save((int)$me['id'], (string)($b['signature'] ?? ''));
        json_out(['signature' => mail_signature((int)$me['id'])]);

    case 'mail_disconnect':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require __DIR__ . '/lib/mail.php';
        ms_forget_token((int)$me['id']);
        json_out(mail_status($me));

    case 'emails':
        require __DIR__ . '/lib/mail.php';
        foreach (['deal' => 'deal_id', 'org' => 'org_id', 'person' => 'person_id'] as $kind => $k) if (!empty($_GET[$k])) json_out(mail_list($kind, (int)$_GET[$k]));
        json_out([]);

    case 'email_body':
        // Texte complet d'un e-mail, lu à la demande dans la boîte Microsoft puis gardé en base.
        require __DIR__ . '/lib/mail.php';
        try { json_out(mail_body((int)($_GET['id'] ?? 0))); }
        catch (RuntimeException $ex) { fail($ex->getMessage()); }

    case 'scanup_conf':
        // Liaison avec ScanUp par Make. L'adresse, la clé et le mot de passe initial sont enregistrés mais jamais renvoyés.
        require __DIR__ . '/lib/scanup.php';
        if ($method === 'POST') { require_admin($me); try { scanup_save($b); } catch (RuntimeException $ex) { fail($ex->getMessage()); } }
        json_out(scanup_public());

    case 'scanup_rp':
        // Accès responsable de projet pour le client, à sa demande.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require __DIR__ . '/lib/scanup.php';
        try { json_out(scanup_rp_access($me, $b)); }
        catch (RuntimeException $ex) { fail($ex->getMessage()); }

    case 'scanup_trial':
        // Création d'un client test ScanUp (organisation, responsable de projet, opérateurs) depuis une affaire.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require __DIR__ . '/lib/scanup.php';
        @set_time_limit(300);
        try { json_out(scanup_trial_create($me, $b)); }
        catch (RuntimeException $ex) { fail($ex->getMessage()); }

    case 'scanup_modules':
        // Modules du client test : une étape par appel, le navigateur enchaîne jusqu'à « done ».
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require __DIR__ . '/lib/sumodules.php';
        @set_time_limit(180);
        try { json_out(su_modules_step($me, (array)($b['state'] ?? []))); }
        catch (RuntimeException $ex) { fail($ex->getMessage()); }

    case 'deal_contacts':
        // Contacts liés à une affaire (voir lib/contacts.php) ; POST pour ajouter ou retirer un lien manuel.
        require_once __DIR__ . '/lib/contacts.php';
        try {
            if ($method === 'POST') {
                deal_contact_link((int)($b['deal_id'] ?? 0), (int)($b['person_id'] ?? 0), !empty($b['link']), array_key_exists('role', $b) ? (string)$b['role'] : null);
                json_out(deal_contacts((int)($b['deal_id'] ?? 0)));
            }
            json_out(deal_contacts((int)($_GET['id'] ?? 0)));
        } catch (RuntimeException $e) { fail($e->getMessage(), 404); }

    case 'cadrage':
        // Lien de chaque affaire vers sa fiche de cadrage Airtable. Rangé à part pour ne pas être écrasé par l'import Pipedrive.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        $did = (int)($b['deal_id'] ?? 0);
        if (!$did || !q('SELECT id FROM deals WHERE id = ?', [$did])->fetchColumn()) fail('Affaire introuvable.', 404);
        $url = mb_substr(trim((string)($b['url'] ?? '')), 0, 500);
        if ($url !== '' && !preg_match('~^https://airtable\.com/[A-Za-z0-9/_?=&.%-]+$~', $url)) fail('Le lien doit commencer par https://airtable.com/');
        $links = (array)setting('cadrage_links', []);
        if ($url === '') unset($links[(string)$did]); else $links[(string)$did] = $url;
        set_setting('cadrage_links', (object)$links);
        json_out(['ok' => true, 'url' => $url]);

    case 'hook_conf':
        // Clé de la porte d'entrée hook.php (création de tâches par un outil externe). Visible des seuls administrateurs.
        require_admin($me);
        if ($method === 'POST') set_setting('hook_key', bin2hex(random_bytes(24)));
        json_out(['url' => 'https://' . ($_SERVER['HTTP_HOST'] ?? 'crm.360skillvue.com') . '/hook.php', 'key' => (string)setting('hook_key', '')]);

    case 'cleanup_stats':
        // Comptage seul (aucune modification) : fiches sans affaire, sans activité, sans e-mail et sans tag.
        require_admin($me);
        require_once __DIR__ . '/lib/tags.php';
        require_once __DIR__ . '/lib/mail.php';
        tags_schema(); mail_schema();
        $one = fn(string $sql) => (int)q($sql)->fetchColumn();
        $pDeal = 'EXISTS (SELECT 1 FROM deals d WHERE d.person_id = p.id)';
        $pAct = 'EXISTS (SELECT 1 FROM activities a WHERE a.person_id = p.id)';
        $pMail = 'EXISTS (SELECT 1 FROM crm_emails e WHERE e.person_id = p.id)';
        $pTag = "EXISTS (SELECT 1 FROM crm_tags t WHERE t.entity = 'person' AND t.entity_id = p.id)";
        $pOrgDeal = 'EXISTS (SELECT 1 FROM deals d2 WHERE d2.org_id = p.org_id)';
        $pUse = "($pDeal OR $pAct OR $pMail OR $pTag OR $pOrgDeal)";
        $oDeal = 'EXISTS (SELECT 1 FROM deals d WHERE d.org_id = o.id)';
        $oAct = 'EXISTS (SELECT 1 FROM activities a WHERE a.org_id = o.id)';
        $oMail = 'EXISTS (SELECT 1 FROM crm_emails e WHERE e.org_id = o.id)';
        $oTag = "EXISTS (SELECT 1 FROM crm_tags t WHERE t.entity = 'org' AND t.entity_id = o.id)";
        $oPers = "EXISTS (SELECT 1 FROM persons p WHERE p.org_id = o.id AND $pUse)";
        $oUse = "($oDeal OR $oAct OR $oMail OR $oTag OR $oPers)";
        json_out([
            'personnes' => ['total' => $one('SELECT COUNT(*) FROM persons p'), 'avec_affaire' => $one("SELECT COUNT(*) FROM persons p WHERE $pDeal"),
                'avec_activite' => $one("SELECT COUNT(*) FROM persons p WHERE $pAct"), 'avec_email' => $one("SELECT COUNT(*) FROM persons p WHERE $pMail"),
                'avec_tag' => $one("SELECT COUNT(*) FROM persons p WHERE $pTag"), 'organisation_avec_affaire' => $one("SELECT COUNT(*) FROM persons p WHERE $pOrgDeal"),
                'utiles' => $one("SELECT COUNT(*) FROM persons p WHERE $pUse"), 'sans_rien' => $one("SELECT COUNT(*) FROM persons p WHERE NOT $pUse")],
            'organisations' => ['total' => $one('SELECT COUNT(*) FROM orgs o'), 'avec_affaire' => $one("SELECT COUNT(*) FROM orgs o WHERE $oDeal"),
                'avec_activite' => $one("SELECT COUNT(*) FROM orgs o WHERE $oAct"), 'avec_email' => $one("SELECT COUNT(*) FROM orgs o WHERE $oMail"),
                'avec_tag' => $one("SELECT COUNT(*) FROM orgs o WHERE $oTag"), 'utiles' => $one("SELECT COUNT(*) FROM orgs o WHERE $oUse"),
                'sans_rien' => $one("SELECT COUNT(*) FROM orgs o WHERE NOT $oUse")],
        ]);

    case 'mc_conf':
        // Réglage Mailchimp. La clé est enregistrée mais jamais renvoyée au navigateur.
        require_admin($me);
        require_once __DIR__ . '/lib/mailchimp.php';
        if ($method === 'POST') {
            $patch = [];
            $key = trim((string)($b['key'] ?? ''));
            if ($key !== '') { if (!preg_match('/^[A-Za-z0-9]{20,64}-[a-z]{2,4}\d{1,3}$/', $key)) fail("La clé Mailchimp n'a pas le bon format."); $patch['key'] = $key; }
            if (array_key_exists('list', $b)) $patch['list'] = preg_replace('/[^A-Za-z0-9]/', '', (string)$b['list']);
            if (array_key_exists('follow', $b)) {
                $follow = [];
                foreach ((array)$b['follow'] as $f) { $mc = mb_substr(trim((string)($f['mc'] ?? '')), 0, 100); $crm = mb_substr(trim((string)($f['crm'] ?? '')), 0, 100); if ($mc !== '' && $crm !== '') $follow[] = ['mc' => $mc, 'crm' => $crm]; }
                $patch['follow'] = $follow;
            }
            if ($patch) mc_save($patch);
        }
        $out = mc_public();
        if ($out['configured']) {
            try { $out['lists'] = mc_lists(); if ($out['list'] !== '') $out['tags'] = mc_tags($out['list']); }
            catch (Throwable $ex) { $out['error'] = $ex instanceof RuntimeException ? $ex->getMessage() : 'Lecture de Mailchimp impossible.'; }
        }
        json_out($out);

    case 'mc_sync':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        require_once __DIR__ . '/lib/mailchimp.php';
        @set_time_limit(180);
        json_out(mc_sync());

    case 'mc_push':
        // Envoi des contacts utiles du CRM vers Mailchimp. Sans « go », compte seulement, sans rien envoyer.
        require_admin($me);
        require_once __DIR__ . '/lib/mailchimp.php';
        @set_time_limit(180);
        try {
            // Variante « cp » : responsables formation des établissements de santé, vers l'audience Biologie e-learning.
            // Variante « odpc » : copie ponctuelle des organismes de formation en santé vers l'audience Biologie e-learning.
            if (!empty($_GET['odpc'])) json_out(mc_odpc_copy(!($method === 'POST' && !empty($b['go']))));
            if (!empty($_GET['cp'])) json_out(mc_cp_push(!($method === 'POST' && !empty($b['go']))));
            if ($method === 'POST' && !empty($b['go'])) json_out(mc_push(false));
            if (!empty($_GET['batch'])) json_out(mc_batch_status((string)$_GET['batch']));
            json_out(mc_push(true));
        } catch (RuntimeException $ex) { fail($ex->getMessage()); }

    case 'cal_conf':
        // Réglage Calendly. La clé d'accès est enregistrée mais jamais renvoyée au navigateur.
        require_admin($me);
        require_once __DIR__ . '/lib/calendly.php';
        if ($method === 'POST') {
            $patch = [];
            $tok = preg_replace('/\s+/', '', (string)($b['token'] ?? ''));
            // Clé collée plusieurs fois de suite par mégarde : on n'en garde qu'un exemplaire.
            for ($n = 8; $n >= 2; $n--) { $len = strlen($tok); if ($len >= 60 && $len % $n === 0 && str_repeat(substr($tok, 0, intdiv($len, $n)), $n) === $tok) { $tok = substr($tok, 0, intdiv($len, $n)); break; } }
            if ($tok !== '') { if (!preg_match('/^[A-Za-z0-9._\-]{30,3000}$/', $tok)) fail("La clé d'accès Calendly n'a pas le bon format."); $patch['token'] = $tok; }
            if (array_key_exists('names', $b)) {
                $names = [];
                foreach ((array)$b['names'] as $n) { $n = mb_substr(trim((string)$n), 0, 200); if ($n !== '') $names[] = $n; }
                $patch['names'] = array_values(array_unique($names));
            }
            if ($patch) cal_save($patch);
        }
        $out = cal_public();
        if ($out['configured']) {
            try { $out['types'] = cal_type_names(); }
            catch (Throwable $ex) { $out['error'] = $ex instanceof RuntimeException ? $ex->getMessage() : 'Lecture de Calendly impossible.'; }
        }
        json_out($out);

    case 'cal_sync':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        require_once __DIR__ . '/lib/calendly.php';
        @set_time_limit(180);
        try { json_out(cal_sync()); }
        catch (RuntimeException $ex) { fail($ex->getMessage()); }

    case 'billing_conf':
        // Destinataire des rappels de facturation.
        require_admin($me);
        require_once __DIR__ . '/lib/billing.php';
        if ($method === 'POST') {
            $to = strtolower(trim((string)($b['to'] ?? '')));
            if ($to !== '' && !filter_var($to, FILTER_VALIDATE_EMAIL)) fail('Adresse e-mail invalide.');
            set_setting('billing', ['to' => $to, 'enabled' => !empty($b['enabled'])]);
        }
        json_out(billing_conf());

    case 'billing_test':
        // E-mail d'essai envoyé à l'administrateur connecté, pour vérifier que les messages arrivent.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        require_once __DIR__ . '/lib/billing.php';
        if (empty($me['email'])) fail('Votre compte n\'a pas d\'adresse e-mail.');
        $ok = billing_mail((string)$me['email'], 'Essai des rappels de facturation du CRM',
            "Bonjour,\n\nCeci est un message d'essai du CRM 360skillvue. Si vous le recevez, les rappels de facturation arriveront de la même façon.\n\nPensez à regarder aussi dans le courrier indésirable.\n");
        json_out(['sent' => $ok, 'to' => (string)$me['email']]);

    case 'field_add':
        // Champ propre au CRM (sans équivalent dans Pipedrive). Types : varchar (texte), enum (liste, un choix), set (cases à cocher).
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        $fe = (string)($b['entity'] ?? '');
        if (!in_array($fe, ['deal', 'org', 'person'], true)) fail('Type de fiche inconnu.');
        $flabel = mb_substr(trim((string)($b['label'] ?? '')), 0, 190);
        if ($flabel === '') fail('Le nom du champ est obligatoire.');
        $ftype = in_array($b['type'] ?? '', ['varchar', 'enum', 'set'], true) ? (string)$b['type'] : 'varchar';
        $fopts = [];
        foreach ((array)($b['options'] ?? []) as $o) { $o = mb_substr(trim((string)$o), 0, 100); if ($o !== '' && !in_array($o, $fopts, true)) $fopts[] = $o; }
        if ($ftype !== 'varchar' && !$fopts) fail('Indiquez au moins un choix.');
        $fkey = (string)($b['key'] ?? '');
        if (!preg_match('/^crm_[a-z0-9_]{2,60}$/', $fkey)) $fkey = 'crm_' . substr(sha1($fe . '|' . mb_strtolower($flabel)), 0, 12);
        $pos = (int)q('SELECT COALESCE(MAX(position), 0) + 1 FROM fields WHERE entity = ?', [$fe])->fetchColumn();
        q('INSERT INTO fields (entity, fkey, label, type, options, position) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE label = VALUES(label), type = VALUES(type), options = VALUES(options)',
          [$fe, $fkey, $flabel, $ftype, $fopts ? json_encode($fopts, JSON_UNESCAPED_UNICODE) : null, $pos]);
        json_out(['ok' => true, 'key' => $fkey]);

    case 'fields':
        // Champs masqués dans les fiches : les valeurs restent en base, seul l'affichage change.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        $known = [];
        foreach (q('SELECT entity, fkey FROM fields')->fetchAll() as $f) $known[$f['entity'] . ':' . $f['fkey']] = true;
        $hide = [];
        foreach ((array)($b['hidden'] ?? []) as $k) if (is_string($k) && isset($known[$k])) $hide[$k] = true;
        set_setting('hidden_fields', array_keys($hide));
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

    case 'pipeline_delete':
        // Supprime un pipeline, ses étapes et ses affaires (définitif). Les activités restent, détachées de l'affaire.
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_admin($me);
        $pid = (int)($b['id'] ?? 0);
        if (!$pid || !q('SELECT id FROM pipelines WHERE id = ?', [$pid])->fetchColumn()) fail('Pipeline introuvable.');
        db()->beginTransaction();
        $ids = array_map('intval', q('SELECT d.id FROM deals d LEFT JOIN stages s ON s.id = d.stage_id WHERE d.pipeline_id = ? OR s.pipeline_id = ?', [$pid, $pid])->fetchAll(PDO::FETCH_COLUMN));
        if ($ids) {
            $in = implode(',', $ids);
            q("UPDATE activities SET deal_id = NULL WHERE deal_id IN ($in)");
            q("DELETE FROM deals WHERE id IN ($in)");
        }
        q('DELETE FROM stages WHERE pipeline_id = ?', [$pid]);
        q('DELETE FROM pipelines WHERE id = ?', [$pid]);
        db()->commit();
        json_out(['ok' => true, 'deals' => count($ids)]);

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
            // Accès retiré ou mot de passe changé par l'administrateur : les connexions gardées de cette personne sont fermées.
            if (($pass !== '' || !$canLogin || !$active) && $id !== (int)$me['id']) { try { remember_schema(); q('DELETE FROM crm_remember WHERE user_id = ?', [$id]); } catch (Throwable $ex) {} }
        } else {
            if ($canLogin && $pass === '') fail('Choisissez un mot de passe pour ouvrir l\'accès.');
            q('INSERT INTO users (name, email, password_hash, role, can_login, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [$name, $email, $pass !== '' ? password_hash($pass, PASSWORD_DEFAULT) : null, $role, $canLogin, $active, now_utc()]);
        }
        json_out(['ok' => true]);

    case 'claude_conns':
        require_once __DIR__ . '/lib/oauth.php';
        $admin = $me['role'] === 'admin';
        json_out(['url' => crm_base_url() . '/mcp.php', 'conns' => array_map(fn($c) => ['client_id' => $c['client_id'], 'client' => $c['client'], 'user_id' => (string)$c['user_id'], 'user' => $c['user'],
            'since' => str_replace(' ', 'T', $c['since']) . 'Z'], oauth_connections($admin ? null : (int)$me['id']))]);

    case 'claude_revoke':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        require_once __DIR__ . '/lib/oauth.php';
        $uid = (int)($b['user_id'] ?? 0);
        if ($uid !== (int)$me['id'] && $me['role'] !== 'admin') fail('Réservé aux administrateurs.', 403);
        oauth_revoke($uid, (string)($b['client_id'] ?? ''));
        json_out(['ok' => true]);

    case 'password':
        if ($method !== 'POST') fail('Méthode non autorisée.', 405);
        $hash = q('SELECT password_hash FROM users WHERE id = ?', [$me['id']])->fetchColumn();
        if (!$hash || !password_verify((string)($b['current'] ?? ''), $hash)) fail('Mot de passe actuel incorrect.');
        $new = (string)($b['new'] ?? '');
        if (strlen($new) < 10) fail('Le nouveau mot de passe doit faire au moins 10 caractères.');
        q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($new, PASSWORD_DEFAULT), $me['id']]);
        // Mot de passe changé : les connexions gardées sur les autres appareils sont fermées.
        try { remember_schema(); q('DELETE FROM crm_remember WHERE user_id = ? AND selector <> ?', [$me['id'], substr((string)($_COOKIE[REMEMBER_COOKIE] ?? ''), 0, 24)]); } catch (Throwable $ex) {}
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
