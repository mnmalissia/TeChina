<?php
/* api/eliminar_imagen.php
   Elimina el registro de una imagen de MySQL.
   El archivo en Cloudinary NO se borra desde acá (requiere api_secret firmado).
   Espera POST JSON: { id, public_id }
   Solo el Director puede eliminar cualquier imagen; los demás solo la suya.
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
$rol       = $_SESSION['rol'] ?? '';

if (strtolower($rol) === 'estudiante' || strtolower($rol) === 'alumno') {
    http_response_code(403);
    echo json_encode(['success' => false, 'mensaje' => 'Los estudiantes solo pueden descargar imágenes, no eliminarlas.']);
    exit;
}

$entrada = json_decode(file_get_contents('php://input'), true) ?? [];
$id      = (int)($entrada['id'] ?? 0);

if ($id === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'mensaje' => 'ID inválido.']);
    exit;
}

$where = ($rol === 'Director') ? 'WHERE id = ?' : 'WHERE id = ? AND usuario_id = ?';

$stmt = $conn->prepare("SELECT public_id FROM imagenes $where");
if ($rol === 'Director') {
    $stmt->bind_param('i', $id);
} else {
    $stmt->bind_param('ii', $id, $usuarioId);
}
$stmt->execute();
$fila = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$fila) {
    http_response_code(404);
    echo json_encode(['success' => false, 'mensaje' => 'Imagen no encontrada o sin permiso.']);
    exit;
}

$stmt = $conn->prepare("DELETE FROM imagenes WHERE id = ?");
$stmt->bind_param('i', $id);
$ok = $stmt->execute();
$stmt->close();
$conn->close();

if ($ok) {
    echo json_encode(['success' => true, 'mensaje' => 'Registro eliminado.', 'public_id' => $fila['public_id']]);
    exit;
}

http_response_code(500);
echo json_encode(['success' => false, 'mensaje' => 'No se pudo eliminar.']);
