<?php
// Sauvegarde de la base du CRM : une copie complète (structure et données) dans un fichier compressé, rangé dans un
// dossier voisin du site, hors de portée du web. Faite une fois par jour par la tâche planifiée, les quatorze dernières
// sont gardées. Le fichier contient toute la base, y compris les clés des connexions (Microsoft, Mailchimp, Calendly) :
// il ne doit être confié qu'à un administrateur.
declare(strict_types=1);

const BACKUP_KEEP = 14;

function backup_dir(): string {
    $d = dirname(CRM_ROOT) . '/sauvegardes-crm';
    if (!is_dir($d)) { @mkdir($d, 0700, true); }
    if (!is_dir($d) || !is_writable($d)) throw new RuntimeException('Dossier de sauvegarde inaccessible : ' . $d);
    // Par précaution, si ce dossier venait un jour à être servi par le web, on en interdit l'accès.
    if (!is_file($d . '/.htaccess')) @file_put_contents($d . '/.htaccess', "Require all denied\nDeny from all\n");
    return $d;
}

function backup_list(): array {
    $out = [];
    foreach (glob(backup_dir() . '/crm-*.sql.gz') ?: [] as $f) $out[] = ['name' => basename($f), 'size' => (int)filesize($f), 'at' => gmdate('Y-m-d\TH:i:s\Z', (int)filemtime($f))];
    usort($out, fn($a, $b) => strcmp($b['name'], $a['name']));
    return $out;
}

/* Vrai si la dernière sauvegarde a plus de vingt heures (ou s'il n'y en a aucune). */
function backup_due(): bool {
    $l = backup_list();
    return !$l || (time() - strtotime($l[0]['at'])) > 20 * 3600;
}

function backup_run(): array {
    @set_time_limit(300);
    $dir = backup_dir();
    $name = 'crm-' . gmdate('Y-m-d-His') . '.sql.gz';
    $tmp = $dir . '/' . $name . '.tmp';
    $gz = gzopen($tmp, 'wb6');
    if (!$gz) throw new RuntimeException("Impossible d'écrire la sauvegarde.");
    $pdo = db();
    gzwrite($gz, "-- Sauvegarde du CRM, " . now_utc() . " UTC\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n");
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    $rowsTotal = 0;
    foreach ($tables as $t) {
        $t = (string)$t;
        if (!preg_match('/^[A-Za-z0-9_]+$/', $t)) continue;
        $create = $pdo->query("SHOW CREATE TABLE `$t`")->fetch(PDO::FETCH_NUM);
        gzwrite($gz, "DROP TABLE IF EXISTS `$t`;\n" . $create[1] . ";\n\n");
        $st = $pdo->query("SELECT * FROM `$t`");
        $batch = [];
        while ($row = $st->fetch(PDO::FETCH_NUM)) {
            $batch[] = '(' . implode(',', array_map(fn($v) => $v === null ? 'NULL' : $pdo->quote((string)$v), $row)) . ')';
            $rowsTotal++;
            if (count($batch) >= 200) { gzwrite($gz, "INSERT INTO `$t` VALUES\n" . implode(",\n", $batch) . ";\n"); $batch = []; }
        }
        if ($batch) gzwrite($gz, "INSERT INTO `$t` VALUES\n" . implode(",\n", $batch) . ";\n");
        gzwrite($gz, "\n");
    }
    gzwrite($gz, "SET FOREIGN_KEY_CHECKS = 1;\n");
    gzclose($gz);
    if (!@rename($tmp, $dir . '/' . $name)) { @unlink($tmp); throw new RuntimeException("Impossible d'enregistrer la sauvegarde."); }
    @chmod($dir . '/' . $name, 0600);
    // On ne garde que les plus récentes.
    $all = backup_list();
    foreach (array_slice($all, BACKUP_KEEP) as $old) @unlink($dir . '/' . $old['name']);
    return ['name' => $name, 'size' => (int)filesize($dir . '/' . $name), 'tables' => count($tables), 'lignes' => $rowsTotal, 'gardees' => min(count($all), BACKUP_KEEP)];
}
