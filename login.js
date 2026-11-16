// ======================
// CONFIG
// ======================
const API = 'api';

// ======================
// UTILIDADES
// ======================
const $ = (id) => document.getElementById(id);

function mostrarMensaje(elemento, texto, tipo) {
    elemento.className = 'message ' + (tipo === 'ok' ? 'success' : 'error');
    elemento.textContent = texto;
}

function limpiarMensaje(elemento) {
    elemento.className = 'message';
    elemento.textContent = '';
}

function guardarSesion(usuario) {
    sessionStorage.setItem('aura_session', JSON.stringify({
        user: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        loggedIn: true
    }));
}

async function pedir(endpoint, datos) {
    const resp = await fetch(API + '/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });

    let json = {};
    try {
        json = await resp.json();
    } catch (e) {
        throw new Error('Respuesta inválida del servidor.');
    }

    if (!json.success) throw new Error(json.mensaje || 'Error desconocido.');
    return json;
}

// ======================
// CAMBIO DE PANTALLA
// ======================
function mostrarLogin() {
    $('registerForm').style.display = 'none';
    $('loginForm').style.display = 'block';
    limpiarMensaje($('registerMessage'));
}

function mostrarRegistro() {
    $('loginForm').style.display = 'none';
    $('registerForm').style.display = 'block';
    limpiarMensaje($('loginMessage'));
}

$('goRegister').addEventListener('click', (e) => { e.preventDefault(); mostrarRegistro(); });
$('goLogin').addEventListener('click', (e) => { e.preventDefault(); mostrarLogin(); });

// ======================
// LOGIN
// ======================
$('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = $('loginUser').value.trim();
    const password = $('loginPassword').value;
    const msg = $('loginMessage');
    const btn = $('loginBtn');

    if (!email || !password) {
        return mostrarMensaje(msg, 'Completá el email y la contraseña.', 'error');
    }

    btn.disabled = true;
    btn.textContent = 'Ingresando...';
    limpiarMensaje(msg);

    try {
        const res = await pedir('login.php', { email, password });
        guardarSesion(res.usuario);
        mostrarMensaje(msg, '✅ ' + res.mensaje, 'ok');
        setTimeout(() => { window.location.href = 'principal.html'; }, 800);
    } catch (err) {
        mostrarMensaje(msg, '❌ ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Iniciar Sesión';
    }
});

// ======================
// REGISTRO
// ======================
$('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = $('regNombre').value.trim();
    const email = $('regEmail').value.trim();
    const password = $('regPassword').value;
    const password2 = $('regPassword2').value;
    const rol = $('regRol').value;
    const msg = $('registerMessage');
    const btn = $('registerBtn');

    if (!nombre || !email || !password || !rol) {
        return mostrarMensaje(msg, 'Completá todos los campos.', 'error');
    }
    if (password !== password2) {
        return mostrarMensaje(msg, 'Las contraseñas no coinciden.', 'error');
    }

    btn.disabled = true;
    btn.textContent = 'Creando cuenta...';
    limpiarMensaje(msg);

    try {
        const res = await pedir('registro.php', { nombre, email, password, rol });
        guardarSesion(res.usuario);
        mostrarMensaje(msg, '✅ ' + res.mensaje, 'ok');
        setTimeout(() => { window.location.href = 'principal.html'; }, 900);
    } catch (err) {
        mostrarMensaje(msg, '❌ ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Registrarme';
    }
});
