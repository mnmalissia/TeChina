/* ==========================================
   REFERENCIAS AL DOM
   ========================================== */
const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');
const closeBtn = document.getElementById('closePanelBtn');

/* ==========================================
   VERIFICACIÓN DE SESIÓN
   ========================================== */
const session = sessionStorage.getItem('aura_session');

if (!session) {
    window.location.href = 'index.html';
} else {
    try {
        const sessionData = JSON.parse(session);
        if (!sessionData.loggedIn) {
            throw new Error();
        }
        window.NOMBRE_USUARIO = sessionData.user;
        window.ROL_USUARIO = sessionData.rol;
    } catch(e) {
        window.location.href = 'index.html';
    }
}

const SALUDO = (typeof window.NOMBRE_USUARIO === 'string' && window.NOMBRE_USUARIO)
    ? window.NOMBRE_USUARIO
    : 'Director';
if (panelTitle) panelTitle.innerText = 'Bienvenido, ' + SALUDO;

/* ==========================================
   CIERRE DE SESIÓN
   Borra la sesión de PHP (cookie) y la del cliente. Sin la
   llamada al servidor, la cookie sobrevive y el rol sigue vigente.
   ========================================== */
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await fetch(API_BASE + '/logout.php', { method: 'POST' });
    } catch (e) {
        console.warn('No se pudo cerrar la sesión en el servidor:', e);
    }
    sessionStorage.removeItem('aura_session');
    window.location.href = 'index.html';
});

/* ==========================================
   CERRAR PANEL
   ========================================== */
closeBtn?.addEventListener('click', () => {
    panelTitle.innerText = 'Bienvenido, ' + SALUDO;
    panelContent.innerHTML = `<p style="color:#4a627a;">✨ Selecciona una opción para visualizar información detallada. <br>Pasa el mouse sobre las tarjetas para conocer más.</p>`;
});

/* ==========================================
   URL DE GOOGLE SHEETS PARA IMÁGENES
   ========================================== */
const DRIVE_IMAGES_SHEET = '';

/* ==========================================
   DATOS DE EJEMPLO - WHATSAPP
   ========================================== */
const contactosRepresentantes = [
];

/* ==========================================
   DATOS DE EJEMPLO (cuando no funcione el sheet)
   ========================================== */
const EJEMPLO_IMAGENES = [
    { Nombre: 'Flyer 24 Marzo', Categoría: 'Flyers', URL: 'https://via.placeholder.com/400x300?text=Flyer+24+Marzo', Descripción: 'Flyer conmemorativo' },
    { Nombre: 'Logo Escuela', Categoría: 'Institucional', URL: 'https://via.placeholder.com/400x300?text=Logo+Escuela', Descripción: 'Logo oficial' },
    { Nombre: 'Circular 001', Categoría: 'Circulares', URL: 'https://via.placeholder.com/400x300?text=Circular+001', Descripción: 'Comunicado inicio de curso' },
    { Nombre: 'Foto bandera', Categoría: 'Eventos', URL: 'https://via.placeholder.com/400x300?text=Bandera', Descripción: 'Izamiento bandera' }
];

/* ==========================================
   RENDER IMAGEN
   ========================================== */
function renderImagen() {
    panelTitle.innerText = '🖼️ Buscador de Imágenes';

    panelContent.innerHTML = `
        <div class="drive-search">
            <h4><i class="fas fa-search"></i> Buscar Imágenes</h4>
            <div class="search-box">
                <input type="text" id="imageSearchInput" class="search-input"
                       placeholder="Buscar por nombre o categoría...">
                <button id="searchBtn" class="search-btn">
                    <i class="fas fa-search"></i> Buscar
                </button>
            </div>
            <div id="filterTags" class="filter-tags">
                <button class="filter-tag active" data-category="todas">Todas</button>
            </div>
            <div id="imageResults" class="image-results">
                <p class="loading-text">Cargando imágenes...</p>
            </div>
        </div>
    `;

    loadImagesFromSheet();
    document.getElementById('searchBtn').addEventListener('click', searchImages);
    document.getElementById('imageSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchImages();
    });
}

let allImages = [];

