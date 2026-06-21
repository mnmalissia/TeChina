// ======================
// CONFIG
// ======================
const USER = "Director";

function getPassword() {
    return localStorage.getItem("aura_pass") || "director123";
}

function setPassword(newPass) {
    localStorage.setItem("aura_pass", newPass);
}

// ======================
// LOGIN
// ======================
function login(user, password) {
    if (!user || !password) {
        return { success: false, msg: 'Completa todos los campos.' };
    }

    if (user !== USER) {
        return { success: false, msg: 'Usuario incorrecto.' };
    }

    if (password !== getPassword()) {
        return { success: false, msg: 'Contraseña incorrecta.' };
    }

    sessionStorage.setItem('aura_session', JSON.stringify({ user: user, loggedIn: true }));

    return { success: true, msg: 'Ingresando al sistema...' };
}

document.getElementById('loginBtn').addEventListener('click', () => {
    const user = document.getElementById('loginUser').value.trim();
    const pwd = document.getElementById('loginPassword').value;
    const loginMsg = document.getElementById('loginMessage');

    const result = login(user, pwd);

    if (result.success) {
        loginMsg.innerHTML = `<span class="success">✅ ${result.msg}</span>`;
        setTimeout(() => {
            window.location.href = 'principal.html';
        }, 800);
    } else {
        loginMsg.innerHTML = `<span class="error">❌ ${result.msg}</span>`;
    }
});

// ======================
// CAMBIO DE PANTALLA
// ======================
function mostrarRecuperacion() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("recoveryForm").style.display = "block";
}

function volverLogin() {
    document.getElementById("recoveryForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
}

// ======================
// RECUPERACIÓN
// ======================
function verificarRespuestas() {
    const r1 = document.getElementById("preg1").value.trim().toLowerCase();
    const r2 = document.getElementById("preg2").value.trim().toLowerCase();
    const recMsg = document.getElementById("recoveryMessage");

    // CAMBIÁ ESTO POR LAS RESPUESTAS REALES
    if (r1 === "2019" && r2 === "proa") {
        recMsg.innerHTML = "✅ Verificación correcta.";
        document.getElementById("nuevaPassContainer").style.display = "block";
    } else {
        recMsg.innerHTML = "❌ Datos incorrectos.";
    }
}

function cambiarPassword() {
    const nueva = document.getElementById("newPassword").value;
    const recMsg = document.getElementById("recoveryMessage");

    if (nueva.length < 4) {
        recMsg.innerHTML = "❌ Mínimo 4 caracteres.";
        return;
    }

    setPassword(nueva);
    recMsg.innerHTML = "✅ Contraseña actualizada.";

    setTimeout(() => {
        volverLogin();
    }, 1000);
}