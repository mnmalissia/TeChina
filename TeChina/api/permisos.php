<?php
/* ============================================================
   api/permisos.php
   Devuelve la matriz de permisos del usuario en sesión, para que el
   frontend sepa qué botones pintar.

   OJO: el rol se lee de $_SESSION, NUNCA de un parámetro de la
   request. Si aceptáramos ?rol=Director, el navegador pediría los
   permisos del Director y le mostraría todo a todos. El backend
   igual lo bloquearía, pero no hay por qué filtrar la información.
   ============================================================ */

include 'conexion.php';
include 'permisos_lib.php';

session_start();

$usuario = usuarioEnSesion($conn);

if (!$usuario) {
    responder(['success' => false, 'mensaje' => 'Sesión no iniciada.'], 401);
}

$matriz = cargarPermisos($conn, $usuario['rol']);

responder([
    'success' => true,
    'rol'     => $usuario['rol'],
    // (object) para que un rol sin permisos devuelva {} y no []: si saliera
    // como array, el contrato de la respuesta cambiaría de forma según los datos
    'modulos' => (object)$matriz,
]);