function loadImagesFromSheet() {
    fetch(DRIVE_IMAGES_SHEET)
        .then(res => {
            if (!res.ok) throw new Error('Sheet no disponible');
            return res.json();
        })
        .then(data => {
            allImages = (!data || data.length === 0) ? EJEMPLO_IMAGENES : data;
            renderFilterTags(allImages);
            renderImageGrid(allImages);
        })
        .catch(() => {
            allImages = EJEMPLO_IMAGENES;
            renderFilterTags(allImages);
            renderImageGrid(allImages);
        });
}

function renderFilterTags(images) {
    const filterTags = document.getElementById('filterTags');
    if (!filterTags) return;
    const catSet = new Set();
    images.forEach(img => {
        const cat = img.Categoría || img.Categoria;
        if (cat) catSet.add(cat);
    });
    const categories = ['todas', ...catSet];
    let html = '';
    categories.forEach((cat, i) => {
        html += `<button class="filter-tag ${i === 0 ? 'active' : ''}" data-category="${cat}">${cat}</button>`;
    });
    filterTags.innerHTML = html;
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterByCategory(this.dataset.category);
        });
    });
}

function filterByCategory(category) {
    if (category === 'todas') {
        renderImageGrid(allImages);
    } else {
        renderImageGrid(allImages.filter(img =>
            (img.Categoría || '').toLowerCase() === category.toLowerCase()
        ));
    }
}

function searchImages() {
    const input = document.getElementById('imageSearchInput');
    if (!input) return;
    const query = (input.value || '').toLowerCase().trim();
    if (!query) { renderImageGrid(allImages); return; }
    renderImageGrid(allImages.filter(img => {
        return (img.Nombre || '').toLowerCase().includes(query) ||
               (img.Categoría || '').toLowerCase().includes(query) ||
               (img.Descripción || img.Descripcion || '').toLowerCase().includes(query);
    }));
}

function renderImageGrid(images) {
    const container = document.getElementById('imageResults');
    if (!container) return;
    if (!images || images.length === 0) {
        container.innerHTML = '<p class="load-error">No se encontraron imágenes</p>';
        return;
    }
    let html = '<div class="image-grid">';
    images.forEach(img => {
        const nombre = img.Nombre || 'Sin nombre';
        const categoria = img.Categoría || img.Categoria || '';
        const desc = img.Descripción || img.Descripcion || '';
        const url = img.URL || img.Url || '';
        const placeholder = 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(nombre);
        html += `
            <div class="image-card">
                <img src="${url || placeholder}" alt="${nombre}" onerror="this.src='${placeholder}'">
                <div class="image-info">
                    <div class="image-name">${nombre}</div>
                    ${categoria ? `<div class="image-category">${categoria}</div>` : ''}
                    ${desc ? `<div class="image-desc">${desc}</div>` : ''}
                    ${url ? `<a href="${url}" target="_blank" class="btn-view"><i class="fas fa-external-link-alt"></i> Ver</a>` : ''}
                </div>
            </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

/* ==========================================
   RENDER WHATSAPP
   ========================================== */
function renderWhatsApp() {
    panelTitle.innerText = '📱 WhatsApp Institucional';

    const mensajesPredefinidos = [
        { id: 'saludo',       texto: 'Buenos días, le escribo desde la institución...' },
        { id: 'reunion',      texto: 'Le informo que hay una reunión programada para el jueves' },
        { id: 'recordatorio', texto: 'Le recuerdo que mañana vence el plazo para entregar el permiso de la excursion' },
        { id: 'consulta',     texto: 'Quería consultar que paso con el estudiante porque ayer falto' },
        { id: 'custom', value: 'custom', label: 'Escribir mensaje propio...' }
    ];

    let html = `
        <div class="whatsapp-form">
            <h4><i class="fas fa-paper-plane"></i> Enviar Mensaje por WhatsApp</h4>
            <div class="form-group">
                <label for="contactSelect"><i class="fas fa-user"></i> Seleccionar Contacto:</label>
                <select id="contactSelect" class="form-select">
                    <option value="">-- Elegir contacto --</option>`;

    contactosRepresentantes.forEach(c => {
        html += `<option value="${c.telefono}">${c.nombre} (${c.rol}) - ${c.alumno}</option>`;
    });

    html += `</select></div>
            <div class="form-group">
                <label for="messageSelect"><i class="fas fa-comment"></i> Seleccionar Mensaje:</label>
                <select id="messageSelect" class="form-select">
                    <option value="">-- Elegir mensaje predefinido --</option>`;

    mensajesPredefinidos.forEach(m => {
        if (m.id === 'custom') {
            html += `<option value="${m.value}">${m.label}</option>`;
        } else {
            html += `<option value="${m.texto}">${m.texto.substring(0, 50)}${m.texto.length > 50 ? '...' : ''}</option>`;
        }
    });

    html += `</select></div>
            <div class="form-group" id="customMessageGroup" style="display:none;">
                <label for="customMessage"><i class="fas fa-edit"></i> Mensaje Personalizado:</label>
                <textarea id="customMessage" class="form-textarea" rows="3" placeholder="Escriba su mensaje aquí..."></textarea>
            </div>
            <div class="form-actions">
                <button id="sendWhatsAppBtn" class="btn-send-whatsapp">
                    <i class="fab fa-whatsapp"></i> Enviar por WhatsApp
                </button>
            </div>
        </div>
        <div class="whatsapp-section">

            <div class="contact-list">`;

    contactosRepresentantes.forEach(c => {
        html += `
            <div class="contact-item">
                <div class="contact-name">${c.nombre}</div>
                <div class="contact-role">${c.rol} (${c.alumno})</div>
                <div class="contact-phone"><i class="fab fa-whatsapp"></i> ${c.telefono}</div>
            </div>`;
    });

    html += `</div>
            <p class="privacy-note">ℹ️ Para enviar mensajes use el formulario de arriba.</p>
        </div>`;

    panelContent.innerHTML = html;

    document.getElementById('messageSelect').addEventListener('change', function () {
        const customGroup = document.getElementById('customMessageGroup');
        const customTextarea = document.getElementById('customMessage');
        if (this.value === 'custom') {
            customGroup.style.display = 'block';
            customTextarea.value = '';
            customTextarea.focus();
        } else {
            customGroup.style.display = 'none';
            customTextarea.value = this.value || '';
        }
    });

    document.getElementById('sendWhatsAppBtn').addEventListener('click', function () {
        const telefono = document.getElementById('contactSelect').value;
        const mensajeSelect = document.getElementById('messageSelect').value;
        const customMessage = document.getElementById('customMessage').value.trim();
        if (!telefono) { alert('Por favor seleccione un contacto'); return; }
        const mensaje = mensajeSelect === 'custom' ? customMessage : (mensajeSelect || customMessage);
        if (!mensaje) { alert('Por favor seleccione o escriba un mensaje'); return; }
        const telefonoLimpio = telefono.replace(/\D/g, '');
        window.open(`https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
    });
}

