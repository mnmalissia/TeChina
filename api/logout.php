<?php
/* ============================================================
   api/logout.php
   Destruye la sesión del lado del servidor. Sin esto, el botón
   "Cerrar sesión" solo borra sessionStorage y la cookie de PHP
   sigue viva: en una PC compartida, el siguiente usuario conservaría
   el $_SESSION['rol'] y podría seguir entrando a crud.php.
   ============================================================ */

include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(['success' => false, 'mensaje' => 'Método no permitido'], 405);
}

// Vaciar los datos y borrar la cookie de sesión
session_start();
$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,          // fecha en el pasado = el navegador la descarta
        $p['path'],
        $p['domain'],
        $p['secure'],
        $p['httponly']
    );
}

session_destroy();

responder(['success' => true, 'mensaje' => 'Sesión cerrada.']);
