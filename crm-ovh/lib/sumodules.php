<?php
// Modules du client test ScanUp, créés depuis le CRM en plusieurs étapes courtes (le navigateur enchaîne les étapes) :
// copie du module modèle de l'espace évaluateurs, adaptation des textes au client et aux métiers, image, correcteur,
// publication, mise à disposition du client, session, crédits, puis inscription des opérateurs.
// Tout passe par Make (scanup_call). Les étapes de contenu se font au nom de l'auteure des modules (incarnation),
// le reste avec le compte administrateur du cabinet.
declare(strict_types=1);
require_once __DIR__ . '/scanup.php';
require_once __DIR__ . '/suimage.php';
require_once __DIR__ . '/oauth.php'; // crm_base_url()

const SU_CABINET_MODELES = 10;     // cabinet 360skillvue : les modules modèles sont dans son espace évaluateurs
const SU_AUTRICE = 36;             // Julie Sallamand, auteure des modules modèles
const SU_CORRECTRICE = 188;        // Laura Gasqueres, évaluatrice des modules TMS et RPS des clients test
// Modules modèles par type et modalité de retour (rcat : résultat et conduite à tenir ; perso : retour personnalisé).
// Une version courte peut être ajoutée par la clé « TYPE|retour|court » dans le réglage scanup_models.
const SU_MODELES = ['TMS|rcat' => 341, 'TMS|perso' => 338, 'RPS|rcat' => 342, 'RPS|perso' => 339];
// Retour au salarié : aucun (résultats masqués aux opérateurs), par e-mail avec la conduite à tenir, ou accompagnement
// en cas de dépistage positif (coaching vidéo pour TMS, téléconsultation d'orientation pour RPS).
const SU_RETOURS = ['none' => 'sans retour au salarié', 'rcat' => 'résultat et conduite à tenir', 'perso' => 'retour personnalisé'];
function su_retour_label(string $type, string $r): string {
    if ($r === 'perso') return $type === 'RPS' ? "téléconsultation d'orientation" : 'coaching vidéo';
    return SU_RETOURS[$r] ?? $r;
}
// Version suisse : mêmes questions, vocabulaire adapté dans les textes.
const SU_SUISSE = ['rapport Gollac (INRS)' => 'référentiel du SECO', 'INRS' => 'SUVA', 'CARSAT' => 'SUVA', 'CSE' => 'commission du personnel',
                   'Code du travail' => 'loi sur le travail', 'service de santé au travail' => 'service de santé au travail', 'euros' => 'francs'];

/* Livrables d'un module : cartographie des risques pour un RPS sans téléconsultation ; sinon (TMS quel que soit le retour,
   RPS avec téléconsultation) plan d'action de prévention collectif, et rapport individuel nominatif s'il est demandé. */
function su_livrables(string $type, string $retour, bool $nominatif): array {
    if ($type === 'RPS' && $retour !== 'perso') return ['Cartographie des risques psychosociaux'];
    return array_merge(['Plan d\'action de prévention collectif'], $nominatif ? ['Rapport individuel nominatif'] : []);
}

/* Conduite à tenir en cas de dépistage positif, réglée pour le client sur chaque module (sauf « pas de retour »).
   Ce sont des textes de départ : le responsable de projet du client ou l'équipe peut les personnaliser dans ScanUp. */