/* ==========================================
   BASE DE DATOS (CRUD GENÉRICO)
   BD: proadb
   Todas las tablas se manejan con el mismo backend
   (api/crud.php), que lee la estructura real de cada
   tabla en MySQL en vez de tener código fijo por tabla.
   ========================================== */
const TABLAS = [
    { id: 'estudiantes',                   label: ' Estudiantes',           icono: 'fas fa-user-graduate' },
    { id: 'cursos',                        label: ' Cursos',                icono: 'fas fa-graduation-cap' },
    { id: 'materias',                      label: ' Materias',              icono: 'fas fa-book' },
    { id: 'profesores',                    label: ' Profesores',           icono: 'fas fa-chalkboard-teacher' },
    { id: 'tutores',                       label: ' Tutores',               icono: 'fas fa-user-friends' },
    { id: 'estudiantes_tutores',           label: ' Estudiantes-Tutores',   icono: 'fas fa-link' },
    { id: 'aulas',                         label: ' Aulas',                 icono: 'fas fa-door-open' },
    { id: 'horarios',                      label: ' Horarios',              icono: 'fas fa-clock' },
    { id: 'inventarioelementosgenerales',  label: ' Inventario General',    icono: 'fas fa-boxes' },
    { id: 'inventariolaboratorio',         label: ' Inventario Laboratorio', icono: 'fas fa-flask' },
    { id: 'inventarioventas',              label: ' Inventario Ventas',     icono: 'fas fa-shopping-cart' },
    { id: 'usuarios',              label: 'usuarios',     icono: 'fa-user' }
];

// URL base para todas las llamadas a la API
const API_BASE = '/TeChina/api';

/* ==========================================
   PERMISOS POR ROL
   Los descarga el backend de la tabla roles_permisos usando el rol
   de la SESIÓN (nunca uno que venga en la URL). Solo sirven para
   decidir qué pintar: la puerta real está en crud.php, que responde
   403 igual. Esconder un botón es cortesía, no seguridad.
   ========================================== */
