<?php
/* api/guardar_imagen.php
   Guarda los metadatos de una imagen subida a Cloudinary.
   Espera POST JSON: { nombre, categoria, descripcion, secure_url, public_id, tipo, peso }
   Requiere sesión activa ($_SESSION['id']).
*/
include 'conexion.php';
session_start();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'mensaje' => 'Método no permitido.']);
    exit;
}

$usuarioId = (int)($_SESSION['id'] ?? 0);
if ($usuarioId === 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'mensaje' => 'Sesión no iniciada.']);
    exit;
}

$entrada = json_decode(file_get_contents('php://input'), true) ?? [];

$nombre      = trim((string)($entrada['nombre'] ?? ''));
$categoria   = trim((string)($entrada['categoria'] ?? ''));
$descripcion = trim((string)($entrada['descripcion'] ?? ''));
$secure_url  = trim((string)($entrada['secure_url'] ?? ''));
$public_id   = trim((string)($entrada['public_id'] ?? ''));
$tipo        = trim((string)($entrada['tipo'] ?? ''));
$peso        = (int)($entrada['peso'] ?? 0);

if ($nombre === '' || $secure_url === '' || $public_id === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'mensaje' => 'Faltan datos obligatorios.']);
    exit;
}

$stmt = $conn->prepare(
    'INSERT INTO imagenes (usuario_id, nombre, categoria, descripcion, tipo, secure_url, public_id, peso, fecha_subida)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'mensaje' => 'Error al preparar: ' . $conn->error]);
    exit;
}
$stmt->bind_param('isssssis', $usuarioId, $nombre, $categoria, $descripcion, $tipo, $secure_url, $public_id, $peso);

if ($stmt->execute()) {
    $id = $stmt->insert_id;
    $stmt->close();
    $conn->close();
    echo json_encode(['success' => true, 'mensaje' => 'Imagen registrada.', 'id' => $id]);
    exit;
}

$error = $stmt->error;
$stmt->close();
$conn->close();
http_response_code(500);
echo json_encode(['success' => false, 'mensaje' => 'No se pudo registrar: ' . $error]);