const SU_CALENDLY_RPS = 'https://calendly.com/isabelle-auray09/teleconsultation-d-orientation-scanup';
function su_conduite(string $type, string $retour): ?string {
    if ($retour === 'none') return null;
    if ($type === 'TMS' && $retour === 'perso')
        return "Votre étude ergonomique a mis en évidence des points de vigilance sur votre poste.\n\nL'ergonome qui a analysé vos vidéos vous répond par une vidéo de conseils, dans votre espace ScanUp, pour corriger vos gestes et vos postures. Reconnectez-vous dans les prochains jours pour la regarder.\n\nSi une douleur persiste, parlez-en à votre médecin du travail.";
    if ($type === 'RPS' && $retour === 'perso') {
        $cal = (string)(setting('scanup_calendly_rps', '') ?: SU_CALENDLY_RPS);
        return "Votre témoignage fait apparaître des points qui méritent attention.\n\nUne psychologue clinicienne vous propose une téléconsultation d'orientation confidentielle de 30 minutes, pour faire le point et vous orienter si besoin. Votre employeur n'est pas informé de ce rendez-vous. Prenez rendez-vous ici : $cal\n\nVous pouvez aussi en parler à votre médecin du travail.";
    }
    if ($type === 'TMS')
        return "Votre étude ergonomique a mis en évidence des points de vigilance sur votre poste.\n\nParlez-en à votre médecin du travail ou au référent santé et sécurité de votre site, qui pourront vous conseiller sur les aménagements possibles.\n\nSi une douleur persiste, consultez votre médecin traitant.";
    return "Votre témoignage fait apparaître des points qui méritent attention. N'hésitez pas à en parler à votre médecin du travail ou au référent santé et sécurité de votre site, qui pourront vous écouter et vous orienter vers un accompagnement adapté.\n\nEn cas de difficulté importante, vous pouvez aussi consulter votre médecin traitant.";
}

function su_models(): array {
    $m = setting('scanup_models', []);
    return array_merge(SU_MODELES, is_array($m) ? array_map('intval', $m) : []);
}
function su_ok(int $code, array $j, string $what): array {
    if ($code < 200 || $code >= 300) throw new RuntimeException(scanup_fail($what, $code, $j));
    return $j;
}
function su_suisse(string $t): string { return strtr($t, SU_SUISSE); }

/* Titre, description et consignes du nouveau module, à partir de ceux du modèle. */
function su_textes(array $model, array $s, array $mod): array {
    $titre = (string)($model['titre'] ?? ''); $desc = (string)($model['description'] ?? ''); $cons = (string)($model['instructionsText'] ?? '');
    $base = preg_split('/,\s|\s\(/u', $titre, 2)[0] ?: ($mod['type'] === 'RPS' ? 'Dépistage RPS' : 'Étude ergonomique');
    // Nom du client du modèle (entre la virgule et la parenthèse), remplacé par celui du nouveau client.
    $ancien = preg_match('/,\s*(.+?)\s*\(/u', $titre, $m) ? trim($m[1]) : '';
    $court = trim(preg_replace('/\s*\(.*$/u', '', $s['client']));
    $titreN = mb_substr("$base, $court (" . su_retour_label($mod['type'], $mod['retour']) . ')', 0, 250);
    if ($ancien !== '') { $desc = str_replace($ancien, $court, $desc); $cons = str_replace($ancien, $court, $cons); }
    if ($s['jobs'] !== '') $desc = rtrim($desc) . ' Métiers concernés : ' . rtrim($s['jobs'], ' .') . '.';
    if ($s['country'] === 'CH') { $titreN = su_suisse($titreN); $desc = su_suisse($desc); $cons = su_suisse($cons); }
    return [$titreN, $desc, $cons];
}