window.PERMISOS = {};

const MODULO_DE_CARD = {
    whatsapp: 'card_whatsapp',
    BasedeDatos: 'card_basededatos',
    imagen: 'card_imagen',
    guia: 'card_guia'
};

function puede(modulo, accion = 'listar') {
    return (window.PERMISOS[modulo]?.[accion] ?? 0) === 1;
}

function puedeVerModulo(modulo) {
    const p = window.PERMISOS[modulo];
    return !!p && Object.values(p).some(v => v === 1);
}

async function cargarPermisos() {
    try {
        const res = await fetch(API_BASE + '/permisos.php');

        if (res.status === 401) {
            sessionStorage.removeItem('aura_session');
            window.location.href = 'index.html';
            return false;
        }

        const data = await res.json();
        if (data.success) window.PERMISOS = data.modulos || {};
        return true;
    } catch (e) {
        console.warn('No se pudieron cargar los permisos:', e);
        return false;
    }
}

// Esconde las tarjetas del dashboard que el rol no puede usar
function aplicarPermisosACards() {
    document.querySelectorAll('.card').forEach(card => {
        const mod = MODULO_DE_CARD[card.getAttribute('data-action')];
        if (mod && !puedeVerModulo(mod)) card.remove();
    });
}

let tablaActiva  = null;
let editandoPK   = null;   // objeto con la/s clave/s primaria/s de la fila que se está editando (null = se está agregando una nueva)

// Cache de la estructura de cada tabla (columnas, tipos, claves, foreign keys),
// para no tener que pedirla de nuevo cada vez que se abre el formulario
const columnasCache = {};

/* ==========================================
   RENDER BASE DE DATOS MYSQL
   ========================================== */
function renderBasedeDatos() {
    panelTitle.innerText = '🗄️ Base de Datos';

    const botonesHtml = TABLAS
        .filter(t => puedeVerModulo(t.id))   // el rol decide qué módulos se ven
        .map(t => `
            <button class="db-module-btn" onclick="abrirTabla('${t.id}', this)">
                <i class="${t.icono}"></i>
                <span>${t.label}</span>
            </button>
        `).join('');

    panelContent.innerHTML = `
        <div class="db-wrapper">
            <div class="db-modules">${botonesHtml}</div>

            <div id="db-main" class="db-main db-oculto">

                <div class="db-toolbar">
                    <h4 id="db-titulo"></h4>
                    <div class="db-actions">
                        <input type="text" id="db-buscar"
                               placeholder="🔍 Buscar..."
                               oninput="dbBuscar()">
                        <button class="db-btn-add" onclick="dbMostrarFormulario()">
                            <i class="fas fa-plus"></i> Agregar
                        </button>
                    </div>
                </div>

                <div id="db-form" class="db-form db-oculto">
                    <div id="db-form-campos" class="db-form-campos"></div>
                    <div class="db-form-btns">
                        <button class="db-btn-save" onclick="dbGuardar()">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                        <button class="db-btn-cancel" onclick="dbCancelarForm()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>

                <div class="db-tabla-wrap">
                    <table class="db-tabla">
                        <thead id="db-thead"></thead>
                        <tbody id="db-tbody"></tbody>
                    </table>
                </div>

            </div>
        </div>
    `;
}

/* — Trae y cachea la estructura (columnas) de una tabla — */
async function cargarColumnas(tabla) {
    const res = await fetch(`${API_BASE}/crud.php?tabla=${tabla}&accion=columnas`);

    // 401 = la sesión de PHP ya no sirve (logout, cookie vencida).
    if (res.status === 401) {
        sessionStorage.removeItem('aura_session');
        window.location.href = 'index.html';
        throw new Error('Sesión vencida');
    }

    const columnas = await res.json();

    // El backend devuelve un ARRAY cuando todo bien y un {error: ...} cuando no.
    // Sin esta comprobación, un error se cachea como si fueran columnas y
    // después columnas.filter() revienta con TypeError.
    if (!Array.isArray(columnas)) throw new Error(columnas.error || 'Estructura inválida');

    columnasCache[tabla] = columnas;
    return columnas;
}

