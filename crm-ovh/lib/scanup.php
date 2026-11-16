<?php
// Création d'un client test dans ScanUp depuis une affaire du CRM.
// Le CRM ne connaît aucun mot de passe de ScanUp : il passe par un scénario Make, qui se connecte avec le compte
// administrateur du cabinet (table Make « ScanUp - cabinets en essai à suivre ») et n'accepte que deux créations :
// une organisation, ou un utilisateur dans une organisation. L'adresse et la clé de ce scénario sont dans les réglages
// (jamais dans le code). Les modules, la session, les crédits et les vignettes restent à faire ensuite.
declare(strict_types=1);

function scanup_conf(): array {
    $c = setting('scanup_make', []);
    $c = is_array($c) ? $c : [];
    return ['url' => (string)($c['url'] ?? ''), 'key' => (string)($c['key'] ?? ''), 'op_password' => (string)($c['op_password'] ?? '')];
}
function scanup_public(): array {
    $c = scanup_conf();
    return ['configured' => $c['url'] !== '' && $c['key'] !== '' && $c['op_password'] !== ''];
}
function scanup_save(array $in): void {
    $c = scanup_conf();
    foreach (['url', 'key', 'op_password'] as $k) { $v = trim((string)($in[$k] ?? '')); if ($v !== '') $c[$k] = $v; }
    if ($c['url'] !== '' && !preg_match('#^https://hook\.[a-z0-9]+\.make\.com/[A-Za-z0-9]+$#', $c['url'])) throw new RuntimeException("L'adresse du scénario Make n'a pas le bon format.");
    set_setting('scanup_make', $c);
}

/* Un appel de création dans ScanUp, par Make. Renvoie [code, réponse décodée]. */
function scanup_call(int $cabinet, string $path, array $body): array {
    $c = scanup_conf();
    if ($c['url'] === '' || $c['key'] === '') throw new RuntimeException("La liaison avec ScanUp n'est pas encore réglée.");
    $ch = curl_init($c['url']);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60, CURLOPT_POST => true, CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode(['key' => $c['key'], 'cabinetId' => (string)$cabinet, 'method' => 'POST', 'path' => $path, 'body' => json_encode($body, JSON_UNESCAPED_UNICODE)], JSON_UNESCAPED_UNICODE)]);
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) throw new RuntimeException('Make ne répond pas : ' . $err);
    // Make répond « code | réponse de ScanUp ». Autre chose : la demande a été refusée (clé, cabinet absent de la table).
    if (!preg_match('/^\s*(\d{3}) \| (.*)$/s', (string)$raw, $m)) throw new RuntimeException("Make a refusé la demande : le cabinet n° $cabinet est-il bien dans la table des cabinets en essai, avec son mot de passe ?");
    $j = json_decode($m[2], true);
    return [(int)$m[1], is_array($j) ? $j : []];
}
function scanup_fail(string $what, int $code, array $j): string {
    $msg = (string)($j['message'] ?? ($j['error']['message'] ?? ''));
    return $what . ' : ScanUp a répondu ' . $code . ($msg !== '' ? ' (' . mb_substr($msg, 0, 200) . ')' : '') . '.';
}

/* Crée l'organisation cliente « … (test) », son responsable de projet (alias, jamais remis au client) et ses opérateurs
   sans e-mail. Écrit une trace sur l'affaire, coche les étapes du parcours et crée la tâche « Envoyer les vignettes ». */