/* Prépare l'enchaînement à partir du formulaire. */
function su_modules_init(array $me, array $in): array {
    $deal = q('SELECT id, title, extra FROM deals WHERE id = ?', [(int)($in['deal_id'] ?? 0)])->fetch();
    if (!$deal) throw new RuntimeException('Affaire introuvable.');
    $cab = (int)($in['cabinet'] ?? 0); $org = (int)($in['org_id'] ?? 0);
    if ($cab !== SU_CABINET_MODELES) throw new RuntimeException("Les modules modèles sont dans le cabinet 360skillvue (n° 10) : pour le cabinet d'un distributeur, les modules restent à préparer à la main.");
    if ($org < 1) throw new RuntimeException("Indiquez le numéro de l'organisation cliente dans ScanUp.");
    $types = array_values(array_intersect(['TMS', 'RPS'], (array)($in['types'] ?? [])));
    if (!$types) throw new RuntimeException('Choisissez TMS, RPS ou les deux.');
    $retour = (string)($in['retour'] ?? 'rcat'); if (!in_array($retour, ['none', 'rcat', 'perso', 'both'], true)) throw new RuntimeException('Modalité de retour inconnue.');
    $country = ($in['country'] ?? 'FR') === 'CH' ? 'CH' : 'FR';
    $length = ($in['length'] ?? 'standard') === 'court' ? 'court' : 'standard';
    $end = (string)($in['end_date'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $end) || $end <= gmdate('Y-m-d')) throw new RuntimeException('Choisissez une date de fin de session à venir.');
    $models = su_models(); $mods = []; $log = [];
    foreach ($types as $t) foreach ($retour === 'both' ? ['rcat', 'perso'] : [$retour] as $r) {
        // Sans retour : même modèle que le retour par e-mail, résultats masqués aux opérateurs ensuite.
        $key = "$t|" . ($r === 'none' && empty($models["$t|none"]) ? 'rcat' : $r);
        $model = $length === 'court' && !empty($models["$key|court"]) ? $models["$key|court"] : ($models[$key] ?? 0);
        if ($length === 'court' && empty($models["$key|court"])) $log[] = "Pas de modèle court réglé pour $t (" . su_retour_label($t, $r) . ') : version standard utilisée.';
        if (!$model) throw new RuntimeException("Aucun module modèle réglé pour $t (" . su_retour_label($t, $r) . ').');
        $mods[] = ['type' => $t, 'retour' => $r, 'model' => $model, 'id' => null, 'session' => null, 'evaluator' => null];
    }
    return ['deal_id' => (int)$deal['id'], 'cabinet' => $cab, 'org_id' => $org, 'client' => mb_substr(trim((string)($in['client'] ?? '')), 0, 120) ?: $deal['title'],
        'jobs' => mb_substr(trim((string)($in['jobs'] ?? '')), 0, 200), 'country' => $country, 'length' => $length, 'retour' => $retour, 'end_date' => $end,
        'mods' => $mods, 'i' => 0, 'step' => 'dup', 'queue' => [], 'assigned' => [], 'log' => $log, 'pct' => 0, 'nominatif' => !empty($in['nominatif'])];
}

