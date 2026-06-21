/* ------------------------------------------
   VERIFICACIÓN DE SESIÓN (LÍNEAS 1-12)
   ------------------------------------------ */

// Esta sección se ejecuta inmediatamente al cargar principal.html
// Verifica que el usuario haya iniciado sesión correctamente

const session = sessionStorage.getItem('aura_session');

if (!session) {
    // Si no hay sesión, redirigir al login
    window.location.href = 'index.html';
} else {
    // Si existe sesión, verificar que sea válida
    try {
        const sessionData = JSON.parse(session);
        if (!sessionData.loggedIn) {
            throw new Error();
        }
    } catch(e) {
        // Si los datos son inválidos, redirigir al login
        window.location.href = 'index.html';
    }
}

/* ------------------------------------------
   CIERRE DE SESIÓN (LÍNEAS 14-18)
   ------------------------------------------ */

// Event Listener para el botón de cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
    // Eliminar la sesión del sessionStorage
    sessionStorage.removeItem('aura_session');
    
    // Redirigir al login
    window.location.href = 'index.html';
});





/* ------------------------------------------
   BOTÓN CERRAR PANEL (LÍNEAS 232-237)
   ------------------------------------------ */

// Event Listener para el botón de cerrar el panel informativo
closeBtn.addEventListener('click', () => {
    // Restablecer contenido del panel a su estado inicial
    panelTitle.innerText = 'Bienvenido, Director';
    panelContent.innerHTML = `<p style="color:#4a627a;">✨ Selecciona una opción para visualizar información detallada. <br>Pasa el mouse sobre las tarjetas para conocer más.</p>`;
});

/* ------------------------------------------
   INICIALIZACIÓN (LÍNEAS 239)
   ------------------------------------------ */

// Ejecutar configuración de acciones al cargar la página
setupCardActions();
