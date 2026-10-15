<?php
/* ============================================================
   api/login.php
   Autenticación contra la tabla `usuarios`.
   Espera POST JSON: { "email": "...", "password": "..." }
   Responde: { "success": bool, "mensaje": string, "usuario": {...} }
   ============================================================ */

include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(['success' => false, 'mensaje' => 'Método no permitido'], 405);
}

$entrada = leerEntrada();
$email   = trim((string)($entrada['email'] ?? $entrada['EmailUsuario'] ?? ''));
$password = (string)($entrada['password'] ?? $entrada['ContraseñaUsuario'] ?? '');

if ($email === '' || $password === '') {
    responder(['success' => false, 'mensaje' => 'Completá el usuario y la contraseña.'], 400);
}

$stmt = $conn->prepare(
    'SELECT IdUsuario, NombreUsuario, EmailUsuario, RolUsuario, EstadoUsuario, ContraseñaUsuario
     FROM usuarios WHERE EmailUsuario = ? LIMIT 1'
);

if (!$stmt) {
    responder(['success' => false, 'mensaje' => 'Error al preparar la consulta.'], 500);
}

$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();

if ($res === false) {
    responder(['success' => false, 'mensaje' => 'Error al consultar usuarios.'], 500);
}

$fila = $res->fetch_assoc();
$stmt->close();
$conn->close();

if (!$fila) {
    responder(['success' => false, 'mensaje' => 'Usuario no encontrado.'], 404);
}

if (!password_verify($password, $fila['ContraseñaUsuario'])) {
    responder(['success' => false, 'mensaje' => 'Contraseña incorrecta.'], 401);
}

if ($fila['EstadoUsuario'] !== 'activo') {
    responder([
        'success' => false,
        'mensaje' => $fila['EstadoUsuario'] === 'pendiente'
            ? 'Tu cuenta está pendiente de aprobación. Avisá al directorio.'
            : 'Tu cuenta fue rechazada. Contactá al directorio.'
    ], 403);
}

session_start();
$_SESSION['rol'] = $fila['RolUsuario'];
$_SESSION['id']  = $fila['IdUsuario'];

responder([
    'success' => true,
    'mensaje' => 'Ingreso correcto.',
    'usuario' => [
        'id'            => (int)$fila['IdUsuario'],
        'nombre'        => $fila['NombreUsuario'],
        'email'         => $fila['EmailUsuario'],
        'rol'           => $fila['RolUsuario'],
    ]
]);