/* Une étape. Renvoie l'état mis à jour ; terminé quand step = done. */
function su_modules_step(array $me, array $s): array {
    if (empty($s['step'])) return su_modules_init($me, $s);
    $cab = (int)$s['cabinet']; $org = (int)$s['org_id'];
    if ($cab !== SU_CABINET_MODELES || $org < 1 || empty($s['mods'])) throw new RuntimeException('Demande incomplète : relancez la création des modules.');
    $nMods = count($s['mods']);
    $i = (int)$s['i']; $mod = &$s['mods'][$i];
    $lab = fn($m) => $m['type'] . ' (' . su_retour_label($m['type'], $m['retour']) . ')';
    switch ($s['step']) {
    case 'dup':
        [$c, $j] = scanup_call($cab, '/api/modules/' . (int)$mod['model'], null, 'GET');
        $model = su_ok($c, $j, 'Lecture du module modèle n° ' . $mod['model'])['data']['module'] ?? [];
        if (!$model) throw new RuntimeException('Module modèle n° ' . $mod['model'] . ' introuvable.');
        $mod['evaluator'] = (int)($model['evaluateurs'][0]['id'] ?? 0) ?: null;
        if (!$mod['evaluator']) { // la fiche détaillée ne donne pas toujours les correcteurs : on les lit à part
            [$c, $j] = scanup_call($cab, '/api/modules/' . (int)$mod['model'] . '/evaluators', null, 'GET');
            if ($c === 200) $mod['evaluator'] = (int)($j[0]['id'] ?? ($j['data'][0]['id'] ?? 0)) ?: null;
        }
        [$titre, $desc, $cons] = su_textes($model, $s, $mod);
        $mod['titre'] = $titre; $mod['desc'] = $desc;
        [$c, $j] = scanup_call($cab, '/api/modules/' . (int)$mod['model'] . '/duplicate', ['instructionsText' => $cons], 'POST', SU_AUTRICE);
        $id = (int)(su_ok($c, $j, 'Copie du module modèle')['data']['id'] ?? 0);
        if (!$id) throw new RuntimeException('ScanUp n\'a pas renvoyé le numéro du module copié.');
        $mod['id'] = $id;
        $s['log'][] = 'Module ' . $lab($mod) . " copié du modèle n° {$mod['model']} : module n° $id.";
        $s['step'] = 'texts'; break;
    case 'texts':
        $patch = ['titre' => $mod['titre'], 'description' => $mod['desc'], 'organisationClienteId' => $org];
        if ($mod['retour'] === 'none') $patch['resultatsVisiblesOperateurs'] = false;
        [$c, $j] = scanup_call($cab, '/api/modules/' . $mod['id'], $patch, 'PATCH', SU_AUTRICE);
        su_ok($c, $j, 'Adaptation du titre et de la description');
        $s['log'][] = "Titre : « {$mod['titre']} »." . ($mod['retour'] === 'none' ? ' Résultats masqués aux opérateurs.' : '');
        $s['step'] = 'image'; break;
    case 'image':
        $url = suimg_publish(suimg_render($mod['type'], $s['jobs'], trim(preg_replace('/\s*\(.*$/u', '', $s['client'])), $s['country']));
        [$c, $j] = scanup_call($cab, '/api/upload/module-media?type=image', null, 'POST', SU_AUTRICE, $url);
        $key = (string)(su_ok($c, $j, "Envoi de l'image")['key'] ?? ($j['data']['key'] ?? ''));
        if ($key === '') throw new RuntimeException("ScanUp n'a pas renvoyé l'emplacement de l'image.");
        [$c, $j] = scanup_call($cab, '/api/modules/' . $mod['id'], ['imageIllustrationUrl' => $key], 'PATCH', SU_AUTRICE);
        su_ok($c, $j, "Pose de l'image sur le module");
        $s['log'][] = 'Image du module fabriquée et posée.';
        $s['step'] = 'eval'; break;
    case 'eval':
        $mod['evaluator'] = (int)(setting('scanup_correctrice', 0) ?: SU_CORRECTRICE);
        if ($mod['evaluator']) {
            [$c, $j] = scanup_call($cab, '/api/modules/' . $mod['id'] . '/evaluators', ['evaluateurId' => $mod['evaluator']]);
            su_ok($c, $j, 'Désignation du correcteur');
            $s['log'][] = 'Évaluatrice désignée : Laura Gasqueres.';
        } else $s['log'][] = 'Attention : le modèle n\'a pas de correcteur ; à désigner dans ScanUp.';
        $s['step'] = 'publish'; break;
    case 'publish':
        [$c, $j] = scanup_call($cab, '/api/modules/' . $mod['id'] . '/publish', [], 'POST', SU_AUTRICE);
        su_ok($c, $j, 'Publication du module');
        $s['step'] = 'client'; break;
    case 'client':
        [$c, $j] = scanup_call($cab, '/api/modules/' . $mod['id'] . '/clients', ['clientOrgId' => $org]);
        su_ok($c, $j, 'Mise à disposition du client');
        if (($cond = su_conduite($mod['type'], $mod['retour'])) !== null) {
            [$c, $j] = scanup_call($cab, '/api/modules/' . $mod['id'] . "/clients/$org/conduite-positive", ['conduitePositive' => $cond], 'PUT');
            su_ok($c, $j, 'Réglage de la conduite à tenir');
            $s['log'][] = 'Conduite à tenir réglée (texte de départ, personnalisable dans ScanUp).';
        }
        [$c, $j] = scanup_call($cab, '/api/modules/' . $mod['id'] . '/sessions', ['dateDebut' => gmdate('c'), 'dateFinPrevue' => $s['end_date'] . 'T21:59:00.000Z']);
        $sid = (int)(su_ok($c, $j, 'Création de la session')['data']['id'] ?? ($j['id'] ?? 0));
        if (!$sid) throw new RuntimeException("ScanUp n'a pas renvoyé le numéro de la session.");
        $mod['session'] = $sid;
        scanup_call($cab, '/api/modules/' . $mod['id'] . "/sessions/$sid/clients", ['clientOrgId' => $org]); // facultatif : oriente le choix de session
        $s['log'][] = "Module n° {$mod['id']} publié, mis à disposition du client, session n° $sid jusqu'au " . date('d/m/Y', strtotime($s['end_date'])) . '.';
        if ($i + 1 < $nMods) { $s['i'] = $i + 1; $s['step'] = 'dup'; } else $s['step'] = 'credits';
        break;
    case 'credits':
        [$c, $j] = scanup_call($cab, "/api/organisations/$org/members?page=1&limit=100", null, 'GET');
        $ops = array_values(array_filter(su_ok($c, $j, 'Lecture des opérateurs du client')['data'] ?? [], fn($u) => (int)($u['idRole'] ?? 0) === 6));
        usort($ops, fn($a, $b) => (int)$a['id'] <=> (int)$b['id']);
        if (!$ops) throw new RuntimeException("Aucun opérateur dans l'organisation n° $org.");
        // Retour mixte : la première moitié des opérateurs a le résultat et la conduite à tenir, l'autre le retour personnalisé.
        $half = (int)ceil(count($ops) / 2); $queue = [];
        foreach ($s['mods'] as $k => $m) foreach ($ops as $n => $o) {
            if ($s['retour'] === 'both' && (($m['retour'] === 'rcat') !== ($n < $half))) continue;
            $queue[] = ['k' => $k, 'op' => (int)$o['id'], 'login' => explode('@', (string)($o['email'] ?? ''))[0]];
        }
        [$c, $j] = scanup_call($cab, '/api/credits/allocate', ['toOrganisationId' => $org, 'amount' => count($queue)]);
        su_ok($c, $j, 'Attribution des crédits');
        $s['queue'] = $queue;
        $s['log'][] = count($queue) . ' crédits attribués au client (' . count($ops) . ' opérateurs).';
        $s['step'] = 'assign'; break;
    case 'assign':
        for ($n = 0; $n < 3 && $s['queue']; $n++) {
            $a = $s['queue'][0]; $m = $s['mods'][$a['k']];
            [$c, $j] = scanup_call($cab, '/api/modules/' . $m['id'] . '/operators', ['operatorId' => $a['op'], 'organisationId' => $org, 'creditsToConsume' => 1, 'sessionId' => $m['session']]);
            su_ok($c, $j, 'Inscription de ' . ($a['login'] ?: 'l\'opérateur n° ' . $a['op']) . ' au module n° ' . $m['id']);
            $s['assigned'][] = ($a['login'] ?: $a['op']) . ' → n° ' . $m['id'];
            array_shift($s['queue']);
        }
        if (!$s['queue']) { $s['log'][] = count($s['assigned']) . ' inscriptions faites.'; $s['step'] = 'finish'; }
        break;
    case 'finish':
        su_modules_trace($me, $s);
        $s['log'][] = 'Terminé. Restent à envoyer : les vignettes des opérateurs au contact du client.';
        $s['step'] = 'done'; break;
    case 'done':
        break;
    default:
        throw new RuntimeException('Étape inconnue.');
    }
    unset($mod);
    $order = ['dup' => 0, 'texts' => 1, 'image' => 2, 'eval' => 3, 'publish' => 4, 'client' => 5];
    $done = $s['step'] === 'done' ? 100 : (isset($order[$s['step']]) ? (int)(($s['i'] * 6 + $order[$s['step']]) / max(1, $nMods * 6) * 80) : ($s['step'] === 'credits' ? 82 : ($s['step'] === 'assign' ? 85 + (int)(10 * count($s['assigned']) / max(1, count($s['assigned']) + count($s['queue']))) : 97)));
    $s['pct'] = $done;
    $s['log'] = array_slice($s['log'], -40);
    return $s;
}

