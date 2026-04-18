const USERS_KEY = 'aura_users';

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function register(email, password) {
    const users = getUsers();

    if (!email || !password) return { success: false, msg: 'Completar todo el formulario' };
    if (users[email]) return { success: false, msg: 'Ya existe' };

    users[email] = { password };
    saveUsers(users);

    return { success: true, msg: 'Registrado' };
}

function login(email, password) {
    const users = getUsers();

    if (!users[email]) return { success: false, msg: 'No existe' };
    if (users[email].password !== password) return { success: false, msg: 'Incorrecta' };

    return { success: true, msg: 'Entrando...' };
}

/*  DESPLEGABLE */
function toggleMenu(type) {
    const login = document.getElementById('loginForm');
    const register = document.getElementById('registerForm');

    if (type === 'login') {
        login.classList.toggle('hidden');
        register.classList.add('hidden');
    } else {
        register.classList.toggle('hidden');
        login.classList.add('hidden');
    }
}

/*  BOTONES */
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

loginBtn.addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const pwd = document.getElementById('loginPassword').value;

    const result = login(email, pwd);

    if (result.success) {
        loginBtn.disabled = true; //  lo bloquea
        loginBtn.innerText = "Entrando...";
    }

    document.getElementById('loginMessage').innerText = result.msg;
});

registerBtn.addEventListener('click', () => {
    const email = document.getElementById('regEmail').value;
    const pwd = document.getElementById('regPassword').value;

    const result = register(email, pwd);

    if (result.success) {
        registerBtn.style.display = "none"; //  desaparece
    }

    document.getElementById('regMessage').innerText = result.msg;
});

const boton1 = document.getElementById("boton1");
const boton2 = document.getElementById("boton2");

boton1.addEventListener("click", () => {
    boton1.classList.add("hidden");   // se oculta
    boton2.classList.remove("hidden"); // el otro aparece
});

boton2.addEventListener("click", () => {
    boton2.classList.add("hidden");
    boton1.classList.remove("hidden");
});