/* — Deduce qué tipo de <input> conviene según el tipo de columna en MySQL — */
function tipoInputDesdeColumna(col) {
    const tipo = col.Type.toLowerCase();
    if (tipo.startsWith('enum')) return 'select';
    if (tipo.includes('date'))    return 'date';
    if (/int|decimal|float|double/.test(tipo)) return 'number';
    if (/correo|email/i.test(col.Field)) return 'email';
    return 'text';
}

/* — Saca los valores de un ENUM: "enum('a','b')" → ['a','b'] — */
function valoresEnum(col) {
    const m = col.Type.match(/'([^']+)'/g);
    return m ? m.map(v => v.replace(/'/g, '')) : [];
}

/* — Abrir tabla — */
async function abrirTabla(tabla, btn) {
    tablaActiva = tabla;
    editandoPK  = null;
    document.querySelectorAll('.db-module-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('db-main').classList.remove('db-oculto');
    document.getElementById('db-titulo').textContent =
        TABLAS.find(t => t.id === tabla)?.label || tabla;
    dbCancelarForm();

    // El botón Agregar depende de la tabla activa, no del rol entero
    const btnAdd = document.querySelector('.db-btn-add');
    if (btnAdd) btnAdd.style.display = puede(tabla, 'agregar') ? '' : 'none';

    if (!columnasCache[tabla]) {
        try {
            await cargarColumnas(tabla);
        } catch (e) {
            console.error('No se pudo leer la estructura de la tabla:', e);
        }
    }
    dbListar();
}

/* — LISTAR — */
async function dbListar() {
    document.getElementById('db-tbody').innerHTML =
        '<tr><td colspan="99" class="db-loading">⏳ Cargando...</td></tr>';
    try {
        const res   = await fetch(`${API_BASE}/crud.php?tabla=${tablaActiva}&accion=listar`);
        const texto = await res.text();
        let data;
        try {
            data = JSON.parse(texto);
        } catch (parseErr) {
            console.error('Respuesta no-JSON del servidor (listar):', texto);
            throw parseErr;
        }
        dbRenderTabla(data);
    } catch (e) {
        document.getElementById('db-tbody').innerHTML =
            '<tr><td colspan="99" class="db-error">❌ Error al conectar con el servidor (ver consola).</td></tr>';
    }
}

/* — BUSCAR — */
async function dbBuscar() {
    const q = document.getElementById('db-buscar').value;
    if (q.length === 0) { dbListar(); return; }
    if (q.length < 2)   return;
    try {
        const res  = await fetch(`${API_BASE}/crud.php?tabla=${tablaActiva}&accion=buscar&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        dbRenderTabla(data);
    } catch (e) {}
}

/* — RENDER TABLA — */
function dbRenderTabla(data) {
    const thead = document.getElementById('db-thead');
    const tbody = document.getElementById('db-tbody');

    if (!data || data.length === 0) {
        thead.innerHTML = '';
        tbody.innerHTML = '<tr><td colspan="99" class="db-empty">Sin resultados</td></tr>';
        return;
    }

    // nombres de las columnas que forman la clave primaria de esta tabla
    // (puede ser una sola, como IdEstudiante, o varias en una tabla intermedia)
    const columnas      = columnasCache[tablaActiva] || [];
    const clavesNombres = columnas.filter(c => c.esClavePrimaria).map(c => c.Field);

    const cols = Object.keys(data[0]);

    // La columna Acciones solo existe si el rol puede hacer algo con la fila.
    // El botón de la barra (Agregar) se ajusta en abrirTabla().
    const puedeEditar   = puede(tablaActiva, 'editar');
    const puedeEliminar = puede(tablaActiva, 'eliminar');
    const muestraAcciones = puedeEditar || puedeEliminar;

    thead.innerHTML = '<tr>' + cols.map(c => `<th>${c}</th>`).join('')
        + (muestraAcciones ? '<th>Acciones</th>' : '') + '</tr>';

    tbody.innerHTML = data.map(fila => {
        const pk = {};
        clavesNombres.forEach(k => pk[k] = fila[k]);

        const botones =
            (puedeEditar ? `
                <button class="db-btn-edit" title="Editar"
                        onclick='dbEditar(${JSON.stringify(fila)})'>
                    <i class="fas fa-pencil-alt"></i>
                </button>` : '')
            + (puedeEliminar ? `
                <button class="db-btn-del" title="Eliminar"
                        onclick='dbEliminar(${JSON.stringify(pk)})'>
                    <i class="fas fa-trash"></i>
                </button>` : '');

        return `
        <tr>
            ${cols.map(c => `<td>${fila[c] ?? ''}</td>`).join('')}
            ${muestraAcciones ? `<td class="db-acciones">${botones}</td>` : ''}
        </tr>`;
    }).join('');
}

/* — MOSTRAR FORMULARIO —
   Arma los campos del formulario solo, según la estructura real de la
   tabla activa. Las columnas que son foreign key (ej: IdCurso en
   estudiantes) se muestran como un <select> con los datos reales de la
   tabla referenciada, para no permitir guardar un valor que no exista. */
async function dbMostrarFormulario(datos = {}) {
    document.getElementById('db-form').classList.remove('db-oculto');
    const contenedor = document.getElementById('db-form-campos');
    contenedor.innerHTML = '<p class="db-loading">⏳ Cargando formulario...</p>';

    // Sin try/catch, si cargarColumnas tira (por ejemplo un 403) la función
    // aborta acá y el formulario queda clavado en "Cargando formulario..."
    let columnas;
    try {
        columnas = columnasCache[tablaActiva] || await cargarColumnas(tablaActiva);
    } catch (e) {
        contenedor.innerHTML = '<p class="db-error">❌ No se pudo abrir el formulario: '
            + (e.message || 'error desconocido') + '</p>';
        return;
    }
    // no mostramos las columnas auto-incrementales (el ID lo genera la base sola)
    const campos = columnas.filter(c => !c.esAutoIncremental);

    contenedor.innerHTML = campos.map(c => {
        const label = c.Field.replace(/_/g, ' ');
        if (c.tablaReferenciada) {
            return `
                <div class="db-field">
                    <label>${label}</label>
                    <select name="${c.Field}" id="db-select-${c.Field}">
                        <option value="">Cargando...</option>
                    </select>
                </div>`;
        }
        // ENUM → <select> con los valores exactos que acepta MySQL.
        // Como input de texto libre, escribir "activado" en vez de "activo"
        // hace que la base tire error 1265 y la pantalla muestre un 500.
        const tipo  = tipoInputDesdeColumna(c);
        const actual = datos[c.Field] ?? '';

        if (tipo === 'select') {
            return `
                <div class="db-field">
                    <label>${label}</label>
                    <select name="${c.Field}">
                        ${valoresEnum(c).map(v =>
                            `<option value="${v}"${v === actual ? ' selected' : ''}>${v}</option>`
                        ).join('')}
                    </select>
                </div>`;
        }
        return `
            <div class="db-field">
                <label>${label}</label>
                <input type="${tipo}" name="${c.Field}"
                       value="${actual}"
                       placeholder="${label}...">
            </div>`;
    }).join('');

    // Poblar cada <select> de foreign key con los datos de la tabla
    // referenciada. Las consultas salen en paralelo: con await adentro del
    // for eran en serie, y horarios tiene 4 FKs (curso, profesor, materia,
    // aula), o sea 4 viajes HTTP encadenados. Promise.all los convierte en
    // uno solo.
    const fks = campos.filter(c => c.tablaReferenciada);

    await Promise.all(fks.map(async c => {
        const select = document.getElementById(`db-select-${c.Field}`);
        if (!select) return;

        try {
            const res   = await fetch(`${API_BASE}/crud.php?tabla=${c.tablaReferenciada}&accion=listar`);

            if (res.status === 401) {
                sessionStorage.removeItem('aura_session');
                window.location.href = 'index.html';
                return;
            }

            const filas = await res.json();
            if (!Array.isArray(filas) || filas.length === 0) {
                select.innerHTML = '<option value="">-- Sin datos cargados --</option>';
                return;
            }

            const valorActual = datos[c.Field] ?? '';
            select.innerHTML = '<option value="">-- Elegir --</option>' + filas.map(fila => {
                const valor = fila[c.columnaReferenciada];
                // usamos el primer campo que no sea el id como texto visible de la opción
                const labelKey = Object.keys(fila).find(k => k !== c.columnaReferenciada);
                const texto    = labelKey ? fila[labelKey] : `#${valor}`;
                const selected = String(valor) === String(valorActual) ? 'selected' : '';
                return `<option value="${valor}" ${selected}>${texto}</option>`;
            }).join('');
        } catch (e) {
            console.error(`No se pudo cargar ${c.tablaReferenciada}:`, e);
            select.innerHTML = '<option value="">⚠️ Error al cargar</option>';
        }
    }));
}