/* Trace sur l'affaire, étape du parcours, et tâche suivante (vignettes). */
function su_modules_trace(array $me, array $s): void {
    $deal = q('SELECT id, person_id, org_id, extra FROM deals WHERE id = ?', [$s['deal_id']])->fetch();
    if (!$deal) return;
    $now = now_utc();
    $lines = array_map(fn($m) => "Module n° {$m['id']} : {$m['titre']} (session n° {$m['session']}, modèle n° {$m['model']})", $s['mods']);
    // Livrables à remettre à la fin de la session, par module
    $liv = [];
    foreach ($s['mods'] as $m) $liv[] = "Module n° {$m['id']} ({$m['type']}, " . su_retour_label($m['type'], $m['retour']) . ') : ' . implode(', ', su_livrables($m['type'], $m['retour'], !empty($s['nominatif'])));
    $lines[] = "Livrables prévus :\n- " . implode("\n- ", $liv);
    if ($s['retour'] !== 'none') $lines[] = "Conduite à tenir : textes de départ réglés sur chaque module, personnalisables dans ScanUp (menu du module, par le responsable de projet du client ou par l'équipe).";
    $note = implode("\n", $lines) . "\nInscriptions : " . implode(', ', $s['assigned']) . "\nPays : " . ($s['country'] === 'CH' ? 'Suisse' : 'France')
          . ($s['jobs'] !== '' ? "\nMétiers : {$s['jobs']}" : '') . "\nFin de session : " . date('d/m/Y', strtotime($s['end_date']));
    q('INSERT INTO activities (type, subject, due_date, done, done_time, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['note', mb_substr('ScanUp cabinet : modules du client test créés (' . count($s['mods']) . ')', 0, 500), substr($now, 0, 10), $now, (int)$me['id'], $deal['id'], $deal['person_id'], $deal['org_id'], $note, $now, $now]);
    $extra = $deal['extra'] ? (json_decode((string)$deal['extra'], true) ?: []) : [];
    $extra['su_modules'] = substr($now, 0, 10);
    $extra['su_livrables'] = implode(' ; ', $liv);
    q('UPDATE deals SET extra = ?, update_time = ? WHERE id = ?', [json_encode($extra, JSON_UNESCAPED_UNICODE), $now, $deal['id']]);
    // Illustrations dessinées : faites par Claude avec Canva, sur demande (« fais les illustrations du client … »).
    $ids = implode(', ', array_map(fn($m) => 'n° ' . $m['id'] . ' (' . $m['type'] . ')', $s['mods']));
    q('INSERT INTO activities (type, subject, due_date, done, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)',
      ['task', mb_substr('ScanUp : demander à Claude les illustrations Canva des modules (' . trim(preg_replace('/\s*\(.*$/u', '', $s['client'])) . ')', 0, 500), substr($now, 0, 10), (int)$me['id'],
       $deal['id'], $deal['person_id'], $deal['org_id'], "Modules : $ids.\nMétiers : " . ($s['jobs'] ?: 'non précisés') . "\nDemander à Claude : « fais les illustrations Canva des modules $ids ». L'image provisoire du CRM reste en place en attendant.", $now, $now]);
    // Rappel des livrables à la fin de la session
    q('INSERT INTO activities (type, subject, due_date, done, owner_id, deal_id, person_id, org_id, note, add_time, update_time) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)',
      ['task', mb_substr('ScanUp : préparer et envoyer les livrables (' . trim(preg_replace('/\s*\(.*$/u', '', $s['client'])) . ')', 0, 500), $s['end_date'], (int)$me['id'],
       $deal['id'], $deal['person_id'], $deal['org_id'], "Fin de session le " . date('d/m/Y', strtotime($s['end_date'])) . ".\n- " . implode("\n- ", $liv) . "\nTest : livrables envoyés par e-mail au contact, sans accès observateur.", $now, $now]);
    // La tâche « préparer les modules et envoyer les vignettes » devient « envoyer les vignettes ».
    q("UPDATE activities SET subject = REPLACE(subject, 'préparer les modules et envoyer les vignettes', 'envoyer les vignettes'),
       note = REPLACE(note, 'Mettre les modules à disposition avec une session et des crédits, inscrire les opérateurs, puis envoyer', 'Modules prêts et opérateurs inscrits : envoyer'), update_time = ? WHERE deal_id = ? AND done = 0 AND subject LIKE 'ScanUp : préparer les modules%'", [$now, $deal['id']]);
}
