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
/* $method : POST, GET ou PATCH (Make refuse tout le reste, et toute suppression). $asUser : identifiant ScanUp de l'auteure des
   modules, que le compte administrateur du cabinet incarne pour agir dans l'espace évaluateurs. $fileUrl : image du CRM
   (media/su/…) que Make télécharge puis envoie à ScanUp en pièce jointe. */
function scanup_call(int $cabinet, string $path, ?array $body, string $method = 'POST', ?int $asUser = null, ?string $fileUrl = null): array {
    // ScanUp n'accepte que 10 connexions par minute, et Make se connecte à chaque appel (deux fois quand il agit au nom
    // de l'auteure des modules) : on espace les appels (7,5 s, ou 13 s avec incarnation), et un refus de connexion
    // (401 ou 429, ou connexion refusée avant l'appel : l'opération n'a pas été exécutée) est réessayé.
    for ($try = 0; ; $try++) {
        $wait = ($asUser ? 13.0 : 7.5) - (microtime(true) - (float)setting('scanup_last_call', 0));
        if ($wait > 0) usleep((int)($wait * 1e6));
        set_setting('scanup_last_call', microtime(true));
        [$code, $j] = scanup_call_once($cabinet, $path, $body, $method, $asUser, $fileUrl);
        if (($code !== 401 && $code !== 429) || $try >= 3) {
            if ($code === 401 || $code === 429) throw new RuntimeException("ScanUp refuse la connexion de Make (limite de 10 connexions par minute, ou mot de passe du cabinet n° $cabinet changé). Attendez une minute puis cliquez sur « Reprendre ».");
            return [$code, $j];
        }
        sleep(30);
    }
}
function scanup_call_once(int $cabinet, string $path, ?array $body, string $method, ?int $asUser, ?string $fileUrl): array {
    $c = scanup_conf();
    if ($c['url'] === '' || $c['key'] === '') throw new RuntimeException("La liaison avec ScanUp n'est pas encore réglée.");
    $payload = ['key' => $c['key'], 'cabinetId' => (string)$cabinet, 'method' => $method, 'path' => $path,
                'body' => $body === null ? '' : json_encode($body, JSON_UNESCAPED_UNICODE), 'asUserId' => $asUser ? (string)$asUser : ''];
    if ($fileUrl) { $payload['fileUrl'] = $fileUrl; $payload['fileName'] = 'module.jpg'; }
    $ch = curl_init($c['url']);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 90, CURLOPT_POST => true, CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE)]);
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    $http = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($raw === false) throw new RuntimeException('Make ne répond pas : ' . $err);
    // Le scénario Make a échoué en cours de route (code 5xx) : en pratique, ScanUp a refusé la connexion du cabinet
    // (limite de connexions par minute) avant l'appel lui-même, qui n'a donc pas été fait. On le signale comme un 429
    // pour qu'il soit réessayé après une pause.
    if ($http >= 500 && !preg_match('/^\s*\d{3} \| /', (string)$raw)) return [429, []];
    // Make répond « code | réponse de ScanUp ». Autre chose : la demande a été refusée (clé, cabinet absent de la table).
    if (!preg_match('/^\s*(\d{3}) \| (.*)$/s', (string)$raw, $m)) throw new RuntimeException("Make a refusé la demande ($method $path, code $http" . ($raw !== '' ? ', « ' . mb_substr(trim((string)$raw), 0, 60) . ' »' : '') . ") : le cabinet n° $cabinet est-il bien dans la table des cabinets en essai, avec son mot de passe, et le scénario Make est-il à jour ?");
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
    $extra['su_org'] = (string)$orgId; $extra['su_cab'] = (string)$cabinet;
    if ($ids) $extra['su_ids'] = implode(',', $ids);
    if (!$error) $extra['su_ops'] = substr($now, 0, 10);
    q('UPDATE deals SET extra = ?, update_time = ? WHERE id = ?', [json_encode($extra, JSON_UNESCAPED_UNICODE), $now, $dealId]);
    if (!$error) {
        q('INSERT INTO activities (type, subject, due_date, done, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)',
            ['task', mb_substr("ScanUp : préparer les modules et envoyer les vignettes ($name)", 0, 500), gmdate('Y-m-d', time() + 86400), (int)$me['id'], $dealId, $deal['person_id'], $deal['org_id'],
             "Client test n° $orgId, cabinet n° $cabinet. Identifiants : " . implode(', ', $ids) . ". Mettre les modules à disposition avec une session et des crédits, inscrire les opérateurs, puis envoyer le PDF de vignettes au contact.", $now, $now]);
    }
    return ['ok' => !$error, 'org_id' => $orgId, 'done' => $done, 'error' => $error, 'identifiants' => $ids];
}

/* Accès responsable de projet donné au client, s'il le demande : compte à l'e-mail de son contact, dans son organisation
   ScanUp, avec le mot de passe initial habituel des comptes (changé à la première connexion). */
