/* ============================================
   AURA - Sistema de Autenticación (script.js)
   ============================================ */

// Clave para almacenar usuarios en localStorage
const USERS_KEY = 'aura_users';

/* ------------------------------------------
   FUNCIONES DE GESTIÓN DE USUARIOS (LÍNEAS 3-9)
   ------------------------------------------ */

/**
 * getUsers() - Líneas 3-5
 * Obtiene todos los usuarios registrados desde localStorage.
 * Retorna: objeto con emails como claves y passwords como valores.
 */
function getUsers() {
    // Intenta obtener usuarios del navegador; si no existen, retorna objeto vacío {}
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
}

/**
 * saveUsers(users) - Líneas 7-9
 * Guarda el objeto de usuarios en localStorage.
 * Recibe: objeto con estructura { "email": { password: "..." } }
 */
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/* ------------------------------------------
   FUNCIÓN DE REGISTRO (LÍNEAS 11-26)
   ------------------------------------------ */

/**
 * register(email, password) - Líneas 11-26
 * Registra un nuevo usuario en el sistema.
 * 
 * Validaciones (líneas 14-18):
 *   - Verifica que email y password no estén vacíos
 *   - Verifica que el email sea válido
 *   - Verifica que el email sea del dominio institucional (@escuelasproa.edu.ar)
 *   - Verifica que la contraseña tenga al menos 4 caracteres
 *   - Verifica que el email no esté ya registrado
 * 
 * Almacenamiento (líneas 22-23):
 *   - Guarda el usuario en el objeto users
 *   - Persiste en localStorage
 * 
 * Retorna: { success: boolean, msg: string }
 */
function register(email, password) {
    const users = getUsers();

    // Validaciones de campos obligatorios
    if (!email || !password) return { success: false, msg: 'Completar todo el formulario' };
    if (!email) return { success: false, msg: 'Ingresar email valido' };
    
    // Validación de dominio institucional
    if (!email.includes("@escuelasproa.edu.ar")) {
        return { success: false, msg: 'Email no propio de la institucion' };
    }
    
    // Validación de longitud de contraseña
    if (password.length < 4) {
        return { success: false, msg: 'Clave demasiado corta (MINIMO 4 CARACTERES)' };
    }
    
    // Validación de usuario existente
    if (users[email]) return { success: false, msg: 'Email ya registrado' };

    // Registro exitoso: guardar usuario
    users[email] = { password };
    saveUsers(users);

    return { success: true, msg: 'Registrado' };
}

/* ------------------------------------------
   FUNCIÓN DE LOGIN (LÍNEAS 28-38)
   ------------------------------------------ */

/**
 * login(email, password) - Líneas 28-38
 * Verifica las credenciales del usuario y crea sesión.
 * 
 * Validaciones (líneas 31-32):
 *   - Verifica que el email exista en la base de datos
 *   - Verifica que la contraseña coincida
 * 
 * Sesión (línea 34):
 *   - Guarda en sessionStorage que el usuario está logueado
 * 
 * Redirección (línea 35):
 *   - Envía a principal.html si el login es exitoso
 * 
 * Retorna: { success: boolean, msg: string }
 */
function login(email, password) {
    const users = getUsers();

    // Verificar que el usuario existe
    if (!users[email]) return { success: false, msg: 'No existe' };
    
    // Verificar que la contraseña es correcta
    if (users[email].password !== password) return { success: false, msg: 'Incorrecta' };

    // Login exitoso: crear sesión
    sessionStorage.setItem('aura_session', JSON.stringify({
        loggedIn: true,
        email: email
    }));

    // Redireccionar a la página principal
    window.location.href = "principal.html";

    return { success: true, msg: 'Entrando...' };
}

/* ------------------------------------------
   FUNCIÓN DE MENÚ DESPLEGABLE (LÍNEAS 40-52)
   ------------------------------------------ */

/**
 * toggleMenu(type) - Líneas 40-52
 * Muestra u oculta los formularios de login y registro.
 * 
 * Parámetro type:
 *   - 'login': muestra formulario de login, oculta registro
 *   - cualquier otro: muestra registro, oculta login
 */
function toggleMenu(type) {
    // Obtener referencias a los formularios
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (type === 'login') {
        // Alternar visibilidad del formulario de login
        loginForm.classList.toggle('hidden');
        // Asegurar que el registro esté oculto
        registerForm.classList.add('hidden');
    } else {
        // Alternar visibilidad del formulario de registro
        registerForm.classList.toggle('hidden');
        // Asegurar que el login esté oculto
        loginForm.classList.add('hidden');
    }
}

/* ------------------------------------------
   EVENT LISTENERS DE BOTONES (LÍNEAS 54-97)
   ------------------------------------------ */

// Obtener referencias a los botones
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

/**
 * Event Listener - Botón Login (líneas 58-71)
 * Se activa al hacer click en "Iniciar Sesión"
 * Flujo:
 *   1. Obtiene email y password de los inputs
 *   2. Llama a la función login()
 *   3. Si es exitoso, deshabilita el botón y cambia texto
 *   4. Muestra mensaje de resultado
 */
loginBtn.addEventListener('click', () => {
    // Obtener valores de los inputs
    const email = document.getElementById('loginEmail').value;
    const pwd = document.getElementById('loginPassword').value;

    // Llamar a función de login
    const result = login(email, pwd);

    // Si login exitoso, bloquear botón
    if (result.success) {
        loginBtn.disabled = true;
        loginBtn.innerText = "Entrando...";
    }

    // Mostrar mensaje de resultado
    document.getElementById('loginMessage').innerText = result.msg;
});

/**
 * Event Listener - Botón Registro (líneas 73-84)
 * Se activa al hacer click en "Registrarse"
 * Flujo:
 *   1. Obtiene email y password de los inputs
 *   2. Llama a la función register()
 *   3. Si es exitoso, oculta el botón de registro
 *   4. Muestra mensaje de resultado
 */
registerBtn.addEventListener('click', () => {
    // Obtener valores de los inputs
    const email = document.getElementById('regEmail').value;
    const pwd = document.getElementById('regPassword').value;

    // Llamar a función de registro
    const result = register(email, pwd);

    // Si registro exitoso, ocultar botón
    if (result.success) {
        registerBtn.style.display = "none";
    }

    // Mostrar mensaje de resultado
    document.getElementById('regMessage').innerText = result.msg;
});

/* ------------------------------------------
   BOTONES DE INTERFAZ (LÍNEAS 86-97)
   ------------------------------------------ */

// Referencias a los botones principales del HTML
const boton1 = document.getElementById("boton1");
const boton2 = document.getElementById("boton2");

/**
 * Botón 1 (líneas 89-92)
 * Al hacer click: oculta botón 1, muestra botón 2
 * Uso: alternar entre opciones de login/registro
 */
boton1.addEventListener("click", () => {
    boton1.classList.add("hidden");    // Ocultar botón 1
    boton2.classList.remove("hidden"); // Mostrar botón 2
});

/**
 * Botón 2 (líneas 94-97)
 * Al hacer click: oculta botón 2, muestra botón 1
 * Uso: volver a la opción anterior
 */
boton2.addEventListener("click", () => {
    boton2.classList.add("hidden");
    boton1.classList.remove("hidden");
});