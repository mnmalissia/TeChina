<?php
/* Conexión única a la base de datos (MySQLi) + cabeceras JSON comunes. */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

mysqli_report(MYSQLI_REPORT_OFF);

$conn = new mysqli('localhost', 'rootX', 'rootX', 'proadb');

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'mensaje' => 'Error de conexión: ' . $conn->connect_error]);
    exit;
}

$conn->set_charset('utf8mb4');

/** Responde en JSON y termina la ejecución. */
function responder(array $datos, int $codigo = 200): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Lee el cuerpo de la petición como array (JSON) o, si no es JSON, desde $_POST. */
function leerEntrada(): array
{
    $crudo = file_get_contents('php://input');
    $json  = json_decode($crudo, true);
    if (is_array($json)) return $json;
    return $_POST;
}
