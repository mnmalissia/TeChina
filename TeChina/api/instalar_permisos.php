<?php
/* ============================================================
   Crea y siembra el esquema de permisos por rol.

   Es la opción B: los permisos viven en MySQL, no en el código.
   Así se cambian desde una interfaz sin editar PHP ni desplegar.

   Es idempotente: se puede volver a ejecutar sin duplicar nada
   (las tablas usan CREATE TABLE IF NOT EXISTS y el sembrado
   borra y reinserta los permisos de cada módulo).

   Uso:  php api/instalar_permisos.php
   ============================================================ */

mysqli_report(MYSQLI_REPORT_OFF);
$conn = new mysqli('localhost', 'rootX', 'rootX', 'proadb');
if ($conn->connect_error) {
    echo "ERROR de conexión: " . $conn->connect_error . PHP_EOL;
    exit(1);
}
$conn->set_charset('utf8mb4');

/* ------------------------------------------------------------
   1. ESQUEMA
   ------------------------------------------------------------ */
$ddl = [
    "CREATE TABLE IF NOT EXISTS `roles` (
        IdRol     INT(11) NOT NULL AUTO_INCREMENT,
        NombreRol VARCHAR(45) NOT NULL,
        PRIMARY KEY (IdRol),
        UNIQUE KEY `uq_roles_nombre` (`NombreRol`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    // Un módulo es cualquier cosa protegible: una tabla del CRUD o una
    // tarjeta del dashboard. ClaveModulo VARCHAR a propósito: un módulo
    // desconocido es un string que no matchea nada, no un id roto.
    "CREATE TABLE IF NOT EXISTS `modulos` (
        ClaveModulo VARCHAR(45) NOT NULL,
        Etiqueta    VARCHAR(80) NOT NULL,
        EsTabla     TINYINT(1) NOT NULL DEFAULT 1,
        PRIMARY KEY (`ClaveModulo`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    "CREATE TABLE IF NOT EXISTS `roles_permisos` (
        IdRol         INT(11) NOT NULL,
        ClaveModulo   VARCHAR(45) NOT NULL,
        PuedeListar   TINYINT(1) NOT NULL DEFAULT 0,
        PuedeAgregar  TINYINT(1) NOT NULL DEFAULT 0,
        PuedeEditar   TINYINT(1) NOT NULL DEFAULT 0,
        PuedeEliminar TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (`IdRol`, `ClaveModulo`),
        KEY `fk_rp_modulo` (`ClaveModulo`),
        CONSTRAINT `fk_rp_rol` FOREIGN KEY (`IdRol`)
            REFERENCES `roles` (`IdRol`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

foreach ($ddl as $sql) {
    if (!$conn->query($sql)) {
        echo "ERROR al crear tabla: " . $conn->error . PHP_EOL . $sql . PHP_EOL;
        exit(1);
    }
}
echo "Tablas listas (roles, modulos, roles_permisos).\n";

/* ------------------------------------------------------------
   2. ROLES
   ------------------------------------------------------------ */
$ROLES = ['Director', 'Preceptor', 'Profesor', 'Alumno'];
foreach ($ROLES as $r) {
    $stmt = $conn->prepare(
        'INSERT INTO roles (NombreRol) VALUES (?) ON DUPLICATE KEY UPDATE NombreRol = VALUES(NombreRol)'
    );
    $stmt->bind_param('s', $r);
    $stmt->execute();
    $stmt->close();
}
echo "Roles: " . implode(', ', $ROLES) . "\n";

/* ------------------------------------------------------------
   3. MÓDULOS
   ------------------------------------------------------------ */
$MODULOS = [
    // clave            etiqueta              esTabla
    ['usuarios',                   'Usuarios',                   1],
    ['estudiantes',                'Estudiantes',                1],
    ['cursos',                     'Cursos',                     1],
    ['materias',                   'Materias',                   1],
    ['profesores',                 'Profesores',                 1],
    ['tutores',                    'Tutores',                    1],
    ['estudiantes_tutores',        'Estudiantes-Tutores',        1],
    ['aulas',                      'Aulas',                      1],
    ['horarios',                   'Horarios',                   1],
    ['inventarioelementosgenerales','Inventario General',         1],
    ['inventariolaboratorio',      'Inventario Laboratorio',      1],
    ['inventarioventas',           'Inventario Ventas',          1],
    // tarjetas del dashboard
    ['card_whatsapp',              'WhatsApp',                   0],
    ['card_basededatos',           'Base de Datos',              0],
    ['card_imagen',                'Imágenes',                   0],
    ['card_guia',                  'Guía',                       0],
];

foreach ($MODULOS as [$clave, $etiqueta, $esTabla]) {
    $stmt = $conn->prepare(
        'INSERT INTO modulos (ClaveModulo, Etiqueta, EsTabla) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE Etiqueta = VALUES(Etiqueta), EsTabla = VALUES(EsTabla)'
    );
    $stmt->bind_param('ssi', $clave, $etiqueta, $esTabla);
    $stmt->execute();
    $stmt->close();
}
echo "Modulos: " . count($MODULOS) . "\n";

/* ------------------------------------------------------------
   4. MATRIZ DE PERMISOS POR DEFECTO
   ------------------------------------------------------------
   1 = permitido, 0 = no. Ausencia de fila = sin permiso sobre
   nada de ese módulo (fail-closed), así que solo se siembran
   los módulos donde el rol tiene al menos un permiso.
   ------------------------------------------------------------ */
$M = [

    'Director' => [
        'usuarios'                    => [1, 1, 1, 1],
        'estudiantes'                 => [1, 1, 1, 1],
        'cursos'                      => [1, 1, 1, 1],
        'materias'                    => [1, 1, 1, 1],
        'profesores'                  => [1, 1, 1, 1],
        'tutores'                     => [1, 1, 1, 1],
        'estudiantes_tutores'         => [1, 1, 1, 1],
        'aulas'                       => [1, 1, 1, 1],
        'horarios'                    => [1, 1, 1, 1],
        'inventarioelementosgenerales'=> [1, 1, 1, 1],
        'inventariolaboratorio'       => [1, 1, 1, 1],
        'inventarioventas'            => [1, 1, 1, 1],
        'card_whatsapp'               => [1, 0, 0, 0],
        'card_basededatos'            => [1, 0, 0, 0],
        'card_imagen'                 => [1, 0, 0, 0],
        'card_guia'                   => [1, 0, 0, 0],
    ],

    // Lectura y edición académica, sin tocar usuarios ni inventarios,
    // y nunca eliminando (los borrados los hace el Director).
    'Preceptor' => [
        'estudiantes'         => [1, 1, 1, 0],
        'cursos'              => [1, 1, 1, 0],
        'materias'            => [1, 0, 0, 0],
        'profesores'          => [1, 0, 0, 0],
        'tutores'             => [1, 1, 0, 0],
        'estudiantes_tutores' => [1, 1, 0, 0],
        'aulas'               => [1, 0, 0, 0],
        'horarios'            => [1, 1, 1, 0],
        'card_whatsapp'       => [1, 0, 0, 0],
        'card_basededatos'    => [1, 0, 0, 0],
        'card_guia'           => [1, 0, 0, 0],
    ],

    // Solo puede ver y editar la tabla de horarios (acceso completo a la
    // misma, pero sin tocar el resto de las tablas). Conserva las tarjetas
    // de navegación para poder abrir la Base de Datos y la Guía.
    'Profesor' => [
        'horarios'         => [1, 0, 1, 0],
        'card_basededatos' => [1, 0, 0, 0],
        'card_guia'        => [1, 0, 0, 0],
    ],

    // Solo puede ver la tabla de horarios (ni alta, ni edición, ni borrado).
    'Alumno' => [
        'horarios'         => [1, 0, 0, 0],
        'card_basededatos' => [1, 0, 0, 0],
        'card_guia'        => [1, 0, 0, 0],
    ],
];

// Re-sembrar: borra lo anterior de estos roles y reinserta la matriz
$conn->query('DELETE FROM roles_permisos');
echo "Matriz anterior borrada.\n";

$stmt = $conn->prepare(
    'INSERT INTO roles_permisos (IdRol, ClaveModulo, PuedeListar, PuedeAgregar, PuedeEditar, PuedeEliminar)
     SELECT r.IdRol, ?, ?, ?, ?, ? FROM roles r WHERE r.NombreRol = ?'
);
$n = 0;
foreach ($M as $rol => $mods) {
    foreach ($mods as $mod => [$lst, $agr, $edt, $eli]) {
        $stmt->bind_param('siiiis', $mod, $lst, $agr, $edt, $eli, $rol);
        $stmt->execute();
        $n++;
    }
}
$stmt->close();
echo "Permisos insertados: $n\n";

/* ------------------------------------------------------------
   5. RESUMEN
   ------------------------------------------------------------ */
$r = $conn->query("
    SELECT ro.NombreRol, m.Etiqueta, p.PuedeListar, p.PuedeAgregar, p.PuedeEditar, p.PuedeEliminar
    FROM roles_permisos p
    JOIN roles   ro ON ro.IdRol = p.IdRol
    JOIN modulos m  ON m.ClaveModulo = p.ClaveModulo
    ORDER BY ro.IdRol, m.EsTabla DESC, m.Etiqueta
");
$actual = null;
while ($f = $r->fetch_assoc()) {
    if ($f['NombreRol'] !== $actual) {
        $actual = $f['NombreRol'];
        echo "\n  $actual\n";
    }
    // Concatenar, no asignar por offset: '·' ocupa 2 bytes en UTF-8 y los
    // offsets de string son por byte, así que pisaría media letra.
    $marcas = ($f['PuedeListar']   ? 'L' : '-')
            . ($f['PuedeAgregar']  ? 'A' : '-')
            . ($f['PuedeEditar']   ? 'E' : '-')
            . ($f['PuedeEliminar'] ? 'X' : '-');
    echo "    [$marcas] {$f['Etiqueta']}\n";
}
echo "\n  (L=listar  A=agregar  E=editar  X=eliminar)\n";

$conn->close();
echo "\nInstalación terminada.\n";
