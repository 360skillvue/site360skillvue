<?php
// Porte d'entrée pour les outils externes (par exemple l'automatisation ScanUp des essais) : crée une tâche dans le CRM.
// Appel : POST en JSON, avec la clé du CRM dans l'en-tête X-CRM-Key. Aucune lecture possible par cette porte.
// Champs : subject (obligatoire), org (nom de l'organisation, « (test …) » toléré), note, due_date (AAAA-MM-JJ),
//          owner_email (facultatif), ref (facultatif : une même référence ne crée la tâche qu'une fois),
//          done (facultatif : vrai pour une simple trace dans l'historique, sans tâche à cocher).
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
security_headers();

function hook_out(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') hook_out(['error' => 'Méthode non autorisée.'], 405);
    $key = (string)setting('hook_key', '');
    $given = (string)($_SERVER['HTTP_X_CRM_KEY'] ?? '');
    if ($key === '' || $given === '' || !hash_equals($key, $given)) hook_out(['error' => 'Clé refusée.'], 401);

    $b = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($b)) hook_out(['error' => 'Requête illisible.'], 400);
    $subject = mb_substr(trim((string)($b['subject'] ?? '')), 0, 500);
    if ($subject === '') hook_out(['error' => 'Le champ subject est obligatoire.'], 400);
    $note = mb_substr((string)($b['note'] ?? ''), 0, 5000);
    $due = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($b['due_date'] ?? '')) ? (string)$b['due_date'] : gmdate('Y-m-d');
    $ref = mb_substr(trim((string)($b['ref'] ?? '')), 0, 190);

    // Une même référence ne crée la tâche qu'une fois.
    $seen = setting('hook_refs', []);
    $seen = is_array($seen) ? $seen : [];
    if ($ref !== '' && isset($seen[$ref])) hook_out(['ok' => true, 'duplicate' => true, 'activity_id' => $seen[$ref]]);

    // Organisation : on retire une éventuelle mention entre parenthèses, par exemple « Enaex (test) ».
    $orgRaw = trim((string)($b['org'] ?? ''));
    $orgName = trim((string)preg_replace('/\s*\([^)]*\)\s*/u', ' ', $orgRaw));
    $inside = '';
    if (preg_match('/\(\s*test\s+([^)]+)\)/iu', $orgRaw, $m)) $inside = trim($m[1]); // « PVI Gretz (test Renault) » : Renault

    $deal = null;
    foreach (array_filter([$orgName, $inside]) as $name) {
        $like = '%' . addcslashes($name, '%_\\') . '%';
        $deal = q("SELECT d.id, d.owner_id, d.org_id, d.person_id, d.title FROM deals d LEFT JOIN orgs o ON o.id = d.org_id
                   WHERE d.status = 'open' AND (o.name LIKE ? OR d.title LIKE ?) ORDER BY d.update_time DESC LIMIT 1", [$like, $like])->fetch();
        if ($deal) break;
    }

    // Responsable : celui demandé, sinon celui de l'affaire, sinon le premier administrateur.
    $ownerId = null;
    $ownerEmail = strtolower(trim((string)($b['owner_email'] ?? '')));
    if ($ownerEmail !== '') $ownerId = q('SELECT id FROM users WHERE email = ? AND active = 1', [$ownerEmail])->fetchColumn() ?: null;
    if (!$ownerId && $deal && $deal['owner_id']) $ownerId = $deal['owner_id'];
    if (!$ownerId) $ownerId = q("SELECT id FROM users WHERE role = 'admin' AND active = 1 ORDER BY id LIMIT 1")->fetchColumn() ?: null;

    if (!$deal && $orgRaw !== '') $note = trim("Organisation indiquée : " . $orgRaw . " (aucune affaire en cours trouvée à ce nom).\n" . $note);
    $now = now_utc();
    // done = true : simple trace dans l'historique de l'affaire (rien à cocher) ; sinon tâche à faire.
    $done = !empty($b['done']) ? 1 : 0;
    q('INSERT INTO activities (type, subject, due_date, done, done_time, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['task', $subject, $due, $done, $done ? $now : null, $ownerId ? (int)$ownerId : null, $deal ? (int)$deal['id'] : null, $deal && $deal['person_id'] ? (int)$deal['person_id'] : null,
         $deal && $deal['org_id'] ? (int)$deal['org_id'] : null, $note, $now, $now]);
    $aid = (int)db()->lastInsertId();
    if ($ref !== '') { $seen[$ref] = $aid; if (count($seen) > 3000) $seen = array_slice($seen, -2000, null, true); set_setting('hook_refs', (object)$seen); }
    hook_out(['ok' => true, 'activity_id' => $aid, 'deal' => $deal ? $deal['title'] : null]);
} catch (Throwable $e) {
    error_log('[crm] hook ' . $e->getMessage());
    hook_out(['error' => 'Erreur serveur.'], 500);
}
