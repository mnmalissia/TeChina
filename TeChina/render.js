/* ==========================================
   REFERENCIAS AL DOM
   ========================================== */
const panelTitle = document.getElementById('panelTitle');
const panelContent = document.getElementById('panelContent');
const closeBtn = document.getElementById('closePanelBtn');



/* ==========================================
   URL DE GOOGLE SHEETS PARA IMÁGENES
   IMPORTANTE: El sheet debe estar publicado en la web (Archivo → Publicar en la web)
   y tener "Acceso general: Cualquiera con el enlace"
   ========================================== */
const DRIVE_IMAGES_SHEET = '';
/*https://opensheet.elk.sh/2PACX-1vT1oyGRpf2YGthO4yA9Mg1vRozEQwv2zeSDQAmObdWPnNUrCkgJgJDWvXo3vivkkqVwRF2z78mJXEQC/Hoja1
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
   RENDER IMAGEN - CON PESTAÑAS (LÍNEAS 268-360)
   ========================================== */

/**
 * renderImagen()
 * Solo buscador de imágenes de Drive
 */
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
    
    // Cargar imágenes desde el sheet
    loadImagesFromSheet();
    
    // Event listener búsqueda
    document.getElementById('searchBtn').addEventListener('click', searchImages);
    document.getElementById('imageSearchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchImages();
    });
}

/**
 * loadImagesFromSheet() - Carga imágenes desde Google Sheets
 * Usa datos de ejemplo si falla el sheet
 */
let allImages = [];

function loadImagesFromSheet() {
    fetch(DRIVE_IMAGES_SHEET)
        .then(res => {
            if (!res.ok) throw new Error('Sheet no disponible');
            return res.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                console.warn('Sheet vacío, usando datos de ejemplo');
                allImages = EJEMPLO_IMAGENES;
            } else {
                allImages = data;
            }
            renderFilterTags(allImages);
            renderImageGrid(allImages);
        })
        .catch(err => {
            console.warn('Error cargando sheet, usando datos de ejemplo:', err);
            allImages = EJEMPLO_IMAGENES;
            renderFilterTags(allImages);
            renderImageGrid(allImages);
        });
}

/**
 * renderFilterTags() - Genera botones de categoría
 */
function renderFilterTags(images) {
    const filterTags = document.getElementById('filterTags');
    if (!filterTags) return;
    
    // Extraer categorías únicas (soporta both "Categoría" and "Categoria")
    const catSet = new Set();
    images.forEach(img => {
        const cat = img.Categoría || img.Categoria;
        if (cat) catSet.add(cat);
    });
    
    const categories = ['todas', ...catSet];
    
    let html = '';
    categories.forEach((cat, i) => {
        const active = i === 0 ? 'active' : '';
        html += `<button class="filter-tag ${active}" data-category="${cat}">${cat}</button>`;
    });
    
    filterTags.innerHTML = html;
    
    // Event listeners
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterByCategory(this.dataset.category);
        });
    });
}

/**
 * filterByCategory() - Filtra por categoría
 */
function filterByCategory(category) {
    if (category === 'todas') {
        renderImageGrid(allImages);
    } else {
        // Buscar sin importar mayúsculas/minúsculas
        const filtered = allImages.filter(img => 
            (img.Categoría || '').toLowerCase() === category.toLowerCase()
        );
        renderImageGrid(filtered);
    }
}

/**
 * searchImages() - Busca por texto
 */
function searchImages() {
    const input = document.getElementById('imageSearchInput');
    if (!input) return;
    
    const query = (input.value || '').toLowerCase().trim();
    
    if (!query) {
        renderImageGrid(allImages);
        return;
    }
    
    const filtered = allImages.filter(img => {
        const nombre = (img.Nombre || '').toLowerCase();
        const categoria = (img.Categoría || '').toLowerCase();
        const desc = (img.Descripción || img.Descripcion || '').toLowerCase();
        return nombre.includes(query) || categoria.includes(query) || desc.includes(query);
    });
    
    renderImageGrid(filtered);
}

/**
 * renderImageGrid() - Muestra las imágenes en grid
 */
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
        const placeholderUrl = 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(nombre);
        
        html += `
            <div class="image-card">
                <img src="${url || placeholderUrl}" alt="${nombre}" 
                     onerror="this.src='${placeholderUrl}'">
                <div class="image-info">
                    <div class="image-name">${nombre}</div>
                    ${categoria ? `<div class="image-category">${categoria}</div>` : ''}
                    ${desc ? `<div class="image-desc">${desc}</div>` : ''}
                    ${url ? `<a href="${url}" target="_blank" class="btn-view"><i class="fas fa-external-link-alt"></i> Ver</a>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/* ==========================================
   RENDER WHATSAPP
   ========================================== */

