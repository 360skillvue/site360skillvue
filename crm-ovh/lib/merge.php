<?php
// Fusion de deux fiches (personnes ou organisations) : tout ce qui pointe vers le doublon passe sur la fiche gardée,
// les coordonnées, notes, champs et étiquettes sont réunis, puis le doublon est supprimé. Action faite à la main
// dans l'interface du CRM ; le connecteur Claude n'y a pas accès.
declare(strict_types=1);

function merge_list(?string $a, ?string $b): ?string {
    $out = []; $seen = [];
    foreach ([$a, $b] as $raw) foreach ((array)json_decode((string)$raw, true) as $x) {
        $v = trim((string)(is_array($x) ? ($x['value'] ?? '') : $x)); $k = mb_strtolower(preg_replace('/\s+/', '', $v));
        if ($v === '' || isset($seen[$k])) continue; $seen[$k] = true;
        $out[] = ['value' => $v, 'label' => is_array($x) ? ($x['label'] ?? null) : null, 'primary' => !$out];
    }
    return $out ? json_encode($out, JSON_UNESCAPED_UNICODE) : null;
}

function merge_records(string $kind, int $fromId, int $intoId): array {
    $tbl = ['person' => 'persons', 'org' => 'orgs'][$kind] ?? null;
    if (!$tbl) throw new RuntimeException('Type de fiche inconnu.');
    if ($fromId === $intoId || $fromId <= 0 || $intoId <= 0) throw new RuntimeException('Choisissez une autre fiche que celle-ci.');
    $from = q("SELECT * FROM `$tbl` WHERE id = ?", [$fromId])->fetch();
    $into = q("SELECT * FROM `$tbl` WHERE id = ?", [$intoId])->fetch();
    if (!$from || !$into) throw new RuntimeException('Fiche introuvable.');
    $col = $kind === 'person' ? 'person_id' : 'org_id';
    $now = now_utc(); $moved = [];
    db()->beginTransaction();
    try {
        foreach (['deals' => 'affaires', 'activities' => 'activités'] as $t => $label) {
            $moved[$label] = q("UPDATE `$t` SET `$col` = ? WHERE `$col` = ?", [$intoId, $fromId])->rowCount();
        }
        if ((bool)q("SHOW TABLES LIKE 'crm_emails'")->fetch()) $moved['e-mails'] = q("UPDATE crm_emails SET `$col` = ? WHERE `$col` = ?", [$intoId, $fromId])->rowCount();
        if ($kind === 'org') $moved['personnes'] = q('UPDATE persons SET org_id = ? WHERE org_id = ?', [$intoId, $fromId])->rowCount();
        if ($kind === 'person' && (bool)q("SHOW TABLES LIKE 'crm_deal_persons'")->fetch()) {
            q('INSERT IGNORE INTO crm_deal_persons (deal_id, person_id, add_time' . (q("SHOW COLUMNS FROM crm_deal_persons LIKE 'role'")->fetch() ? ', role) SELECT deal_id, ?, add_time, role' : ') SELECT deal_id, ?, add_time')
              . ' FROM crm_deal_persons WHERE person_id = ?', [$intoId, $fromId]);
            q('DELETE FROM crm_deal_persons WHERE person_id = ?', [$fromId]);
        }
        if ((bool)q("SHOW TABLES LIKE 'crm_tags'")->fetch()) {
            q('INSERT IGNORE INTO crm_tags (entity, entity_id, tag) SELECT entity, ?, tag FROM crm_tags WHERE entity = ? AND entity_id = ?', [$intoId, $kind, $fromId]);
            q('DELETE FROM crm_tags WHERE entity = ? AND entity_id = ?', [$kind, $fromId]);
        }
        // Champs de la fiche gardée : on complète ce qui manque, sans rien écraser.
        $set = [];
        $exI = $into['extra'] ? (json_decode((string)$into['extra'], true) ?: []) : [];
        $exF = $from['extra'] ? (json_decode((string)$from['extra'], true) ?: []) : [];
        foreach ($exF as $k => $v) if (($exI[$k] ?? '') === '' && $v !== '' && $v !== null) $exI[$k] = $v;
        $set['extra'] = $exI ? json_encode($exI, JSON_UNESCAPED_UNICODE) : null;
        if (trim((string)$from['notes']) !== '' && trim((string)$from['notes']) !== trim((string)$into['notes']))
            $set['notes'] = trim(trim((string)$into['notes']) . "\n\n[Fusion le " . gmdate('d/m/Y') . ' avec « ' . $from['name'] . ' »]' . "\n" . trim((string)$from['notes']));
        if ($kind === 'person') {
            $set['emails'] = merge_list($into['emails'], $from['emails']);
            $set['phones'] = merge_list($into['phones'], $from['phones']);
            if (empty($into['org_id']) && !empty($from['org_id'])) $set['org_id'] = (int)$from['org_id'];
        } else {
            foreach (['address', 'website'] as $k) if (trim((string)$into[$k]) === '' && trim((string)$from[$k]) !== '') $set[$k] = $from[$k];
        }
        if (empty($into['owner_id']) && !empty($from['owner_id'])) $set['owner_id'] = (int)$from['owner_id'];
        $set['update_time'] = $now;
        q("UPDATE `$tbl` SET " . implode(',', array_map(fn($k) => "`$k` = ?", array_keys($set))) . ' WHERE id = ?', [...array_values($set), $intoId]);
        q("DELETE FROM `$tbl` WHERE id = ?", [$fromId]);
        db()->commit();
    } catch (Throwable $e) { db()->rollBack(); throw $e; }
    return ['ok' => true, 'garde' => $intoId, 'supprime' => $fromId, 'deplaces' => $moved];
}
