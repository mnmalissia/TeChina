    // ========== VERIFICACIÓN DE SESIÓN ==========
    const session = sessionStorage.getItem('aura_session');
    if (!session) {
        window.location.href = 'login.html';
    } else {
        try {
            const sessionData = JSON.parse(session);
            if (!sessionData.loggedIn) throw new Error();
        } catch(e) {
            window.location.href = 'login.html';
        }
    }

    // Cierre de sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('aura_session');
        window.location.href = 'login.html';
    });

    // ------------------- DATA MODEL (simulación realista) -------------------
    const contactosRepresentantes = [
        { nombre: "María Gutiérrez", rol: "Tutora 1°A", telefono: "+54 9 11 2345-6789", alumno: "Lucas G." },
        { nombre: "Roberto Fernández", rol: "Tutor 1°B", telefono: "+54 9 11 3456-7890", alumno: "Camila F." },
        { nombre: "Laura Méndez", rol: "Representante 2°A", telefono: "+54 9 11 4567-8901", alumno: "Joaquín M." },
        { nombre: "Carlos Paredes", rol: "Tutor 2°B", telefono: "+54 9 11 5678-9012", alumno: "Sofía P." },
        { nombre: "Ana Lucero", rol: "Representante 3°A", telefono: "+54 9 11 6789-0123", alumno: "Martín L." },
        { nombre: "Fernanda Suárez", rol: "Tutora 3°B", telefono: "+54 9 11 7890-1234", alumno: "Valentina S." }
    ];

    const gruposWhatsApp = [
        { año: "1er año", enlace: "https://chat.whatsapp.com/Ejemplo1", descripcion: "Grupo padres 1°A + 1°B" },
        { año: "2do año", enlace: "https://chat.whatsapp.com/Ejemplo2", descripcion: "Grupo coordinación 2do año" },
        { año: "3er año", enlace: "https://chat.whatsapp.com/Ejemplo3", descripcion: "Comunicados 3er año" },
        { año: "Equipo directivo", enlace: "https://chat.whatsapp.com/Ejemplo4", descripcion: "Preceptores + directivos" }
    ];

    const profesoresData = [
        { nombre: "Prof. Ana Martínez", materias: "Matemática", años: ["1°A", "1°B", "2°A"] },
        { nombre: "Prof. Javier Costa", materias: "Lengua y Literatura", años: ["2°B", "3°A", "3°B"] },
        { nombre: "Prof. Lucía Ramírez", materias: "Historia, Geografía", años: ["1°A", "2°A", "3°B"] },
        { nombre: "Prof. Daniel Herrera", materias: "Ciencias Naturales", años: ["1°B", "2°B"] }
    ];

    const alumnosData = [
        { nombre: "Lucas Gutiérrez", materiasAdeudadas: ["Matemática", "Física"], extra: "Participa en taller de robótica" },
        { nombre: "Camila Fernández", materiasAdeudadas: ["Lengua"], extra: "Promedio general 8.5" },
        { nombre: "Joaquín Méndez", materiasAdeudadas: ["Historia"], extra: "Necesita apoyo en comprensión lectora" },
        { nombre: "Sofía Paredes", materiasAdeudadas: [], extra: "Alumna destacada en arte" }
    ];

    const infoExtra = {
        horarios: "Turno mañana: 8:00 a 12:30 · Turno tarde: 13:30 a 18:00",
        calendario: "Exámenes finales: Diciembre · Mesas de febrero: 10/02 al 15/02",
        reuniones: "Reunión de padres: 5 de abril, 20 de junio, 10 de octubre",
        directivos: "Directora: Silvia Ramos · Vice: Mariano Suárez"
    };

    // ---------- Funciones de renderizado en el panel ----------
    const panelTitle = document.getElementById('panelTitle');
    const panelContent = document.getElementById('panelContent');
    const closeBtn = document.getElementById('closePanelBtn');

    function renderWhatsApp() {
        panelTitle.innerText = '📱 WhatsApp Institucional';
        let html = `
            <div style="margin-bottom: 1.5rem;">
                <h4><i class="fas fa-user-friends"></i> Representantes y Tutores</h4>
                <div class="contact-list">
        `;
        contactosRepresentantes.forEach(c => {
            html += `
                <div class="contact-item">
                    <div class="contact-name">${c.nombre}</div>
                    <div class="contact-role">${c.rol} (${c.alumno})</div>
                    <div class="contact-phone"><i class="fab fa-whatsapp"></i> ${c.telefono}</div>
                </div>
            `;
        });
        html += `</div><hr style="margin:1.2rem 0;"><h4><i class="fas fa-users"></i> Grupos de WhatsApp por Año</h4><div class="group-list">`;
        gruposWhatsApp.forEach(g => {
            html += `
                <div class="group-item">
                    <span><strong>📌 ${g.año}</strong>: ${g.descripcion}</span>
                    <a href="${g.enlace}" target="_blank" style="background:#25D366; color:white; padding:0.2rem 1rem; border-radius:40px; text-decoration:none; margin-left:auto;">Unirse <i class="fab fa-whatsapp"></i></a>
                </div>
            `;
        });
        html += `</div><p class="mt-3" style="margin-top:1rem; font-size:0.8rem;">⚠️ Los enlaces son simulados para preservar privacidad. En producción se integrarían contactos reales.</p>`;
        panelContent.innerHTML = html;
    }

    function renderExcel() {
        panelTitle.innerText = '📊 Gestión Excel · Datos Académicos';
        const submenuHtml = `
            <div class="sub-option-buttons">
                <button class="sub-option-btn" data-excel="profesores">👩‍🏫 Información de Profesores</button>
                <button class="sub-option-btn" data-excel="alumnos">📚 Información de Alumnos</button>
                <button class="sub-option-btn" data-excel="extra">📋 Info Extra (Horarios/Calendario)</button>
            </div>
            <div id="excelSubContent"></div>
        `;
        panelContent.innerHTML = submenuHtml;
        const excelSubDiv = document.getElementById('excelSubContent');
        function loadExcelSub(option) {
            if(option === 'profesores') {
                let html = `<div class="contact-list">`;
                profesoresData.forEach(p => {
                    html += `<div class="contact-item"><div><strong>${p.nombre}</strong><br>📖 ${p.materias}</div><div>🎓 Imparte en: ${p.años.join(', ')}</div></div>`;
                });
                html += `</div>`;
                excelSubDiv.innerHTML = html;
            } else if(option === 'alumnos') {
                let html = `<div class="contact-list">`;
                alumnosData.forEach(a => {
                    html += `<div class="contact-item"><div><strong>${a.nombre}</strong><br>📘 Adeuda: ${a.materiasAdeudadas.length ? a.materiasAdeudadas.join(', ') : 'Ninguna'}</div><div>📌 ${a.extra}</div></div>`;
                });
                html += `</div>`;
                excelSubDiv.innerHTML = html;
            } else if(option === 'extra') {
                let html = `<div style="background:#eef2ff; padding:1rem; border-radius:1rem;">
                    <p><i class="fas fa-clock"></i> <strong>Horarios:</strong> ${infoExtra.horarios}</p>
                    <p><i class="fas fa-calendar-alt"></i> <strong>Calendario:</strong> ${infoExtra.calendario}</p>
                    <p><i class="fas fa-chalkboard-user"></i> <strong>Reuniones:</strong> ${infoExtra.reuniones}</p>
                    <p><i class="fas fa-user-tie"></i> <strong>Directivos:</strong> ${infoExtra.directivos}</p>
                </div>`;
                excelSubDiv.innerHTML = html;
            }
        }
        loadExcelSub('profesores');
        document.querySelectorAll('[data-excel]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-excel]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadExcelSub(btn.getAttribute('data-excel'));
            });
        });
        document.querySelector('[data-excel="profesores"]')?.classList.add('active');
    }

    function renderImagen() {
        panelTitle.innerText = '🎨 Generador IA de Flyers · 24 de Marzo';
        const flyerHtml = `
            <div class="flyer-card" id="flyerContainer">
                <h2 style="color:#a81c1c;">🕊️ 24 de Marzo</h2>
                <p><strong>Día de la Memoria por la Verdad y la Justicia</strong></p>
                <p style="margin:0.5rem 0;">"Nunca más al olvido, construir memoria es construir futuro."</p>
                <div id="flyerCanvasContainer" style="display:flex; justify-content:center; margin:1rem 0;">
                    <canvas id="flyerCanvas" width="400" height="400" style="max-width:100%; border-radius:24px; box-shadow:0 8px 20px rgba(0,0,0,0.2); background:#fff2e0;"></canvas>
                </div>
                <button id="downloadFlyerBtn" class="download-btn"><i class="fas fa-download"></i> Descargar Flyer (PNG)</button>
                <p style="margin-top:1rem; font-size:0.75rem;">✨ Flyer generado por IA institucional. Puedes compartirlo en redes o grupos.</p>
            </div>
        `;
        panelContent.innerHTML = flyerHtml;

        const canvas = document.getElementById('flyerCanvas');
        const ctx = canvas.getContext('2d');
        function drawFlyer() {
            ctx.clearRect(0, 0, 400, 400);
            const grad = ctx.createLinearGradient(0, 0, 400, 400);
            grad.addColorStop(0, '#fde8cd');
            grad.addColorStop(1, '#ffd9b5');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 400, 400);
            ctx.fillStyle = '#a12a2a';
            ctx.font = 'bold 36px "Plus Jakarta Sans"';
            ctx.fillText("🕊️", 160, 80);
            ctx.font = 'bold 24px "Plus Jakarta Sans"';
            ctx.fillStyle = '#5a2e2e';
            ctx.fillText("24 de MARZO", 100, 150);
            ctx.font = 'bold 18px sans-serif';
            ctx.fillStyle = '#2d3748';
            ctx.fillText("Memoria, Verdad y Justicia", 80, 210);
            ctx.font = '14px monospace';
            ctx.fillStyle = '#4a5568';
            ctx.fillText("Instituciones educativas por la democracia", 70, 270);
            ctx.font = 'italic 12px sans-serif';
            ctx.fillStyle = '#6b2e2e';
            ctx.fillText("Nunca más - 40 años de democracia", 110, 340);
            ctx.strokeStyle = '#b97f44';
            ctx.lineWidth = 4;
            ctx.strokeRect(10, 10, 380, 380);
        }
        drawFlyer();
        document.getElementById('downloadFlyerBtn').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'flyer_24marzo.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    }

    function renderGuia() {
        panelTitle.innerText = '📘 Guía de Funciones · Asistente IA';
        const guideHtml = `
            <div class="guide-step">
                <h4><i class="fab fa-whatsapp"></i> WhatsApp</h4>
                <p>Accede a contactos de representantes/tutores de cada alumno y a los enlaces de grupos por año. Ideal para comunicación directa y ágil con las familias.</p>
            </div>
            <div class="guide-step">
                <h4><i class="fas fa-file-excel"></i> Excel</h4>
                <p>Visualización estructurada de datos académicos: profesores con materias y años asignados, alumnos con materias adeudadas e información extra (horarios, reuniones). Centraliza la gestión.</p>
            </div>
            <div class="guide-step">
                <h4><i class="fas fa-palette"></i> Imagen</h4>
                <p>Genera automáticamente flyers para fechas importantes como el 24 de marzo (Memoria). Puedes descargarlos para difundir en redes sociales o imprimir. Próximamente más templates.</p>
            </div>
            <div class="guide-step">
                <h4><i class="fas fa-compass"></i> Guía</h4>
                <p>Este mismo panel te explica el propósito de cada módulo. Además, al pasar el mouse sobre cada tarjeta (excepto Excel) se expande con una breve descripción. La IA facilita el acceso a la información crítica.</p>
            </div>
            <div class="guide-step">
                <h4><i class="fas fa-crown"></i> Consejos para directores</h4>
                <p>Utiliza los grupos de WhatsApp para difundir circulares, apóyate en la info de profesores para armar suplencias y monitorea el estado académico de alumnos desde el módulo Excel.</p>
            </div>
        `;
        panelContent.innerHTML = guideHtml;
    }

    function setupCardActions() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = card.getAttribute('data-action');
                if (action === 'whatsapp') renderWhatsApp();
                else if (action === 'excel') renderExcel();
                else if (action === 'imagen') renderImagen();
                else if (action === 'guia') renderGuia();
            });
        });
    }

    closeBtn.addEventListener('click', () => {
        panelTitle.innerText = 'Bienvenido, Director';
        panelContent.innerHTML = `<p style="color:#4a627a;">✨ Selecciona una opción para visualizar información detallada. <br>Pasa el mouse sobre las tarjetas para conocer más.</p>`;
    });

    setupCardActions();
