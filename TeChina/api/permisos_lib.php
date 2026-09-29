<?php
/* ============================================================
   api/permisos_lib.php
   Lógica compartida de autorización por rol.

   La matriz vive en MySQL (roles / modulos / roles_permisos), no
   en el código, así se cambia desde una interfaz sin desplegar.

   Todo es fail-closed: si el rol no tiene fila para un módulo, no
   tiene permiso sobre nada de ese módulo. Nunca se abre por
   default, que es el error clásico de estos sistemas.
   ============================================================ */

/**
 * Devuelve la matriz de permisos de un rol.
 * Formato: ['estudiantes' => ['listar'=>1,'agregar'=>0,'editar'=>1,'eliminar'=>0], ...]
 */
function cargarPermisos(mysqli $conn, string $rol): array {
    static $cache = [];

    if (isset($cache[$rol])) return $cache[$rol];

    $permisos = [];

    $stmt = $conn->prepare(
        'SELECT p.ClaveModulo, p.PuedeListar, p.PuedeAgregar, p.PuedeEditar, p.PuedeEliminar
           FROM roles_permisos p
           JOIN roles r ON r.IdRol = p.IdRol
          WHERE r.NombreRol = ?'
    );
    $stmt->bind_param('s', $rol);
    $stmt->execute();

    $res = $stmt->get_result();
    while ($f = $res->fetch_assoc()) {
        $permisos[$f['ClaveModulo']] = [
            'listar'   => (int)$f['PuedeListar'],
            'agregar'  => (int)$f['PuedeAgregar'],
            'editar'   => (int)$f['PuedeEditar'],
            'eliminar' => (int)$f['PuedeEliminar'],
        ];
    }
    $stmt->close();

    $cache[$rol] = $permisos;
    return $permisos;
}

/**
 * Acción CRUD → permiso que la habilita.
 * 'columnas' cuelga de listar: si podés ver la tabla tenés que poder
 * abrir el formulario para editarla.
 * Una acción desconocida devuelve null, y un null da false: alguien
 * no puede inventar accion=drop y colarse por el mapa.
 */
function permisoDeAccion(string $accion): ?string {
    return [
        'listar'   => 'listar',
        'buscar'   => 'listar',
        'columnas' => 'listar',
        'agregar'  => 'agregar',
        'editar'   => 'editar',
        'eliminar' => 'eliminar',
    ][$accion] ?? null;
}

/** ¿El rol puede ejecutar $accion sobre $modulo? Fail-closed. */
function permitido(array $matriz, string $modulo, string $accion): bool {
    $clave = permisoDeAccion($accion);
    if ($clave === null) return false;                 // acción desconocida
    if (!isset($matriz[$modulo])) return false;        // módulo sin fila = sin permiso
    return ($matriz[$modulo][$clave] ?? 0) === 1;
}

/** ¿El rol tiene al menos un permiso sobre $modulo? Para pintar el botón. */
function puedeVerModulo(array $matriz, string $modulo): bool {
    if (!isset($matriz[$modulo])) return false;
    foreach ($matriz[$modulo] as $v) {
        if ($v === 1) return true;
    }
    return false;
}

/**
 * Resuelve el usuario de la sesión leyendo el rol fresco de la base.
 *
 * El rol NO se lee de $_SESSION['rol'] a propósito: si queda cacheado
 * en la sesión, degrader a un usuario no surte efecto hasta que vuelva
 * a loguearse. Leyéndolo por IdUsuario en cada request, los cambios de
 * rol y de estado son inmediatos, y además una cuenta desactivada pierde
 * el acceso al instante.
 *
 * Devuelve ['id'=>int, 'rol'=>string] o null si no hay sesión válida.
 */
function usuarioEnSesion(mysqli $conn): ?array {
    $id = (int)($_SESSION['id'] ?? 0);
    if ($id === 0) return null;

    $stmt = $conn->prepare(
        'SELECT IdUsuario, RolUsuario FROM usuarios WHERE IdUsuario = ? AND EstadoUsuario = ? LIMIT 1'
    );
    $activo = 'activo';
    $stmt->bind_param('is', $id, $activo);
    $stmt->execute();
    $fila = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$fila) return null;
    return ['id' => (int)$fila['IdUsuario'], 'rol' => (string)$fila['RolUsuario']];
}
