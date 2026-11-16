<?php
// Image d'illustration d'un module ScanUp, fabriquée par le CRM : format des cartes ScanUp (paysage 2:1, 1200 x 600),
// fond dégradé à la couleur du type (violet TMS, vert RPS, comme les bandeaux de l'application), pictogramme et métier.
// Le bas de l'image reste sobre : l'application y superpose un dégradé sombre et le titre du module.
declare(strict_types=1);

const SUIMG_W = 1200;
const SUIMG_H = 600;

function suimg_font(bool $bold): string { return CRM_ROOT . '/assets/fonts/' . ($bold ? 'DejaVuSans-Bold.ttf' : 'DejaVuSans.ttf'); }

/* Découpe un texte en lignes qui tiennent dans $maxW pixels. */
function suimg_wrap(string $text, float $size, string $font, int $maxW, int $maxLines): array {
    $words = preg_split('/\s+/u', trim($text)); $lines = []; $cur = '';
    foreach ($words as $w) {
        $try = $cur === '' ? $w : "$cur $w";
        $box = imagettfbbox($size, 0, $font, $try);
        if ($box[2] - $box[0] > $maxW && $cur !== '') { $lines[] = $cur; $cur = $w; } else $cur = $try;
    }
    if ($cur !== '') $lines[] = $cur;
    if (count($lines) > $maxLines) { $lines = array_slice($lines, 0, $maxLines); $lines[$maxLines - 1] = rtrim(mb_substr($lines[$maxLines - 1], 0, max(1, mb_strlen($lines[$maxLines - 1]) - 2))) . '…'; }
    return $lines;
}

function suimg_rgb(string $hex): array { $h = ltrim($hex, '#'); return [hexdec(substr($h, 0, 2)), hexdec(substr($h, 2, 2)), hexdec(substr($h, 4, 2))]; }

/* Fabrique l'image. $type : TMS ou RPS ; $job : métiers (texte libre) ; $client : nom court du client ; $country : FR ou CH.
   Renvoie le contenu JPEG. */
