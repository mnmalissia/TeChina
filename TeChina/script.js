    // Gestión de usuarios en localStorage
    const USERS_KEY = 'aura_users';

    function getUsers() {
        const stored = localStorage.getItem(USERS_KEY);
        return stored ? JSON.parse(stored) : {};
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function register(email, password) {
        const users = getUsers();
        if (!email || !password) return { success: false, msg: 'Completa todos los campos.' };
        if (!email.includes('@')) return { success: false, msg: 'Ingresa un correo válido.' };
        if (password.length < 6) return { success: false, msg: 'La contraseña debe tener al menos 6 caracteres.' };
        if (users[email]) return { success: false, msg: 'El correo ya está registrado.' };
        users[email] = { password: password };
        saveUsers(users);
        return { success: true, msg: 'Registro exitoso. Ahora inicia sesión.' };
    }

    function login(email, password) {
        const users = getUsers();
        if (!users[email]) return { success: false, msg: 'Usuario no registrado.' };
        if (users[email].password !== password) return { success: false, msg: 'Contraseña incorrecta.' };
        // guardar sesión
        sessionStorage.setItem('aura_session', JSON.stringify({ email: email, loggedIn: true }));
        return { success: true, msg: 'Ingresando al sistema...' };
    }

    // UI eventos
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginMsg = document.getElementById('loginMessage');
    const regMsg = document.getElementById('regMessage');

    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value.trim();
        const pwd = document.getElementById('loginPassword').value;
        const result = login(email, pwd);
        if (result.success) {
            loginMsg.innerHTML = `<span class="success">✅ ${result.msg}</span>`;
            // Redirigir después de un breve retraso
            setTimeout(() => {
                window.location.href = 'principal.html';
            }, 800);
        } else {
            loginMsg.innerHTML = `<span class="error">❌ ${result.msg}</span>`;
        }
    });

    registerBtn.addEventListener('click', () => {
        const email = document.getElementById('regEmail').value.trim();
        const pwd = document.getElementById('regPassword').value;
        const result = register(email, pwd);
        if (result.success) {
            regMsg.innerHTML = `<span class="success">✅ ${result.msg}</span>`;
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
        } else {
            regMsg.innerHTML = `<span class="error">❌ ${result.msg}</span>`;
        }
    });