<?php
// Serveur MCP du CRM (transport « Streamable HTTP », réponses JSON). Adresse à donner à Claude : https://crm.360skillvue.com/mcp.php
// Accès uniquement avec un jeton obtenu par la connexion OAuth (oauth.php) d'un compte du CRM.
declare(strict_types=1);
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/oauth.php';
require __DIR__ . '/lib/mcp_tools.php';

const MCP_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version');
header('Access-Control-Expose-Headers: WWW-Authenticate, Mcp-Session-Id');

function mcp_reply($payload, int $code = 200): void {
    http_response_code($code);
    if ($payload === null) exit;
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function mcp_err($id, int $code, string $msg): array { return ['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => $code, 'message' => $msg]]; }

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { header('Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS'); mcp_reply(null, 204); }

try {
    $user = oauth_bearer_user();
    if (!$user) {
        header('WWW-Authenticate: Bearer resource_metadata="' . crm_base_url() . '/.well-known/oauth-protected-resource"');
        mcp_reply(['error' => 'unauthorized', 'error_description' => 'Connexion au CRM requise.'], 401);
    }
    if ($method === 'GET') { header('Allow: POST, DELETE'); mcp_reply(null, 405); } // pas de flux d'événements côté serveur
    if ($method === 'DELETE') mcp_reply(null, 200);
    if ($method !== 'POST') mcp_reply(null, 405);

    $raw = (string)file_get_contents('php://input');
    $msg = json_decode($raw, true);
    if (!is_array($msg)) mcp_reply(mcp_err(null, -32700, 'JSON illisible.'), 400);
    $batch = array_is_list($msg);
    $out = [];
    foreach ($batch ? $msg : [$msg] as $m) {
        $r = mcp_handle(is_array($m) ? $m : [], $user);
        if ($r !== null) $out[] = $r;
    }
    if (!$out) mcp_reply(null, 202); // uniquement des notifications
    mcp_reply($batch ? $out : $out[0]);
} catch (Throwable $e) {
    error_log('[crm] mcp ' . $e->getMessage());
    mcp_reply(mcp_err(null, -32603, 'Erreur interne du CRM.'), 500);
}

function mcp_handle(array $m, array $user): ?array {
    $id = $m['id'] ?? null; $method = (string)($m['method'] ?? ''); $params = (array)($m['params'] ?? []);
    $isNotif = !array_key_exists('id', $m);
    if (($m['jsonrpc'] ?? '') !== '2.0' || $method === '') return $isNotif ? null : mcp_err($id, -32600, 'Requête invalide.');
    if ($isNotif) return null; // notifications/initialized, notifications/cancelled… : rien à répondre
    switch ($method) {
        case 'initialize':
            $want = (string)($params['protocolVersion'] ?? '');
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => [
                'protocolVersion' => in_array($want, MCP_PROTOCOLS, true) ? $want : MCP_PROTOCOLS[0],
                'capabilities' => ['tools' => ['listChanged' => false]],
                'serverInfo' => ['name' => 'crm-360skillvue', 'title' => 'CRM 360skillvue', 'version' => defined('CRM_VERSION') ? CRM_VERSION : '1'],
                'instructions' => "CRM interne de 360skillvue (prévention TMS et RPS, ScanUp). Connecté en tant que {$user['name']}. "
                    . "Les affaires avancent par étapes dans des pipelines ; une affaire en cours doit toujours avoir une activité prévue. "
                    . "Cherchez les fiches avec search_contacts ou list_deals avant de créer, pour éviter les doublons. "
                    . "Dates au format AAAA-MM-JJ, heures à l'heure de Paris. Aucun outil ne supprime de données."]];
        case 'ping':
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => new stdClass];
        case 'tools/list':
            return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['tools' => mcp_tool_defs()]];
        case 'tools/call':
            $name = (string)($params['name'] ?? ''); $args = (array)($params['arguments'] ?? []);
            if (!in_array($name, array_column(mcp_tool_defs(), 'name'), true)) return mcp_err($id, -32602, "Outil inconnu : $name");
            try {
                $res = mcp_call_tool($name, $args, $user);
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['content' => [['type' => 'text', 'text' => json_encode($res, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)]], 'isError' => false]];
            } catch (McpToolError $e) {
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['content' => [['type' => 'text', 'text' => $e->getMessage()]], 'isError' => true]];
            } catch (Throwable $e) {
                error_log('[crm] mcp outil ' . $name . ' : ' . $e->getMessage());
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['content' => [['type' => 'text', 'text' => 'Erreur du CRM pendant l\'opération ; réessayez.']], 'isError' => true]];
            }
        case 'resources/list': return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['resources' => []]];
        case 'prompts/list': return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['prompts' => []]];
    }
    return mcp_err($id, -32601, "Méthode non prise en charge : $method");
}
