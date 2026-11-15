<?php
// Rappels de facturation : quand une affaire arrive à l'étape de signature, puis à l'étape des livrables,
// le CRM crée une tâche pour le responsable de l'affaire et prévient par e-mail la personne chargée de la facturation.
// Une seule fois par affaire et par type de facture (acompte, solde).
declare(strict_types=1);

/* Étapes qui déclenchent un rappel : nom de l'étape en minuscules vers type de facture. */
const BILLING_STAGES = ['devis signé' => 'acompte', 'contrat signé' => 'acompte', 'livrables envoyés' => 'solde'];

function billing_conf(): array {
    $c = setting('billing');
    $c = is_array($c) ? $c : [];
    return ['to' => (string)($c['to'] ?? ''), 'enabled' => array_key_exists('enabled', $c) ? !empty($c['enabled']) : true];
}

function billing_money(float $v): string {
    return number_format($v, 2, ',', ' ') . ' €';
}

/* Envoi d'un e-mail en texte simple depuis l'hébergement. Renvoie vrai si le serveur a accepté le message. */
function billing_mail(string $to, string $subject, string $body, ?string $replyTo = null): bool {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return false;
    $host = preg_replace('/[^a-z0-9.\-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'crm.360skillvue.com')) ?: 'crm.360skillvue.com';
    $from = 'crm@' . preg_replace('/^crm\./i', '', $host);
    $headers = ['MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit',
        'From: CRM 360skillvue <' . $from . '>'];
    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: ' . $replyTo;
    $subj = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    return @mail($to, $subj, $body, implode("\r\n", $headers));
}

/* À appeler après la mise à jour d'une affaire. $before et $after sont les lignes de la table deals. */
function billing_on_deal_update(array $before, array $after, array $me): ?array {
    if ((string)($before['stage_id'] ?? '') === (string)($after['stage_id'] ?? '') || empty($after['stage_id'])) return null;
    $st = q('SELECT s.name AS stage, p.name AS pipeline FROM stages s JOIN pipelines p ON p.id = s.pipeline_id WHERE s.id = ?', [(int)$after['stage_id']])->fetch();
    if (!$st) return null;
    $kind = BILLING_STAGES[mb_strtolower(trim((string)$st['stage']))] ?? null;
    if ($kind === null) return null;
    $conf = billing_conf();
    if (!$conf['enabled']) return null;
    $done = setting('billing_done', []);
    $done = is_array($done) ? $done : [];
    $key = $after['id'] . ':' . $kind;
    if (isset($done[$key])) return null;

    $org = $after['org_id'] ? (string)q('SELECT name FROM orgs WHERE id = ?', [(int)$after['org_id']])->fetchColumn() : '';
    $person = $after['person_id'] ? (string)q('SELECT name FROM persons WHERE id = ?', [(int)$after['person_id']])->fetchColumn() : '';
    $ownerId = $after['owner_id'] ? (int)$after['owner_id'] : (int)$me['id'];
    $owner = q('SELECT name, email FROM users WHERE id = ?', [$ownerId])->fetch() ?: ['name' => (string)$me['name'], 'email' => (string)($me['email'] ?? '')];
    $value = (float)$after['value'];
    $client = $org !== '' ? $org : (string)$after['title'];

    if ($kind === 'acompte') {
        $subject = 'Facture d\'acompte de 50 % à envoyer : ' . $client;
        $what = "Le devis est signé. La facture d'acompte de 50 % est à envoyer.";
        $amount = $value > 0 ? 'Acompte de 50 % : ' . billing_money($value / 2) . ' HT (devis de ' . billing_money($value) . ' HT)' : 'Montant du devis non renseigné dans le CRM : à vérifier.';
    } else {
        $subject = 'Facture de solde à envoyer : ' . $client;
        $what = 'Les livrables sont envoyés. La facture de solde est à envoyer.';
        $amount = $value > 0 ? 'Solde de 50 % : ' . billing_money($value / 2) . ' HT (devis de ' . billing_money($value) . ' HT)' : 'Montant du devis non renseigné dans le CRM : à vérifier.';
    }
    $lines = [$what, '', 'Client : ' . $client, 'Affaire : ' . (string)$after['title']];
    if ($person !== '') $lines[] = 'Contact : ' . $person;
    $lines[] = $amount;
    $lines[] = 'Responsable de l\'affaire : ' . (string)$owner['name'];
    $lines[] = 'Pipeline : ' . (string)$st['pipeline'] . ', étape : ' . (string)$st['stage'];
    $note = implode("\n", $lines);

    // 1. Tâche dans le CRM pour le responsable de l'affaire
    $now = now_utc();
    q('INSERT INTO activities (type, subject, due_date, done, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)',
        ['task', mb_substr($subject, 0, 500), gmdate('Y-m-d'), $ownerId, (int)$after['id'], $after['person_id'] ? (int)$after['person_id'] : null,
         $after['org_id'] ? (int)$after['org_id'] : null, $note, $now, $now]);

    // 2. E-mail à la personne chargée de la facturation
    $sent = false;
    if ($conf['to'] !== '') {
        $body = "Bonjour,\n\n" . $note . "\n\nMessage envoyé automatiquement par le CRM 360skillvue.\nhttps://" . ($_SERVER['HTTP_HOST'] ?? 'crm.360skillvue.com') . "/\n";
        $sent = billing_mail($conf['to'], $subject, $body, (string)($owner['email'] ?? ''));
    }
    $done[$key] = ['at' => $now, 'mail' => $sent];
    set_setting('billing_done', (object)$done);
    return ['kind' => $kind, 'mail' => $sent, 'to' => $conf['to']];
}
