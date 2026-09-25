<?php
// api/estudiante.php

// --- Captura TODO (incluidas las excepciones que mysqli lanza por defecto desde PHP 8.1) ---
// y devuelve siempre JSON, nunca una respuesta vacía con 500.
error_reporting(E_ALL);
ini_set('display_errors', '0');   // no mezclar HTML de error con el JSON
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Revertimos al modo clásico: que mysqli devuelva false/errores en vez de lanzar excepciones.
// (PHP 8.1+ activa MYSQLI_REPORT_ERROR|STRICT por defecto, lo que puede terminar en un
//  fatal error sin salida si no se captura explícitamente)
mysqli_report(MYSQLI_REPORT_OFF);

// Red de seguridad: cualquier error/excepción que se escape termina acá como JSON,
// nunca como una página HTML o una respuesta vacía.
set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode(['error' => 'Excepción no controlada: ' . $e->getMessage()]);
    exit;
});
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return false;
    throw new ErrorException($message, 0, $severity, $file, $line);
});
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode(['error' => 'Error fatal: ' . $err['message'] . ' en ' . $err['file'] . ':' . $err['line']]);
    }
});

$conn = new mysqli('localhost', 'rootX', 'rootX', 'proadb');

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión: ' . $conn->connect_error]);
    exit;
}
$conn->set_charset('utf8mb4');

$accion = $_GET['accion'] ?? '';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$accion) $accion = $body['accion'] ?? '';

switch ($accion) {

    case 'listar':
        $r = $conn->query("SELECT * FROM estudiantes ORDER BY Apellido, Nombre LIMIT 500");
        if ($r === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al listar: ' . $conn->error]);
            break;
        }
        echo json_encode($r->fetch_all(MYSQLI_ASSOC));
        break;

    case 'buscar':
        $q = '%' . ($_GET['q'] ?? '') . '%';
        $stmt = $conn->prepare("SELECT * FROM estudiantes
                           WHERE Nombre              LIKE ?
                              OR Apellido            LIKE ?
                              OR Dni                 LIKE ?
                              OR Correo_Institucional LIKE ?
                           ORDER BY Apellido, Nombre
                           LIMIT 200");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al preparar consulta: ' . $conn->error]);
            break;
        }
        $stmt->bind_param('ssss', $q, $q, $q, $q);
        $stmt->execute();
        echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        $stmt->close();
        break;

    case 'agregar':
        $nombre   = $body['Nombre']               ?? '';
        $apellido = $body['Apellido']              ?? '';
        $correo   = $body['Correo_Institucional']  ?? '';
        $dni      = $body['Dni']                   ?? '';
        $fecha    = $body['FechaDeNacimiento']     ?? null;
        $idcurso  = (int)($body['IdCurso'] ?? 0);

        if ($fecha === '') $fecha = null; // evita '' inválido en columna DATE

        $stmt = $conn->prepare("INSERT INTO estudiantes
                        (Nombre, Apellido, Correo_Institucional, Dni, FechaDeNacimiento, IdCurso)
                      VALUES (?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al preparar consulta: ' . $conn->error]);
            break;
        }
        $stmt->bind_param('sssssi', $nombre, $apellido, $correo, $dni, $fecha, $idcurso);

        if ($stmt->execute()) {
            echo json_encode(['mensaje' => '✅ Estudiante agregado correctamente', 'id' => $stmt->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => '❌ No se pudo agregar: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'editar':
        $id       = (int)($body['id']                    ?? 0);
        $nombre   = $body['Nombre']               ?? '';
        $apellido = $body['Apellido']              ?? '';
        $correo   = $body['Correo_Institucional']  ?? '';
        $dni      = $body['Dni']                   ?? '';
        $fecha    = $body['FechaDeNacimiento']     ?? null;
        $idcurso  = (int)($body['IdCurso'] ?? 0);

        if ($fecha === '') $fecha = null;

        $stmt = $conn->prepare("UPDATE estudiantes SET
                        Nombre               = ?,
                        Apellido             = ?,
                        Correo_Institucional = ?,
                        Dni                  = ?,
                        FechaDeNacimiento    = ?,
                        IdCurso              = ?
                      WHERE IdEstudiante = ?");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al preparar consulta: ' . $conn->error]);
            break;
        }
        $stmt->bind_param('sssssii', $nombre, $apellido, $correo, $dni, $fecha, $idcurso, $id);

        if ($stmt->execute()) {
            echo json_encode(['mensaje' => '✅ Estudiante actualizado correctamente']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => '❌ No se pudo actualizar: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'eliminar':
        $id = (int)($body['id'] ?? 0);
        // FIX: la tabla se llama "estudiantes", no "estudiantess"
        $stmt = $conn->prepare("DELETE FROM estudiantes WHERE IdEstudiante = ?");
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al preparar consulta: ' . $conn->error]);
            break;
        }
        $stmt->bind_param('i', $id);
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['mensaje' => '✅ Estudiante eliminado correctamente']);
        } else {
            echo json_encode(['error' => '❌ No se encontró el estudiante o ya fue eliminado']);
        }
        $stmt->close();
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Acción no reconocida: ' . $accion]);
}

$conn->close();
