/* ==========================================
   REFERENCIAS AL DOM
   ========================================== */
const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');
const closeBtn = document.getElementById('closePanelBtn');

/* ==========================================
   URL DE GOOGLE SHEETS PARA IMÁGENES
   ========================================== */
const DRIVE_IMAGES_SHEET = '';

/* ==========================================
   DATOS DE EJEMPLO - WHATSAPP
   ========================================== */
const contactosRepresentantes = [
    { nombre: "María Gutiérrez", rol: "Tutora 1°A", telefono: "+54 9 11 2345-6789", alumno: "Lucas G." },
    { nombre: "Roberto Fernández", rol: "Tutor 1°B", telefono: "+54 9 11 3456-7890", alumno: "Camila F." },
    { nombre: "Laura Méndez", rol: "Representante 2°A", telefono: "+54 9 11 4567-8901", alumno: "Joaquín M." },
    { nombre: "Carlos Paredes", rol: "Tutor 2°B", telefono: "+54 9 11 5678-9012", alumno: "Sofía P." }
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
            <h4><i class="fas fa-address-book"></i> Directorio de Contactos</h4>
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
    { id: 'estudiantes',                   label: '🎓 Estudiantes',           icono: 'fas fa-user-graduate' },
    { id: 'cursos',                        label: '📚 Cursos',                icono: 'fas fa-graduation-cap' },
    { id: 'materias',                      label: '📖 Materias',              icono: 'fas fa-book' },
    { id: 'profesores',                    label: '👨‍🏫 Profesores',           icono: 'fas fa-chalkboard-teacher' },
    { id: 'tutores',                       label: '👪 Tutores',               icono: 'fas fa-user-friends' },
    { id: 'estudiantes_tutores',           label: '🔗 Estudiantes-Tutores',   icono: 'fas fa-link' },
    { id: 'aulas',                         label: '🏫 Aulas',                 icono: 'fas fa-door-open' },
    { id: 'horarios',                      label: '🕒 Horarios',              icono: 'fas fa-clock' },
    { id: 'inventarioelementosgenerales',  label: '📦 Inventario General',    icono: 'fas fa-boxes' },
    { id: 'inventariolaboratorio',         label: '🧪 Inventario Laboratorio', icono: 'fas fa-flask' },
    { id: 'inventarioventas',              label: '🛒 Inventario Ventas',     icono: 'fas fa-shopping-cart' }
];

// URL base para todas las llamadas a la API
const API_BASE = '/TeChina/api';

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

    const botonesHtml = TABLAS.map(t => `
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
    const columnas = await res.json();
    columnasCache[tabla] = columnas;
    return columnas;
}

/* — Deduce qué tipo de <input> conviene según el tipo de columna en MySQL — */
function tipoInputDesdeColumna(col) {
    const tipo = col.Type.toLowerCase();
    if (tipo.includes('date'))    return 'date';
    if (/int|decimal|float|double/.test(tipo)) return 'number';
    if (/correo|email/i.test(col.Field)) return 'email';
    return 'text';
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
    thead.innerHTML = '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '<th>Acciones</th></tr>';
    tbody.innerHTML = data.map(fila => {
        const pk = {};
        clavesNombres.forEach(k => pk[k] = fila[k]);
        return `
        <tr>
            ${cols.map(c => `<td>${fila[c] ?? ''}</td>`).join('')}
            <td class="db-acciones">
                <button class="db-btn-edit" title="Editar"
                        onclick='dbEditar(${JSON.stringify(fila)})'>
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="db-btn-del" title="Eliminar"
                        onclick='dbEliminar(${JSON.stringify(pk)})'>
                    <i class="fas fa-trash"></i>
                </button>
            </td>
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

    const columnas = columnasCache[tablaActiva] || await cargarColumnas(tablaActiva);
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
        const tipo = tipoInputDesdeColumna(c);
        return `
            <div class="db-field">
                <label>${label}</label>
                <input type="${tipo}" name="${c.Field}"
                       value="${datos[c.Field] ?? ''}"
                       placeholder="${label}...">
            </div>`;
    }).join('');

    // poblar cada <select> de foreign key con los datos reales de la tabla referenciada
    for (const c of campos) {
        if (!c.tablaReferenciada) continue;
        const select = document.getElementById(`db-select-${c.Field}`);
        try {
            const res   = await fetch(`${API_BASE}/crud.php?tabla=${c.tablaReferenciada}&accion=listar`);
            const filas = await res.json();
            if (!Array.isArray(filas) || filas.length === 0) {
                select.innerHTML = '<option value="">-- Sin datos cargados --</option>';
                continue;
            }
            const valorActual = datos[c.Field] ?? '';
            select.innerHTML = '<option value="">-- Elegir --</option>' + filas.map(fila => {
                const valor    = fila[c.columnaReferenciada];
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
    }
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
            <p>Envía mensajes predefinidos a representantes y tutores. Selecciona contacto, elegir o escribir mensaje, y enviar por WhatsApp.</p>
        </div>
        <div class="guide-step">
            <h4><i class="fas fa-database"></i> Base de datos</h4>
            <p>Carga datos desde la base de datos MySQL (proadb). Podés listar, buscar, agregar, editar y eliminar estudiantes.</p>
        </div>
        <div class="guide-step">
            <h4><i class="fas fa-images"></i> Imágenes</h4>
            <p>Busca imágenes almacenadas en Drive. Filtra por categoría o busca por nombre.</p>
        </div>
        <div class="guide-step">
            <h4><i class="fas fa-compass"></i> Guía</h4>
            <p>Estás en ella. Explicación de cada módulo del sistema AURA.</p>
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
setupCardActions();