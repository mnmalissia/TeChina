<?php
/* ============================================================
   api/crud.php
   Backend GENÉRICO: sirve para cualquiera de las tablas de la
   whitelist de abajo, sin tener un archivo PHP por tabla.
   Funciona leyendo en vivo la estructura real de cada tabla
   (columnas, tipos, clave primaria y foreign keys) y armando
   las consultas SQL en base a eso.
   ============================================================ */

error_reporting(E_ALL);
ini_set('display_errors', '0');   // los errores van como JSON, no mezclados con HTML
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Modo clásico de mysqli (devuelve false en error, en vez de lanzar excepción)
mysqli_report(MYSQLI_REPORT_OFF);

// Red de seguridad: cualquier error/excepción que se escape, termina
// igual como JSON (nunca como una respuesta vacía o HTML de error de PHP)
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
        echo json_encode(['error' => 'Error fatal: ' . $err['message']]);
    }
});

/* ------------------------------------------------------------
   WHITELIST de tablas permitidas.
   Es la única validación de seguridad sobre el nombre de tabla
   (nunca se concatena un nombre de tabla que no esté acá, para
   evitar SQL injection a través del parámetro "tabla").
   ------------------------------------------------------------ */
$TABLAS_PERMITIDAS = [
    'aulas', 'cursos', 'estudiantes', 'estudiantes_tutores', 'horarios',
    'inventarioelementosgenerales', 'inventariolaboratorio', 'inventarioventas',
    'materias', 'profesores', 'tutores'
];

$conn = new mysqli('localhost', 'rootX', 'rootX', 'proadb');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión: ' . $conn->connect_error]);
    exit;
}
$conn->set_charset('utf8mb4');

$accion = $_GET['accion'] ?? '';
$tabla  = $_GET['tabla']  ?? '';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
if (!$accion) $accion = $body['accion'] ?? '';
if (!$tabla)  $tabla  = $body['tabla']  ?? '';