function renderWhatsApp() {
    // Título del panel
    panelTitle.innerText = '📱 WhatsApp Institucional';
    
    // Mensajes predefinidos
    const mensajesPredefinidos = [
        { id: 'saludo', texto: 'Buenos días, le escribo desde la institución...' },
        { id: 'reunion', texto: 'Le informo que hay una reunión programada para el jueves' },
        { id: 'recordatorio', texto: 'Le recuerdo que mañana vence el plazo para entregar el permiso de la excursion' },
        { id: 'consulta', texto: 'Quería consultar que paso con el estudiante porque ayer falto' },
        { id: 'custom', value: 'custom', label: 'Escribir mensaje propio...' }
    ];

    // Construir HTML del formulario
    let html = `
        <div class="whatsapp-form">
            <h4><i class="fas fa-paper-plane"></i> Enviar Mensaje por WhatsApp</h4>
            
            <div class="form-group">
                <label for="contactSelect"><i class="fas fa-user"></i> Seleccionar Contacto:</label>
                <select id="contactSelect" class="form-select">
                    <option value="">-- Elegir contacto --</option>
    `;
    
    // Agregar contactos al select
    contactosRepresentantes.forEach(c => {
        html += `<option value="${c.telefono}">${c.nombre} (${c.rol}) - ${c.alumno}</option>`;
    });
    
    html += `
                </select>
            </div>
            
            <div class="form-group">
                <label for="messageSelect"><i class="fas fa-comment"></i> Seleccionar Mensaje:</label>
                <select id="messageSelect" class="form-select">
                    <option value="">-- Elegir mensaje predefinido --</option>
    `;
    
    // Agregar mensajes predefinidos
    mensajesPredefinidos.forEach(m => {
        if (m.id === 'custom') {
            html += `<option value="${m.value}">${m.label}</option>`;
        } else {
            html += `<option value="${m.texto}">${m.texto.substring(0, 50)}${m.texto.length > 50 ? '...' : ''}</option>`;
        }
    });
    
    html += `
                </select>
            </div>
            
            <div class="form-group" id="customMessageGroup" style="display: none;">
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
            <div class="contact-list">
    `;
    
    // Agregar cada contacto de representante
    contactosRepresentantes.forEach(c => {
        html += `
            <div class="contact-item">
                <div class="contact-name">${c.nombre}</div>
                <div class="contact-role">${c.rol} (${c.alumno})</div>
                <div class="contact-phone"><i class="fab fa-whatsapp"></i> ${c.telefono}</div>
            </div>
        `;
    });
    
    html += `
            </div>
            <p class="privacy-note">ℹ️ Para enviar mensajes use el formulario de arriba.</p>
        </div>
    `;
    
    panelContent.innerHTML = html;

    // Event listeners para el formulario
    document.getElementById('messageSelect').addEventListener('change', function() {
        const customTextarea = document.getElementById('customMessage');
        const customGroup = document.getElementById('customMessageGroup');
        
        if (this.value === 'custom') {
            customGroup.style.display = 'block';
            customTextarea.value = '';
            customTextarea.focus();
        } else if (this.value) {
            customGroup.style.display = 'none';
            customTextarea.value = this.value;
        } else {
            customGroup.style.display = 'none';
            customTextarea.value = '';
        }
    });

    document.getElementById('sendWhatsAppBtn').addEventListener('click', function() {
        const telefono = document.getElementById('contactSelect').value;
        const mensajeSelect = document.getElementById('messageSelect').value;
        const customMessage = document.getElementById('customMessage').value.trim();
        
        if (!telefono) {
            alert('Por favor seleccione un contacto');
            return;
        }
        
        let mensaje = '';
        if (mensajeSelect === 'custom') {
            mensaje = customMessage;
        } else if (mensajeSelect) {
            mensaje = mensajeSelect;
        } else {
            mensaje = customMessage;
        }
        
        if (!mensaje) {
            alert('Por favor seleccione o escriba un mensaje');
            return;
        }
        
        // Abrir WhatsApp con el mensaje
        const telefonoLimpio = telefono.replace(/\D/g, '');
        const urlWhatsApp = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
        window.open(urlWhatsApp, '_blank');
    });
}

/* ==========================================
   RENDER BASE DE DATOS MYSQL
   ========================================== */

function renderBasedeDatos() {

    panelTitle.innerText = '📊 Base de Datos';

    panelContent.innerHTML = `
        <div class="database-module">
            <h4>
                <i class="fas fa-database"></i>
                Base de Datos Institucional
            </h4>

            <p>
                Este módulo utilizará datos obtenidos desde
                MySQL/MariaDB mediante servicios PHP.
            </p>

            <div class="load-error">
                Módulo en desarrollo.
            </div>
        </div>
    `;
}   

/* ==========================================
   RENDER GUÍA
   ========================================== */

function renderGuia() {
    panelTitle.innerText = '📘 Guía de Funciones';
    
    const guideHtml = `
        <div class="guide-step">
            <h4><i class="fab fa-whatsapp"></i> WhatsApp</h4>
            <p>Envía mensajes predefinidos a representantes y tutores. Selecciona contacto, elegir o escribir mensaje, y enviar por WhatsApp.</p>
        </div>
        <div class="guide-step">
            <h4><i class=""></i> Base de datos</h4>
            <p>Carga datos desde la base de datos. Podras buscar datos  almacenados por ejemplo el numero de telefono del tutor de X persona.</p>
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
    panelContent.innerHTML = guideHtml;
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
            
            if (action === 'whatsapp') renderWhatsApp();
            else if (action === 'BasedeDatos') renderBasedeDatos();
            else if (action === 'imagen') renderImagen();
            else if (action === 'guia') renderGuia();
        });
    });
}

// Inicializar
setupCardActions();