function scanup_trial_create(array $me, array $in): array {
    $dealId = (int)($in['deal_id'] ?? 0);
    $deal = q('SELECT id, title, person_id, org_id, extra FROM deals WHERE id = ?', [$dealId])->fetch();
    if (!$deal) throw new RuntimeException('Affaire introuvable.');
    $name = mb_substr(trim((string)($in['name'] ?? '')), 0, 120);
    $cabinet = (int)($in['cabinet'] ?? 0);
    $prefix = strtolower(trim((string)($in['prefix'] ?? '')));
    $n = (int)($in['n'] ?? 5);
    $rp = strtolower(trim((string)($in['rp_email'] ?? '')));
    if ($name === '' || stripos($name, 'test') === false) throw new RuntimeException('Le nom du client test doit contenir « test » : sans cela il ne serait pas suivi.');
    if ($cabinet < 1) throw new RuntimeException('Indiquez le numéro du cabinet.');
    if (!preg_match('/^[a-z][a-z0-9]{2,19}$/', $prefix)) throw new RuntimeException("L'identifiant des opérateurs doit faire 3 à 20 lettres ou chiffres, sans espace ni accent.");
    if ($n < 1 || $n > 20) throw new RuntimeException('Le nombre de testeurs doit être compris entre 1 et 20.');
    if (!preg_match('/^(lauredellamonica|maximebailloud)\+[a-z0-9._-]{2,40}@gmail\.com$/', $rp)) throw new RuntimeException("Le responsable de projet doit être un alias Gmail de Laure ou de Maxime (par exemple lauredellamonica+client@gmail.com).");
    $conf = scanup_conf();
    if ($conf['op_password'] === '') throw new RuntimeException("Le mot de passe initial des opérateurs n'est pas réglé.");

    $done = [];
    [$code, $j] = scanup_call($cabinet, '/api/organisations', ['nom' => $name, 'typeOrganisation' => 'client']);
    $orgId = (int)($j['data']['id'] ?? 0);
    if ($code !== 201 || !$orgId) throw new RuntimeException(scanup_fail("Création de l'organisation", $code, $j));
    $done[] = "Organisation « $name » créée (n° $orgId) dans le cabinet n° $cabinet.";

    $error = null;
    $ids = [];
    try {
        [$code, $j] = scanup_call($cabinet, "/api/admin/organisations/$orgId/users",
            ['firstName' => 'Responsable', 'lastName' => mb_substr(preg_replace('/\s*\(.*$/', '', $name), 0, 60), 'email' => $rp, 'password' => bin2hex(random_bytes(9)) . 'Aa1!', 'role' => 'hse']);
        if ($code !== 201) throw new RuntimeException(scanup_fail('Création du responsable de projet', $code, $j));
        $done[] = "Responsable de projet créé : $rp.";
        $short = mb_substr(preg_replace('/\s*\(.*$/', '', $name), 0, 60);
        for ($i = 1; $i <= $n; $i++) {
            [$code, $j] = scanup_call($cabinet, "/api/admin/organisations/$orgId/users",
                ['firstName' => $short, 'lastName' => "Operateur $i", 'email' => $prefix . $i . '@operator.local', 'password' => $conf['op_password'], 'role' => 'operator']);
            if ($code !== 201) throw new RuntimeException(scanup_fail("Création de l'opérateur $prefix$i", $code, $j));
            $ids[] = $prefix . $i;
        }
        $done[] = count($ids) . ' opérateurs créés : ' . implode(', ', $ids) . '.';
    } catch (RuntimeException $e) {
        $error = $e->getMessage();
        if ($ids) $done[] = count($ids) . ' opérateurs créés avant l\'arrêt : ' . implode(', ', $ids) . '.';
    }

    // Trace sur l'affaire : son objet commence par « ScanUp cabinet : client », ce qui coche l'étape du parcours.
    $now = now_utc();
    $note = implode("\n", $done) . ($error ? "\nArrêt : $error" : '') . "\nRestent à faire : modules, session et crédits, puis les vignettes.";
    q('INSERT INTO activities (type, subject, due_date, done, done_time, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['note', mb_substr("ScanUp cabinet : client test « $name » créé", 0, 500), substr($now, 0, 10), $now, (int)$me['id'], $dealId, $deal['person_id'], $deal['org_id'], $note, $now, $now]);
    $extra = $deal['extra'] ? (json_decode((string)$deal['extra'], true) ?: []) : [];
    $extra['su_client'] = substr($now, 0, 10);
    if (!$error) $extra['su_ops'] = substr($now, 0, 10);
    q('UPDATE deals SET extra = ?, update_time = ? WHERE id = ?', [json_encode($extra, JSON_UNESCAPED_UNICODE), $now, $dealId]);
    if (!$error) {
        q('INSERT INTO activities (type, subject, due_date, done, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)',
            ['task', mb_substr("ScanUp : préparer les modules et envoyer les vignettes ($name)", 0, 500), gmdate('Y-m-d', time() + 86400), (int)$me['id'], $dealId, $deal['person_id'], $deal['org_id'],
             "Client test n° $orgId, cabinet n° $cabinet. Identifiants : " . implode(', ', $ids) . ". Mettre les modules à disposition avec une session et des crédits, inscrire les opérateurs, puis envoyer le PDF de vignettes au contact.", $now, $now]);
    }
    return ['ok' => !$error, 'org_id' => $orgId, 'done' => $done, 'error' => $error, 'identifiants' => $ids];
}