/* — EDITAR — */
function dbEditar(fila) {
    const columnas = columnasCache[tablaActiva] || [];
    editandoPK = {};
    columnas.filter(c => c.esClavePrimaria).forEach(c => editandoPK[c.Field] = fila[c.Field]);
    dbMostrarFormulario(fila);
    document.getElementById('db-form').scrollIntoView({ behavior: 'smooth' });
}

/* — GUARDAR — */
async function dbGuardar() {
    if (!tablaActiva) { alert('Error: no hay tabla seleccionada.'); return; }

    const campos = document.querySelectorAll('#db-form-campos input, #db-form-campos select');
    const datos  = {};
    campos.forEach(i => { datos[i.name] = i.value; });

    const accion = editandoPK ? 'editar' : 'agregar';
    if (editandoPK) Object.assign(datos, editandoPK); // agrega la/s clave/s para identificar la fila a actualizar

    try {
        const res = await fetch(`${API_BASE}/crud.php`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ accion, tabla: tablaActiva, ...datos })
        });
        const texto = await res.text();
        let result;
        try {
            result = JSON.parse(texto);
        } catch (parseErr) {
            console.error('Respuesta no-JSON del servidor:', texto);
            alert('❌ Error al guardar. El servidor no devolvió una respuesta válida (ver consola para más detalle).');
            return;
        }
        alert(result.mensaje || result.error || 'Guardado');
        dbCancelarForm();
        dbListar();
    } catch (e) {
        console.error('Error de red al guardar:', e);
        alert('❌ Error al guardar. No se pudo contactar al servidor (ver consola).');
    }
}