function suimg_render(string $type, string $job, string $client, string $country = 'FR'): string {
    if (!function_exists('imagecreatetruecolor')) throw new RuntimeException("L'extension GD de PHP n'est pas active sur l'hébergement : l'image ne peut pas être fabriquée.");
    $W = SUIMG_W; $H = SUIMG_H;
    $im = imagecreatetruecolor($W, $H);
    imageantialias($im, false); // l'anticrénelage de GD ignore l'épaisseur des traits
    // Couleurs de l'application : violet-600 pour TMS, green-600 pour RPS.
    [$c1, $c2] = $type === 'RPS' ? ['#16a34a', '#0b3d22'] : ['#7c3aed', '#2b1162'];
    [$r1, $g1, $b1] = suimg_rgb($c1); [$r2, $g2, $b2] = suimg_rgb($c2);
    // Dégradé diagonal
    for ($y = 0; $y < $H; $y++) {
        for ($x = 0; $x < $W; $x += 4) {
            $t = min(1, max(0, ($x / $W) * 0.55 + ($y / $H) * 0.45));
            $col = imagecolorallocate($im, (int)($r1 + ($r2 - $r1) * $t), (int)($g1 + ($g2 - $g1) * $t), (int)($b1 + ($b2 - $b1) * $t));
            imagefilledrectangle($im, $x, $y, $x + 3, $y, $col);
        }
    }
    // Cercles décoratifs translucides
    $soft = imagecolorallocatealpha($im, 255, 255, 255, 116);
    $softer = imagecolorallocatealpha($im, 255, 255, 255, 121);
    imagefilledellipse($im, 980, 250, 620, 620, $softer);
    imagefilledellipse($im, 980, 250, 430, 430, $soft);
    imagefilledellipse($im, 120, 560, 360, 360, $softer);

    $white = imagecolorallocate($im, 255, 255, 255);
    $whiteA = imagecolorallocatealpha($im, 255, 255, 255, 30);
    imagesetthickness($im, 14);
    // Pictogramme, centré sur (980, 250)
    $cx = 980; $cy = 250;
    if ($type === 'RPS') {
        // Tête de profil et bulle de parole : écoute et ressenti
        imagefilledellipse($im, $cx - 30, $cy - 20, 210, 230, $white);
        imagefilledpolygon($im, [$cx - 120, $cy + 40, $cx - 40, $cy + 150, $cx + 40, $cy + 150, $cx + 30, $cy + 60], $white);
        imagefilledpolygon($im, [$cx + 70, $cy - 20, $cx + 105, $cy + 20, $cx + 70, $cy + 30], $white);
        $col = imagecolorallocate($im, $r1, $g1, $b1);
        imagesetthickness($im, 10);
        imagearc($im, $cx - 40, $cy - 30, 90, 90, 200, 340, $col);
        imagearc($im, $cx - 40, $cy - 30, 40, 40, 200, 340, $col);
        // Bulle
        imagefilledellipse($im, $cx + 150, $cy - 120, 150, 110, $whiteA);
        imagefilledpolygon($im, [$cx + 95, $cy - 90, $cx + 80, $cy - 50, $cx + 125, $cy - 80], $whiteA);
        $dot = imagecolorallocate($im, $r1, $g1, $b1);
        foreach ([-35, 0, 35] as $dx) imagefilledellipse($im, $cx + 150 + $dx, $cy - 120, 18, 18, $dot);
    } else {
        // Silhouette qui porte une charge : gestes et postures
        imagefilledellipse($im, $cx - 40, $cy - 150, 70, 70, $white);                       // tête
        imagesetthickness($im, 26);
        imageline($im, $cx - 40, $cy - 110, $cx - 10, $cy + 20, $white);                     // dos penché
        imageline($im, $cx - 10, $cy + 20, $cx - 50, $cy + 150, $white);                     // jambe arrière
        imageline($im, $cx - 10, $cy + 20, $cx + 40, $cy + 90, $white);                      // cuisse avant
        imageline($im, $cx + 40, $cy + 90, $cx + 30, $cy + 150, $white);                     // tibia
        imageline($im, $cx - 30, $cy - 80, $cx + 50, $cy - 20, $white);                      // bras
        imagefilledrectangle($im, $cx + 40, $cy - 60, $cx + 150, $cy + 40, $whiteA);         // charge
        imagesetthickness($im, 8);
        imagerectangle($im, $cx + 40, $cy - 60, $cx + 150, $cy + 40, $white);
        // Repères articulaires
        $dot = imagecolorallocate($im, $r1, $g1, $b1);
        foreach ([[$cx - 10, $cy + 20], [$cx + 40, $cy + 90], [$cx - 30, $cy - 80]] as [$x, $y]) imagefilledellipse($im, $x, $y, 22, 22, $dot);
    }

    // Textes, en haut à gauche (le bas est recouvert par le titre dans l'application)
    $bold = suimg_font(true); $reg = suimg_font(false);
    $label = $type === 'RPS' ? 'RISQUES PSYCHOSOCIAUX' : 'TROUBLES MUSCULO-SQUELETTIQUES';
    $chip = imagecolorallocatealpha($im, 255, 255, 255, 95);
    $bb = imagettfbbox(17, 0, $bold, $label);
    imagefilledrectangle($im, 60, 60, 60 + ($bb[2] - $bb[0]) + 36, 104, $chip);
    imagettftext($im, 17, 0, 78, 91, $white, $bold, $label);
    $y = 175;
    foreach (suimg_wrap($job !== '' ? $job : ($type === 'RPS' ? 'Conditions de travail et bien-être' : 'Gestes et postures au poste'), 40, $bold, 600, 3) as $line) {
        imagettftext($im, 40, 0, 60, $y, $white, $bold, $line); $y += 58;
    }
    if ($client !== '') { imagettftext($im, 22, 0, 62, $y + 8, $whiteA, $reg, mb_substr($client, 0, 40) . ($country === 'CH' ? ' · Suisse' : '')); }
    // Signature discrète
    imagettftext($im, 15, 0, $W - 220, $H - 28, imagecolorallocatealpha($im, 255, 255, 255, 70), $bold, '360SkillVue');

    ob_start(); imagejpeg($im, null, 88); $jpg = (string)ob_get_clean();
    imagedestroy($im);
    return $jpg;
}

/* Enregistre l'image dans media/su/ (adresse publique au nom imprévisible, pour que Make puisse la télécharger) et renvoie son adresse. */
function suimg_publish(string $jpg): string {
    $dir = CRM_ROOT . '/media/su';
    if (!is_dir($dir) && !@mkdir($dir, 0755, true)) throw new RuntimeException("Impossible de créer le dossier des images (media/su).");
    // Ménage : les images de plus de 30 jours ne servent plus (elles sont copiées dans ScanUp).
    foreach (glob($dir . '/*.jpg') ?: [] as $f) if (filemtime($f) < time() - 30 * 86400) @unlink($f);
    $name = bin2hex(random_bytes(12)) . '.jpg';
    if (file_put_contents("$dir/$name", $jpg) === false) throw new RuntimeException("Impossible d'enregistrer l'image du module.");
    return crm_base_url() . '/media/su/' . $name;
}