function scanup_rp_access(array $me, array $in): array {
    $deal = q('SELECT id, person_id, org_id, extra FROM deals WHERE id = ?', [(int)($in['deal_id'] ?? 0)])->fetch();
    if (!$deal) throw new RuntimeException('Affaire introuvable.');
    $org = (int)($in['org_id'] ?? 0); $cab = (int)($in['cabinet'] ?? 0);
    $first = mb_substr(trim((string)($in['first_name'] ?? '')), 0, 60); $last = mb_substr(trim((string)($in['last_name'] ?? '')), 0, 60);
    $email = strtolower(trim((string)($in['email'] ?? '')));
    if ($org < 1 || $cab < 1) throw new RuntimeException("Indiquez le numéro de l'organisation et du cabinet dans ScanUp.");
    if ($first === '' || $last === '') throw new RuntimeException('Indiquez le prénom et le nom de la personne.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/@operator\.local$|^(lauredellamonica|maximebailloud)\+/', $email))
        throw new RuntimeException("Indiquez l'adresse e-mail professionnelle de la personne chez le client.");
    $pass = scanup_conf()['op_password'];
    if ($pass === '') throw new RuntimeException("Le mot de passe initial des comptes n'est pas réglé (Réglages, ScanUp).");
    [$code, $j] = scanup_call($cab, "/api/admin/organisations/$org/users", ['firstName' => $first, 'lastName' => $last, 'email' => $email, 'password' => $pass, 'role' => 'hse']);
    if ($code === 409) throw new RuntimeException("Cette adresse e-mail a déjà un compte dans ScanUp.");
    if ($code !== 201) throw new RuntimeException(scanup_fail('Création du compte responsable de projet', $code, $j));
    $now = now_utc();
    q('INSERT INTO activities (type, subject, due_date, done, done_time, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['note', mb_substr("ScanUp responsable de projet : accès donné au client ($email)", 0, 500), substr($now, 0, 10), $now, (int)$me['id'], $deal['id'], $deal['person_id'], $deal['org_id'],
       "Compte responsable de projet créé pour $first $last ($email) dans l'organisation ScanUp n° $org (cabinet n° $cab), à la demande du client, avec le mot de passe initial habituel (à changer à la première connexion).", $now, $now]);
    $extra = $deal['extra'] ? (json_decode((string)$deal['extra'], true) ?: []) : [];
    $extra['su_rp_client'] = substr($now, 0, 10);
    q('UPDATE deals SET extra = ?, update_time = ? WHERE id = ?', [json_encode($extra, JSON_UNESCAPED_UNICODE), $now, $deal['id']]);
    return ['ok' => true, 'email' => $email, 'password' => $pass, 'url' => 'https://scanup.360skillvue.com/'];
}

/* Vignettes à découper : une par opérateur, avec l'adresse de connexion, l'identifiant et le mot de passe initial.
   Les identifiants viennent de l'affaire (su_ids) ou, pour les clients créés avant, de la trace de création. */
function scanup_vignettes(int $dealId): array {
    $deal = q('SELECT d.id, d.title, d.extra, o.name AS org_name FROM deals d LEFT JOIN orgs o ON o.id = d.org_id WHERE d.id = ?', [$dealId])->fetch();
    if (!$deal) throw new RuntimeException('Affaire introuvable.');
    $extra = $deal['extra'] ? (json_decode((string)$deal['extra'], true) ?: []) : [];
    $ids = array_values(array_filter(array_map('trim', explode(',', (string)($extra['su_ids'] ?? '')))));
    if (!$ids) {
        foreach (q("SELECT note FROM activities WHERE deal_id = ? AND note IS NOT NULL ORDER BY id DESC", [$dealId])->fetchAll(PDO::FETCH_COLUMN) as $n) {
            if (preg_match('/op[ée]rateurs cr[ée]{2}s(?: avant l\'arr[êe]t)?\s*:\s*([a-z0-9]+(?:\s*,\s*[a-z0-9]+)*)/iu', (string)$n, $m)
             || preg_match('/Identifiants\s*:\s*([a-z0-9]+(?:\s*,\s*[a-z0-9]+)*)/iu', (string)$n, $m)) {
                $ids = array_values(array_filter(array_map('trim', explode(',', $m[1])))); break;
            }
        }
    }
    if (!$ids) throw new RuntimeException("Aucun identifiant d'opérateur trouvé sur cette affaire : le client test a-t-il été créé depuis le CRM ?");
    $pass = scanup_conf()['op_password'];
    if ($pass === '') throw new RuntimeException("Le mot de passe initial des opérateurs n'est pas réglé (Réglages, liaison ScanUp).");
    return ['client' => preg_replace('/\s*\(test[^)]*\)\s*$/iu', '', (string)($deal['org_name'] ?: $deal['title'])), 'url' => 'https://scanup.360skillvue.com/', 'password' => $pass, 'ids' => $ids];
}
