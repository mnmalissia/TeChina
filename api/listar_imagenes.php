<?php
/* api/listar_imagenes.php
   Devuelve las imágenes registradas en MySQL para la sesión activa.
   GET sin parámetros.
*/
include 'conexion.php';
session_start();

header('Content-Type: application/json; charset=utf-8');

$usuarioId = (int)($_SESSION['id'] ?? 0);
$where = $usuarioId ? 'WHERE usuario_id = ' . $usuarioId : '';

$sql = "SELECT id, usuario_id, nombre, secure_url, public_id, fecha_subida
        FROM imagenes $where
        ORDER BY fecha_subida DESC";

$res = $conn->query($sql);
if ($res === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'mensaje' => 'Error al listar: ' . $conn->error]);
    exit;
}

$imagenes = $res->fetch_all(MYSQLI_ASSOC);
$conn->close();
echo json_encode(['success' => true, 'imagenes' => $imagenes]);
