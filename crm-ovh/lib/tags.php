<?php
// Tags (étiquettes) des affaires, organisations et personnes.
// Ils se saisissent dans le CRM ; un import ponctuel reprend les étiquettes de Pipedrive sans toucher au reste des fiches.
declare(strict_types=1);

const TAG_TABLES = ['deal' => 'deals', 'org' => 'orgs', 'person' => 'persons'];

function tags_schema(): void {
    static $done = false;
    if ($done) return;
    q("CREATE TABLE IF NOT EXISTS crm_tags (
      entity ENUM('deal','org','person') NOT NULL,
      entity_id INT UNSIGNED NOT NULL,
      tag VARCHAR(100) NOT NULL,
      PRIMARY KEY (entity, entity_id, tag), KEY k_tag (tag)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $done = true;
}

function tag_clean($t): string {
    return mb_substr(trim(preg_replace('/\s+/u', ' ', (string)$t)), 0, 100);
}

/* Tags d'une fiche. */
function tags_of(string $entity, int $id): array {
    tags_schema();
    return array_map(fn($r) => $r['tag'], q('SELECT tag FROM crm_tags WHERE entity = ? AND entity_id = ? ORDER BY tag', [$entity, $id])->fetchAll());
}

/* Remplace les tags d'une fiche. */
function tags_set(string $entity, int $id, array $tags): array {
    tags_schema();
    if (!array_key_exists($entity, TAG_TABLES)) throw new RuntimeException('Type de fiche inconnu.');
    $clean = [];
    foreach ($tags as $t) { $c = tag_clean($t); if ($c !== '') $clean[mb_strtolower($c)] = $c; }
    q('DELETE FROM crm_tags WHERE entity = ? AND entity_id = ?', [$entity, $id]);
    foreach ($clean as $c) q('INSERT IGNORE INTO crm_tags (entity, entity_id, tag) VALUES (?, ?, ?)', [$entity, $id, $c]);
    return tags_of($entity, $id);
}

/* Pour le tableau des affaires : tags de chaque affaire, et liste de tous les tags existants avec leur nombre de fiches. */
function tags_overview(): array {
    tags_schema();
    $deals = [];
    foreach (q("SELECT entity_id, tag FROM crm_tags WHERE entity = 'deal' ORDER BY tag")->fetchAll() as $r) $deals[(string)$r['entity_id']][] = $r['tag'];
    $all = [];
    foreach (q('SELECT tag, entity, COUNT(*) AS n FROM crm_tags GROUP BY tag, entity ORDER BY tag')->fetchAll() as $r) {
        if (!isset($all[$r['tag']])) $all[$r['tag']] = ['tag' => $r['tag'], 'deal' => 0, 'org' => 0, 'person' => 0];
        $all[$r['tag']][$r['entity']] = (int)$r['n'];
    }
    return ['deals' => (object)$deals, 'all' => array_values($all)];
}

/* Noms des étiquettes Pipedrive d'un type de fiche : identifiant vers libellé. */
function tags_pd_labels(string $ep): array {
    $out = [];
    $start = 0;
    do {
        $r = pd_request("/api/v1/$ep", ['start' => $start, 'limit' => 500]);
        foreach ($r['data'] ?? [] as $f) {
            if (!in_array((string)($f['key'] ?? ''), ['label', 'label_ids'], true)) continue;
            foreach ($f['options'] ?? [] as $o) if (isset($o['id'])) $out[(string)$o['id']] = (string)($o['label'] ?? '');
        }
        $pg = $r['additional_data']['pagination'] ?? [];
        $start = !empty($pg['more_items_in_collection']) ? (int)$pg['next_start'] : -1;
    } while ($start >= 0);
    return $out;
}

/* Une étape de l'import des tags. Ne modifie que la table des tags : ni les fiches, ni les étapes, ni les pipelines. */
function tags_import_step(array $state): array {
    tags_schema();
    $order = ['meta', 'org', 'person', 'deal', 'done'];
    if (empty($state['step'])) $state = ['step' => 'meta', 'cursor' => null, 'labels' => [], 'counts' => ['org' => 0, 'person' => 0, 'deal' => 0], 'fiches' => 0, 'log' => []];
    $step = (string)$state['step'];
    if (!in_array($step, $order, true)) throw new RuntimeException('Étape inconnue.');
    if ($step === 'meta') {
        $state['labels'] = ['org' => tags_pd_labels('organizationFields'), 'person' => tags_pd_labels('personFields'), 'deal' => tags_pd_labels('dealFields')];
        $n = fn($k) => count($state['labels'][$k]);
        $state['log'][] = 'Étiquettes Pipedrive : ' . $n('org') . ' pour les organisations, ' . $n('person') . ' pour les personnes, ' . $n('deal') . ' pour les affaires';
        $state['step'] = 'org';
    } elseif ($step !== 'done') {
        $ep = ['org' => 'organizations', 'person' => 'persons', 'deal' => 'deals'][$step];
        $params = ['limit' => 500];
        if (!empty($state['cursor'])) $params['cursor'] = (string)$state['cursor'];
        $r = pd_request("/api/v2/$ep", $params);
        $names = (array)($state['labels'][$step] ?? []);
        foreach ($r['data'] ?? [] as $item) {
            $state['fiches']++;
            $ids = $item['label_ids'] ?? [];
            if (!is_array($ids) || !$ids) continue;
            $local = pd_local(TAG_TABLES[$step], $item['id'] ?? null);
            if (!$local) continue;
            foreach ($ids as $lid) {
                $name = tag_clean($names[(string)$lid] ?? '');
                if ($name === '') continue;
                $st = q('INSERT IGNORE INTO crm_tags (entity, entity_id, tag) VALUES (?, ?, ?)', [$step, $local, $name]);
                $state['counts'][$step] += $st->rowCount();
            }
        }
        $label = ['org' => 'Organisations', 'person' => 'Personnes', 'deal' => 'Affaires'][$step];
        $state['log'][] = $label . ' : ' . $state['counts'][$step] . ' tags repris (' . $state['fiches'] . ' fiches lues au total)';
        $next = $r['additional_data']['next_cursor'] ?? null;
        if ($next) $state['cursor'] = $next;
        else { $state['cursor'] = null; $state['step'] = $order[array_search($step, $order, true) + 1]; }
    }
    if ($state['step'] === 'done' && empty($state['finished'])) {
        $state['finished'] = now_utc();
        $state['log'][] = 'Import des tags terminé.';
    }
    $state['log'] = array_slice($state['log'], -40);
    $state['pct'] = (int)round(array_search($state['step'], $order, true) / (count($order) - 1) * 100);
    return $state;
}
