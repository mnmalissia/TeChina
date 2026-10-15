<?php
/* ============================================================
   api/registro.php
   Alta de usuarios en la tabla `usuarios`.
   Espera POST JSON: { "nombre": "...", "email": "...",
                       "password": "...", "rol": "..." }
   Responde: { "success": bool, "mensaje": string }
   ============================================================ */

include 'conexion.php';

$ROLES = ['Director', 'Preceptor', 'Profesor', 'Alumno'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(['success' => false, 'mensaje' => 'Método no permitido'], 405);
}

$entrada  = leerEntrada();
$nombre   = trim((string)($entrada['nombre'] ?? $entrada['NombreUsuario'] ?? ''));
$email    = trim((string)($entrada['email'] ?? $entrada['EmailUsuario'] ?? ''));
$password = (string)($entrada['password'] ?? $entrada['ContraseñaUsuario'] ?? '');
$rol      = trim((string)($entrada['rol'] ?? $entrada['RolUsuario'] ?? ''));

/* --- Validaciones --- */
if ($nombre === '' || $email === '' || $password === '' || $rol === '') {
    responder(['success' => false, 'mensaje' => 'Completá todos los campos.'], 400);
}

if (mb_strlen($nombre) < 3 || mb_strlen($nombre) > 80) {
    responder(['success' => false, 'mensaje' => 'El nombre debe tener entre 3 y 80 caracteres.'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 80) {
    responder(['success' => false, 'mensaje' => 'El email no es válido.'], 400);
}

if (mb_strlen($password) < 6) {
    responder(['success' => false, 'mensaje' => 'La contraseña debe tener al menos 6 caracteres.'], 400);
}

if (!in_array($rol, $ROLES, true)) {
    responder(['success' => false, 'mensaje' => 'El rol seleccionado no es válido.'], 400);
}

/* --- ¿El email ya existe? --- */
$check = $conn->prepare('SELECT IdUsuario FROM usuarios WHERE EmailUsuario = ? LIMIT 1');
$check->bind_param('s', $email);
$check->execute();
$existe = $check->get_result()->fetch_assoc();
$check->close();

if ($existe) {
    responder(['success' => false, 'mensaje' => 'Ese email ya está registrado.'], 409);
}

/* --- Alta --- */
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare(
    'INSERT INTO usuarios (NombreUsuario, EmailUsuario, ContraseñaUsuario, RolUsuario)
     VALUES (?, ?, ?, ?)'
);

if (!$stmt) {
    responder(['success' => false, 'mensaje' => 'Error al preparar el registro.'], 500);
}

$stmt->bind_param('ssss', $nombre, $email, $hash, $rol);

if ($stmt->execute()) {
    $id = $stmt->insert_id;
    $stmt->close();
    $conn->close();
    responder([
        'success' => true,
        'mensaje' => 'Cuenta creada. Queda pendiente de aprobacion.',
        'usuario' => [
            'id'     => $id,
            'nombre' => $nombre,
            'email'  => $email,
            'rol'    => $rol,
            'EstadoUsuario' => 'pendiente'
        ]
    ], 201);
}

$error = $stmt->error;
$stmt->close();
$conn->close();

responder(['success' => false, 'mensaje' => 'No se pudo crear la cuenta: ' . $error], 500);