/* — ELIMINAR — */
async function dbEliminar(pk) {
    if (!tablaActiva) return;
    if (!confirm('¿Eliminar este registro?')) return;
    try {
        const res = await fetch(`${API_BASE}/crud.php`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ accion: 'eliminar', tabla: tablaActiva, ...pk })
        });
        const result = await res.json();
        alert(result.mensaje || result.error || 'Eliminado');
        dbListar();
    } catch (e) {
        alert('❌ Error al eliminar.');
    }
}

/* — CANCELAR FORMULARIO — */
function dbCancelarForm() {
    editandoPK = null;
    const form   = document.getElementById('db-form');
    const campos = document.getElementById('db-form-campos');
    if (form)   form.classList.add('db-oculto');
    if (campos) campos.innerHTML = '';
}

/* ==========================================
   RENDER GUÍA
   ========================================== */
function renderGuia() {
    panelTitle.innerText = '📘 Guía de Funciones';
    panelContent.innerHTML = `
        <div class="guide-step">
            <h4><i class="fab fa-whatsapp"></i> WhatsApp</h4>
            <iframe width="560" height="315" src="https://www.youtube.com/embed/aABU_YO1MZo?si=PPPVZFDPNXAgLbNv" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
        <div class="guide-step">
            <h4><i class="fas fa-images"></i> Base de datos</h4>
            <iframe width="560" height="315" src="https://www.youtube.com/embed/aABU_YO1MZo?si=PPPVZFDPNXAgLbNv" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>        
        </div>
        <div class="guide-step">
            <h4><i class="fas fa-images"></i> Imágenes</h4>
            <iframe width="560" height="315" src="https://www.youtube.com/embed/aABU_YO1MZo?si=PPPVZFDPNXAgLbNv" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>        
        </div>
        <div class="guide-step">
            <h4><i class="fas fa-compass"></i> Guía</h4>
            <iframe width="560" height="315" src="https://www.youtube.com/embed/aABU_YO1MZo?si=PPPVZFDPNXAgLbNv" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>        
        </div>
    `;
}

/* ==========================================
   CONFIGURAR ACCIONES DE TARJETAS
   ========================================== */
function setupCardActions() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = card.getAttribute('data-action');
            if      (action === 'whatsapp')    renderWhatsApp();
            else if (action === 'BasedeDatos') renderBasedeDatos();
            else if (action === 'imagen')      renderImagen();
            else if (action === 'guia')        renderGuia();
        });
    });
}

// Inicializar
(async () => {
    // Los permisos tienen que estar antes de pintar nada: si se filtrara
    // antes de que llegue la respuesta, un Director vería el módulo
    // usuarios destellando y después desaparecería.
    await cargarPermisos();
    aplicarPermisosACards();
    setupCardActions();
})();