if (!in_array($tabla, $TABLAS_PERMITIDAS, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tabla no permitida: ' . $tabla]);
    exit;
}

/* ------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------ */

// Devuelve la estructura de la tabla: cada columna con su info de
// MySQL (Field, Type, Key, Extra...) más, si corresponde, los datos
// de la foreign key que apunta a otra tabla (para poder armar selects).
function obtenerColumnas(mysqli $conn, string $tabla): array {
    $cols = $conn->query("DESCRIBE `$tabla`")->fetch_all(MYSQLI_ASSOC);

    $fkStmt = $conn->prepare("
        SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
    ");
    $fkStmt->bind_param('s', $tabla);
    $fkStmt->execute();
    $fks = $fkStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $fkStmt->close();

    foreach ($cols as &$col) {
        $col['esClavePrimaria']   = ($col['Key'] === 'PRI');
        $col['esAutoIncremental'] = (stripos($col['Extra'], 'auto_increment') !== false);
        foreach ($fks as $fk) {
            if ($fk['COLUMN_NAME'] === $col['Field']) {
                $col['tablaReferenciada']  = $fk['REFERENCED_TABLE_NAME'];
                $col['columnaReferenciada'] = $fk['REFERENCED_COLUMN_NAME'];
            }
        }
    }
    return $cols;
}

// Traduce un tipo de columna de MySQL al tipo que pide bind_param ('i','d','s')
function tipoBind(string $mysqlType): string {
    $t = strtolower($mysqlType);
    if (preg_match('/int|bit/', $t))               return 'i';
    if (preg_match('/decimal|float|double/', $t))  return 'd';
    return 's'; // varchar, char, text, date, datetime, enum, etc.
}

// bind_param necesita los argumentos por referencia y en cantidad variable;
// esta función es el truco estándar de PHP para poder pasarle un array dinámico.
function bindDinamico(mysqli_stmt $stmt, string $tipos, array $valores): void {
    $refs = [];
    foreach ($valores as $k => $v) $refs[$k] = &$valores[$k];
    array_unshift($refs, $tipos);
    call_user_func_array([$stmt, 'bind_param'], $refs);
}

// Lista de columnas que son clave primaria (puede ser compuesta)
function columnasClave(array $columnas): array {
    return array_values(array_filter($columnas, fn($c) => $c['esClavePrimaria']));
}

/* ------------------------------------------------------------
   ACCIONES
   ------------------------------------------------------------ */
switch ($accion) {

    // Devuelve la estructura de la tabla (para que el front armé el formulario solo)
    case 'columnas':
        echo json_encode(obtenerColumnas($conn, $tabla));
        break;

    // Lista todas las filas (limitado a 500 para no traer tablas enormes)
    case 'listar':
        $r = $conn->query("SELECT * FROM `$tabla` LIMIT 500");
        if ($r === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al listar: ' . $conn->error]);
            break;
        }
        echo json_encode($r->fetch_all(MYSQLI_ASSOC));
        break;

    // Busca el texto "q" en todas las columnas de tipo texto de la tabla
    case 'buscar':
        $q = $_GET['q'] ?? '';
        $columnas = obtenerColumnas($conn, $tabla);
        $columnasTexto = array_filter($columnas, fn($c) => tipoBind($c['Type']) === 's');

        if (empty($columnasTexto)) { echo json_encode([]); break; }

        $condiciones = array_map(fn($c) => "`{$c['Field']}` LIKE ?", $columnasTexto);
        $sql = "SELECT * FROM `$tabla` WHERE " . implode(' OR ', $condiciones) . " LIMIT 200";

        $stmt = $conn->prepare($sql);
        $valores = array_fill(0, count($columnasTexto), "%$q%");
        bindDinamico($stmt, str_repeat('s', count($valores)), $valores);
        $stmt->execute();
        echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
        $stmt->close();
        break;

    // Inserta una nueva fila con las columnas que vengan en el body
    // (se ignoran las que sean auto-incrementales, como el ID)
    case 'agregar':
        $columnas = obtenerColumnas($conn, $tabla);
        $insertables = array_filter($columnas, fn($c) => !$c['esAutoIncremental'] && array_key_exists($c['Field'], $body));

        if (empty($insertables)) {
            http_response_code(400);
            echo json_encode(['error' => 'No se recibieron campos para insertar']);
            break;
        }

        $nombres   = array_map(fn($c) => "`{$c['Field']}`", $insertables);
        $signos    = array_fill(0, count($insertables), '?');
        $tipos     = implode('', array_map(fn($c) => tipoBind($c['Type']), $insertables));
        $valores   = array_map(fn($c) => ($body[$c['Field']] === '' ? null : $body[$c['Field']]), $insertables);

        $sql  = "INSERT INTO `$tabla` (" . implode(',', $nombres) . ") VALUES (" . implode(',', $signos) . ")";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al preparar consulta: ' . $conn->error]);
            break;
        }
        bindDinamico($stmt, $tipos, array_values($valores));

        if ($stmt->execute()) {
            echo json_encode(['mensaje' => '✅ Registro agregado correctamente', 'id' => $stmt->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => '❌ No se pudo agregar: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    // Actualiza una fila existente. La/s clave/s primaria/s deben venir en el
    // body con su propio nombre de columna (soporta clave compuesta).
    case 'editar':
        $columnas = obtenerColumnas($conn, $tabla);
        $claves   = columnasClave($columnas);
        if (empty($claves)) {
            http_response_code(400);
            echo json_encode(['error' => 'La tabla no tiene clave primaria definida']);
            break;
        }

        // columnas a actualizar: todas las que no son clave y vinieron en el body
        $actualizables = array_filter($columnas, fn($c) => !$c['esClavePrimaria'] && array_key_exists($c['Field'], $body));
        if (empty($actualizables)) {
            http_response_code(400);
            echo json_encode(['error' => 'No se recibieron campos para actualizar']);
            break;
        }

        $set    = array_map(fn($c) => "`{$c['Field']}` = ?", $actualizables);
        $where  = array_map(fn($c) => "`{$c['Field']}` = ?", $claves);
        $tipos  = implode('', array_map(fn($c) => tipoBind($c['Type']), $actualizables))
                . implode('', array_map(fn($c) => tipoBind($c['Type']), $claves));
        $valores = array_merge(
            array_map(fn($c) => ($body[$c['Field']] === '' ? null : $body[$c['Field']]), $actualizables),
            array_map(fn($c) => $body[$c['Field']] ?? null, $claves)
        );

        $sql = "UPDATE `$tabla` SET " . implode(',', $set) . " WHERE " . implode(' AND ', $where);
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al preparar consulta: ' . $conn->error]);
            break;
        }
        bindDinamico($stmt, $tipos, array_values($valores));

        if ($stmt->execute()) {
            echo json_encode(['mensaje' => '✅ Registro actualizado correctamente']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => '❌ No se pudo actualizar: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    // Elimina una fila por su clave primaria (soporta clave compuesta)
    case 'eliminar':
        $columnas = obtenerColumnas($conn, $tabla);
        $claves   = columnasClave($columnas);
        if (empty($claves)) {
            http_response_code(400);
            echo json_encode(['error' => 'La tabla no tiene clave primaria definida']);
            break;
        }

        $where = array_map(fn($c) => "`{$c['Field']}` = ?", $claves);
        $tipos = implode('', array_map(fn($c) => tipoBind($c['Type']), $claves));
        $valores = array_map(fn($c) => $body[$c['Field']] ?? null, $claves);

        $sql  = "DELETE FROM `$tabla` WHERE " . implode(' AND ', $where);
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al preparar consulta: ' . $conn->error]);
            break;
        }
        bindDinamico($stmt, $tipos, array_values($valores));
        $stmt->execute();

        if ($stmt->affected_rows > 0) {
            echo json_encode(['mensaje' => '✅ Registro eliminado correctamente']);
        } else {
            echo json_encode(['error' => '❌ No se encontró el registro o ya fue eliminado. Si la tabla tiene otros registros que dependen de este (foreign key), primero hay que borrar esos.']);
        }
        $stmt->close();
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Acción no reconocida: ' . $accion]);
}

$conn->close();
