import { db } from "./firebase-config.js";
import { ESTRUCTURA_CATEGORIAS } from "./categorias-data.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const numWhatsApp = ""; // Pon tu número sin el + (ej: 34600000000)

const catalogo = document.getElementById('catalogo');
const sidebarCategorias = document.getElementById('sidebar-categorias');
const mobileNavContent = document.getElementById('mobile-nav-content');
const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
const tituloCategoriaActiva = document.getElementById('titulo-categoria-activa');
const contadorProductos = document.getElementById('contador-productos');
const crumbActual = document.getElementById('crumb-actual');
const selectOrden = document.getElementById('select-orden');
const heroBanner = document.getElementById('hero-banner');

// Modal y Carrito
const modal = document.getElementById('modal-producto');
const modalImgPrincipal = document.getElementById('modal-img-principal');
const modalThumbnails = document.getElementById('modal-thumbnails');
const modalTipo = document.getElementById('modal-tipo');
const modalNombre = document.getElementById('modal-nombre');
const modalPrecio = document.getElementById('modal-precio');
const modalDesc = document.getElementById('modal-desc');
const modalColores = document.getElementById('modal-colores');
const modalTallas = document.getElementById('modal-tallas');
const modalStockStatus = document.getElementById('modal-stock-status');
const labelColorSel = document.getElementById('label-color-sel');
const labelTallaSel = document.getElementById('label-talla-sel');
const btnAddCart = document.getElementById('btn-add-cart');
const btnBuyNow = document.getElementById('btn-buy-now');

const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');

let todosLosProductos = [];
let umbralPocasUnidades = 3; // Valor por defecto si no se ha configurado en Admin
let costoEnvioConfig = 4.95; // Costo del envío
let envioGratisMinConfig = 50.00; // Mínimo para el envío gratis
let filtroActual = { categoria: 'TODOS', subcategoria: null };
let productoActual = null;
let varianteColorActual = null;
let tallaSeleccionada = "";
let carrito = JSON.parse(localStorage.getItem('moda_studio_cart')) || [];

function abrirMenuMovil() { mobileNavOverlay.classList.add('open'); }
function cerrarMenuMovil() { mobileNavOverlay.classList.remove('open'); }

document.getElementById('btn-abrir-menu-movil').addEventListener('click', abrirMenuMovil);
document.getElementById('btn-Categorias-movil-bar').addEventListener('click', abrirMenuMovil);
document.getElementById('btn-cerrar-menu-movil').addEventListener('click', cerrarMenuMovil);
mobileNavOverlay.addEventListener('click', (e) => {
    if (e.target === mobileNavOverlay) cerrarMenuMovil();
});

function inicializarMenusCategorias() {
    const ulRopa = document.getElementById('menu-ropa-principal');
    const ulConfort = document.getElementById('menu-ropa-confort');
    const ulFaldas = document.getElementById('menu-ropa-faldas');

    ESTRUCTURA_CATEGORIAS.ROPA.grupos[0].items.forEach(sub => ulRopa.appendChild(crearItemMenu('ROPA', sub)));
    ESTRUCTURA_CATEGORIAS.ROPA.grupos[1].items.forEach(sub => ulConfort.appendChild(crearItemMenu('ROPA', sub)));
    ESTRUCTURA_CATEGORIAS.ROPA.grupos[2].items.forEach(sub => ulFaldas.appendChild(crearItemMenu('ROPA', sub)));

    const ulCalzado = document.getElementById('menu-calzado');
    ESTRUCTURA_CATEGORIAS.CALZADO.grupos[0].items.forEach(sub => ulCalzado.appendChild(crearItemMenu('CALZADO', sub)));

    const ulComplementos = document.getElementById('menu-complementos');
    ESTRUCTURA_CATEGORIAS.COMPLEMENTOS.grupos[0].items.forEach(sub => ulComplementos.appendChild(crearItemMenu('COMPLEMENTOS', sub)));

    document.querySelectorAll('[data-cat]').forEach(el => {
        el.addEventListener('click', () => {
            const cat = el.getAttribute('data-cat');
            aplicarFiltroCategoria(cat, null);
        });
    });

    construirMenuMovilAcordeon();
    renderizarSidebar();
}

function crearItemMenu(categoria, subcategoria) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = "#catalogo-anchor";
    a.textContent = subcategoria.replace('CONFORT - ', '');
    a.addEventListener('click', () => aplicarFiltroCategoria(categoria, subcategoria));
    li.appendChild(a);
    return li;
}

function construirMenuMovilAcordeon() {
    mobileNavContent.innerHTML = "";

    const btnTodo = document.createElement('button');
    btnTodo.className = 'mobile-cat-direct';
    btnTodo.textContent = 'VER TODA LA COLECCIÓN';
    btnTodo.addEventListener('click', () => {
        aplicarFiltroCategoria('TODOS', null);
        cerrarMenuMovil();
    });
    mobileNavContent.appendChild(btnTodo);

    Object.keys(ESTRUCTURA_CATEGORIAS).forEach(catKey => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-accordion';

        const header = document.createElement('button');
        header.type = 'button';
        header.className = 'mobile-accordion-header';
        header.innerHTML = `<span>${catKey}</span><span class="acc-icon">+</span>`;

        const body = document.createElement('div');
        body.className = 'mobile-accordion-body';

        const verTodoCat = document.createElement('button');
        verTodoCat.type = 'button';
        verTodoCat.className = 'mobile-subcat-link all-cat';
        verTodoCat.textContent = `VER TODO EN ${catKey}`;
        verTodoCat.addEventListener('click', () => {
            aplicarFiltroCategoria(catKey, null);
            cerrarMenuMovil();
            hacerScrollAlCatalogo();
        });
        body.appendChild(verTodoCat);

        ESTRUCTURA_CATEGORIAS[catKey].grupos.forEach(grupo => {
            if (grupo.titulo !== catKey) {
                const groupLabel = document.createElement('div');
                groupLabel.className = 'mobile-group-subtitle';
                groupLabel.textContent = grupo.titulo;
                body.appendChild(groupLabel);
            }

            grupo.items.forEach(sub => {
                const subBtn = document.createElement('button');
                subBtn.type = 'button';
                subBtn.className = 'mobile-subcat-link';
                subBtn.textContent = sub.replace('CONFORT - ', '');
                subBtn.addEventListener('click', () => {
                    aplicarFiltroCategoria(catKey, sub);
                    cerrarMenuMovil();
                    hacerScrollAlCatalogo();
                });
                body.appendChild(subBtn);
            });
        });

        header.addEventListener('click', () => {
            const isOpen = wrapper.classList.toggle('open');
            header.querySelector('.acc-icon').textContent = isOpen ? '−' : '+';
        });

        wrapper.appendChild(header);
        wrapper.appendChild(body);
        mobileNavContent.appendChild(wrapper);
    });

    const btnRebajas = document.createElement('button');
    btnRebajas.className = 'mobile-cat-direct rebajas';
    btnRebajas.textContent = 'REBAJAS';
    btnRebajas.addEventListener('click', () => {
        aplicarFiltroCategoria('REBAJAS', null);
        cerrarMenuMovil();
        hacerScrollAlCatalogo();
    });
    mobileNavContent.appendChild(btnRebajas);
}

function hacerScrollAlCatalogo() {
    document.getElementById('catalogo-anchor').scrollIntoView({ behavior: 'smooth' });
}

function renderizarSidebar() {
    if (!sidebarCategorias) return;
    sidebarCategorias.innerHTML = "";

    const categoriasAMostrar = (filtroActual.categoria === 'CALZADO' || filtroActual.categoria === 'COMPLEMENTOS')
        ? [filtroActual.categoria]
        : ['ROPA', 'CALZADO', 'COMPLEMENTOS'];

    categoriasAMostrar.forEach(catKey => {
        const dataCat = ESTRUCTURA_CATEGORIAS[catKey];
        dataCat.grupos.forEach(grupo => {
            const bloque = document.createElement('div');
            bloque.className = 'sidebar-group';

            const h4 = document.createElement('h4');
            h4.className = 'sidebar-title';
            h4.textContent = grupo.titulo;
            h4.addEventListener('click', () => aplicarFiltroCategoria(catKey, null));
            bloque.appendChild(h4);

            const ul = document.createElement('ul');
            ul.className = 'sidebar-list';

            grupo.items.forEach(sub => {
                const li = document.createElement('li');
                const btn = document.createElement('button');
                btn.type = 'button';
                const esActiva = filtroActual.subcategoria === sub;
                btn.className = esActiva ? 'sidebar-link active' : 'sidebar-link';
                btn.textContent = sub.replace('CONFORT - ', '');
                btn.addEventListener('click', () => aplicarFiltroCategoria(catKey, sub));
                li.appendChild(btn);
                ul.appendChild(li);
            });

            bloque.appendChild(ul);
            sidebarCategorias.appendChild(bloque);
        });
    });

    const divRebajas = document.createElement('div');
    divRebajas.className = 'sidebar-group';
    divRebajas.innerHTML = `<h4 class="sidebar-title sidebar-rebajas" id="side-rebajas">REBAJAS</h4>`;
    divRebajas.querySelector('#side-rebajas').addEventListener('click', () => aplicarFiltroCategoria('REBAJAS', null));
    sidebarCategorias.appendChild(divRebajas);
}

function aplicarFiltroCategoria(categoria, subcategoria = null) {
    filtroActual = { categoria, subcategoria };

    if (categoria === 'TODOS') {
        heroBanner.style.display = 'flex';
        tituloCategoriaActiva.textContent = 'COLECCIÓN COMPLETA';
        crumbActual.textContent = 'COLECCIÓN COMPLETA';
    } else {
        heroBanner.style.display = 'none';
        const etiquetaSub = subcategoria ? subcategoria.replace('CONFORT - ', '') : '';
        tituloCategoriaActiva.textContent = etiquetaSub || categoria;
        crumbActual.textContent = etiquetaSub ? `${categoria} / ${etiquetaSub}` : categoria;
    }

    renderizarSidebar();
    filtrarYOrdenarProductos();
}

// Funciones auxiliares de Stock
function stockDeVarianteYTalla(variante, talla) {
    return Math.max(0, Number(variante?.stockPorTalla?.[talla] ?? 0));
}

function stockTotalDeColor(variante, tallas) {
    return tallas.reduce((acc, t) => acc + stockDeVarianteYTalla(variante, t), 0);
}

function stockTotalDeProducto(p) {
    return p.variantesColor.reduce((acc, v) => acc + stockTotalDeColor(v, p.tallas), 0);
}

function normalizarProducto(id, data) {
    const tallas = Array.isArray(data.tallas) && data.tallas.length > 0
        ? data.tallas
        : (data.talla ? data.talla.split(',').map(s => s.trim()) : ['Única']);

    let variantesColor = [];
    if (Array.isArray(data.variantesColor) && data.variantesColor.length > 0) {
        variantesColor = data.variantesColor.map(v => {
            const stockPorTalla = {};
            tallas.forEach(t => {
                stockPorTalla[t] = (v.stockPorTalla && v.stockPorTalla[t] !== undefined) ? Number(v.stockPorTalla[t]) : 5;
            });
            return {
                color: v.color || 'Único',
                imagenes: Array.isArray(v.imagenes) && v.imagenes.length > 0 ? v.imagenes : ['https://via.placeholder.com/600x800'],
                stockPorTalla
            };
        });
    } else {
        const imgs = Array.isArray(data.imagenes) && data.imagenes.length > 0 ? data.imagenes : (data.imagen ? [data.imagen] : ['https://via.placeholder.com/600x800']);
        const cols = Array.isArray(data.colores) && data.colores.length > 0 ? data.colores : (data.color ? data.color.split(',').map(s => s.trim()) : ['Único']);
        variantesColor = cols.map(c => {
            const stockPorTalla = {};
            tallas.forEach(t => { stockPorTalla[t] = 5; });
            return { color: c, imagenes: imgs, stockPorTalla };
        });
    }

    const subcat = (data.subcategoria || data.tipo || 'VESTIDOS | MONOS').toUpperCase();

    return {
        id,
        nombre: data.nombre || 'Prenda',
        precio: Number(data.precio) || 0,
        precioRebaja: data.precioRebaja ? Number(data.precioRebaja) : null,
        categoria: (data.categoria || 'ROPA').toUpperCase(),
        subcategoria: subcat,
        enRebajas: Boolean(data.enRebajas),
        descripcion: data.descripcion || '',
        tallas,
        variantesColor
    };
}

function obtenerPrecioEfectivo(p) {
    return (p.enRebajas && p.precioRebaja) ? p.precioRebaja : p.precio;
}

function formatearEuros(valor) {
    return valor.toFixed(2).replace('.', ',') + ' €';
}

async function cargarProductos() {
    catalogo.innerHTML = "<p style='text-align:center; grid-column: 1/-1; color:#757575;'>Cargando colección...</p>";
    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        todosLosProductos = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (docSnap.id === "config_tienda_global" || data.esConfiguracion) {
                if (data.umbralPocasUnidades !== undefined) umbralPocasUnidades = Number(data.umbralPocasUnidades) || 3;
                if (data.costoEnvio !== undefined) costoEnvioConfig = Number(data.costoEnvio);
                if (data.envioGratisMin !== undefined) envioGratisMinConfig = Number(data.envioGratisMin);
                return;
            }
            todosLosProductos.push(normalizarProducto(docSnap.id, data));
        });
        filtrarYOrdenarProductos();
        actualizarVistaCarrito();
    } catch (error) {
        catalogo.innerHTML = "<p style='text-align:center; grid-column: 1/-1;'>Error al cargar el catálogo.</p>";
        console.error(error);
    }
}

function filtrarYOrdenarProductos() {
    let lista = [...todosLosProductos];

    if (filtroActual.categoria === 'REBAJAS') {
        lista = lista.filter(p => p.enRebajas);
    } else if (filtroActual.categoria !== 'TODOS') {
        lista = lista.filter(p => p.categoria === filtroActual.categoria);
        if (filtroActual.subcategoria) {
            lista = lista.filter(p =>
                p.subcategoria === filtroActual.subcategoria.toUpperCase() ||
                p.subcategoria.includes(filtroActual.subcategoria.toUpperCase())
            );
        }
    }

    const criterio = selectOrden.value;
    if (criterio === 'precio-asc') lista.sort((a, b) => obtenerPrecioEfectivo(a) - obtenerPrecioEfectivo(b));
    if (criterio === 'precio-desc') lista.sort((a, b) => obtenerPrecioEfectivo(b) - obtenerPrecioEfectivo(a));
    if (criterio === 'nombre-asc') lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (criterio === 'nombre-desc') lista.sort((a, b) => b.nombre.localeCompare(a.nombre));

    contadorProductos.textContent = `${lista.length} artículo${lista.length === 1 ? '' : 's'}`;
    renderizarCatalogo(lista);
}

selectOrden.addEventListener('change', filtrarYOrdenarProductos);

function renderizarCatalogo(lista) {
    catalogo.innerHTML = "";
    if (lista.length === 0) {
        catalogo.innerHTML = "<p style='text-align:center; grid-column: 1/-1; padding: 3rem 0; color:#757575;'>No hay artículos disponibles en esta categoría por el momento.</p>";
        return;
    }

    lista.forEach((p) => {
        const stockTotalProd = stockTotalDeProducto(p);
        const productoAgotado = stockTotalProd === 0;

        // Elegir como color inicial en la tarjeta el primero que tenga stock (si hay alguno)
        let idxInicial = p.variantesColor.findIndex(v => stockTotalDeColor(v, p.tallas) > 0);
        if (idxInicial === -1) idxInicial = 0;

        const card = document.createElement('article');
        card.className = productoAgotado ? 'card card-soldout' : 'card';
        
        const varianteInicial = p.variantesColor[idxInicial];
        const etiquetaSub = p.subcategoria.replace('CONFORT - ', '');

        let badgeDerecho = '';
        if (productoAgotado) {
            badgeDerecho = `<span class="badge-agotado">AGOTADO</span>`;
        } else if (p.enRebajas) {
            badgeDerecho = `<span class="badge-rebajas">REBAJAS</span>`;
        } else if (stockTotalProd <= umbralPocasUnidades) {
            badgeDerecho = `<span class="badge-low-stock">¡ÚLTIMAS UNIDADES!</span>`;
        }

        const htmlPrecio = (p.enRebajas && p.precioRebaja)
            ? `<p class="card-price"><strong>${formatearEuros(p.precioRebaja)}</strong> <span style="text-decoration: line-through; color: #8c8c8c; font-weight: 400; margin-left: 6px;">${formatearEuros(p.precio)}</span></p>`
            : `<p class="card-price">${formatearEuros(p.precio)}</p>`;

        const botonesColorCard = p.variantesColor.map((v, idx) => {
            const sinStockColor = stockTotalDeColor(v, p.tallas) === 0;
            const clases = [
                'card-color-pill',
                idx === idxInicial ? 'active' : '',
                sinStockColor ? 'out-of-stock' : ''
            ].filter(Boolean).join(' ');
            return `<button type="button" class="${clases}" data-idx="${idx}" title="${sinStockColor ? 'Color agotado' : v.color}">${v.color}</button>`;
        }).join('');

        // Mostrar tallas tachadas si no quedan en ninguna variante
        const tallasResumen = p.tallas.map(t => {
            const disponibleEnAlgunColor = p.variantesColor.some(v => stockDeVarianteYTalla(v, t) > 0);
            return disponibleEnAlgunColor ? t : `<del style="color:#b5b5b5;">${t}</del>`;
        }).join(' · ');

        card.innerHTML = `
            <div class="card-img-wrapper">
                <span class="badge-tipo">${etiquetaSub}</span>
                ${badgeDerecho}
                <img class="card-main-img" src="${varianteInicial.imagenes[0]}" alt="${p.nombre}" loading="lazy">
            </div>
            <div class="card-body">
                <h4 class="card-title">${p.nombre}</h4>
                ${htmlPrecio}
                <div class="card-colors-row">${botonesColorCard}</div>
                <div class="card-meta">
                    <span class="meta-pill">${tallasResumen}</span>
                </div>
            </div>
        `;

        let indiceColorPreseleccionado = idxInicial;
        const imgCard = card.querySelector('.card-main-img');

        card.querySelectorAll('.card-color-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = Number(pill.dataset.idx);
                imgCard.src = p.variantesColor[idx].imagenes[0];
                if (stockTotalDeColor(p.variantesColor[idx], p.tallas) > 0) {
                    card.querySelectorAll('.card-color-pill').forEach(b => b.classList.remove('active'));
                    pill.classList.add('active');
                    indiceColorPreseleccionado = idx;
                }
            });
        });

        card.addEventListener('click', () => abrirModalProducto(p, indiceColorPreseleccionado));
        catalogo.appendChild(card);
    });
}

// --- MODAL Y CARRITO CON BLOQUEO DE AGOTADOS ---
function actualizarGaleriaModal(imagenes) {
    modalImgPrincipal.src = imagenes[0];
    modalThumbnails.innerHTML = "";
    imagenes.forEach((url, index) => {
        const thumb = document.createElement('img');
        thumb.src = url;
        thumb.className = index === 0 ? 'thumb active' : 'thumb';
        thumb.addEventListener('click', () => {
            modalImgPrincipal.src = url;
            modalThumbnails.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
        modalThumbnails.appendChild(thumb);
    });
}

function renderizarTallasYEstadoStockModal() {
    modalTallas.innerHTML = "";
    const p = productoActual;
    const variante = varianteColorActual;

    // Si la talla seleccionada no tiene stock en este color, buscar la primera con stock
    if (!tallaSeleccionada || stockDeVarianteYTalla(variante, tallaSeleccionada) === 0) {
        const primeraTallaConStock = p.tallas.find(t => stockDeVarianteYTalla(variante, t) > 0);
        tallaSeleccionada = primeraTallaConStock || "";
    }

    p.tallas.forEach(talla => {
        const unidades = stockDeVarianteYTalla(variante, talla);
        const agotada = unidades === 0;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = talla;

        if (agotada) {
            btn.className = 'option-chip disabled-chip';
            btn.disabled = true;
            btn.title = 'Talla agotada en este color';
        } else {
            btn.className = talla === tallaSeleccionada ? 'option-chip active' : 'option-chip';
            btn.addEventListener('click', () => {
                modalTallas.querySelectorAll('.option-chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                tallaSeleccionada = talla;
                labelTallaSel.textContent = talla;
                actualizarMensajeYBotonesDeStock();
            });
        }
        modalTallas.appendChild(btn);
    });

    labelTallaSel.textContent = tallaSeleccionada || "Sin stock";
    actualizarMensajeYBotonesDeStock();
}

function actualizarMensajeYBotonesDeStock() {
    if (!productoActual || !varianteColorActual || !tallaSeleccionada) {
        if (modalStockStatus) {
            modalStockStatus.textContent = "AGOTADO EN ESTE COLOR / PRODUCTO SIN STOCK";
            modalStockStatus.className = "stock-status-msg out";
        }
        btnAddCart.disabled = true;
        btnBuyNow.disabled = true;
        btnAddCart.textContent = "SIN STOCK DISPONIBLE";
        return;
    }

    const unidades = stockDeVarianteYTalla(varianteColorActual, tallaSeleccionada);
    btnAddCart.disabled = unidades === 0;
    btnBuyNow.disabled = unidades === 0;
    btnAddCart.textContent = unidades === 0 ? "SIN STOCK DISPONIBLE" : "AÑADIR A LA CESTA";

    if (!modalStockStatus) return;

    if (unidades === 0) {
        modalStockStatus.textContent = "Talla agotada";
        modalStockStatus.className = "stock-status-msg out";
    } else if (unidades <= umbralPocasUnidades) {
        modalStockStatus.textContent = `¡Date prisa! Quedan pocas unidades (${unidades} disponible${unidades === 1 ? '' : 's'})`;
        modalStockStatus.className = "stock-status-msg low";
    } else {
        modalStockStatus.textContent = "En stock · Envío inmediato";
        modalStockStatus.className = "stock-status-msg ok";
    }
}

function abrirModalProducto(p, colorIdx = 0) {
    productoActual = p;

    // Si el color solicitado está agotado, elegir automáticamente el primer color con stock disponible
    let idxValido = colorIdx;
    if (stockTotalDeColor(p.variantesColor[idxValido], p.tallas) === 0) {
        const primerColorConStock = p.variantesColor.findIndex(v => stockTotalDeColor(v, p.tallas) > 0);
        if (primerColorConStock !== -1) idxValido = primerColorConStock;
    }

    varianteColorActual = p.variantesColor[idxValido] || p.variantesColor[0];
    tallaSeleccionada = "";

    modalTipo.textContent = `${p.categoria} / ${p.subcategoria.replace('CONFORT - ', '')}`;
    modalNombre.textContent = p.nombre;
    
    if (p.enRebajas && p.precioRebaja) {
        modalPrecio.innerHTML = `<strong>${formatearEuros(p.precioRebaja)}</strong> <span style="text-decoration: line-through; color: #8c8c8c; font-weight: 400; font-size: 1rem; margin-left: 8px;">${formatearEuros(p.precio)}</span>`;
    } else {
        modalPrecio.textContent = formatearEuros(p.precio);
    }

    modalDesc.textContent = p.descripcion;

    actualizarGaleriaModal(varianteColorActual.imagenes);
    labelColorSel.textContent = stockTotalDeColor(varianteColorActual, p.tallas) > 0
        ? varianteColorActual.color
        : `${varianteColorActual.color} (Agotado)`;

    modalColores.innerHTML = "";
    p.variantesColor.forEach((variante) => {
        const totalColor = stockTotalDeColor(variante, p.tallas);
        const colorAgotado = totalColor === 0;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = variante.color;

        if (colorAgotado) {
            btn.className = 'option-chip disabled-chip';
            btn.disabled = true;
            btn.title = 'Color agotado';
        } else {
            btn.className = variante.color === varianteColorActual.color ? 'option-chip active' : 'option-chip';
            btn.addEventListener('click', () => {
                modalColores.querySelectorAll('.option-chip').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                varianteColorActual = variante;
                labelColorSel.textContent = variante.color;
                actualizarGaleriaModal(variante.imagenes);
                renderizarTallasYEstadoStockModal();
            });
        }
        modalColores.appendChild(btn);
    });

    renderizarTallasYEstadoStockModal();
    modal.classList.add('open');
}

document.getElementById('cerrar-modal').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

btnAddCart.addEventListener('click', () => {
    if (!productoActual || !varianteColorActual || !tallaSeleccionada) return;
    const stockMax = stockDeVarianteYTalla(varianteColorActual, tallaSeleccionada);
    if (stockMax <= 0) return;

    const colorElegido = varianteColorActual.color;
    const fotoDelColor = varianteColorActual.imagenes[0];
    const precioFinal = obtenerPrecioEfectivo(productoActual);
    const itemKey = `${productoActual.id}_${tallaSeleccionada}_${colorElegido}`;
    
    const existente = carrito.find(item => item.key === itemKey);
    if (existente) {
        if (existente.cantidad + 1 > stockMax) {
            alert(`Solo quedan ${stockMax} unidad(es) disponibles de este artículo en color ${colorElegido} y talla ${tallaSeleccionada}.`);
            return;
        }
        existente.cantidad += 1;
        existente.precio = precioFinal;
        existente.maxStock = stockMax;
    } else {
        carrito.push({
            key: itemKey,
            id: productoActual.id,
            nombre: productoActual.nombre,
            precio: precioFinal,
            imagen: fotoDelColor,
            talla: tallaSeleccionada,
            color: colorElegido,
            cantidad: 1,
            maxStock: stockMax
        });
    }

    guardarYActualizarCarrito();
    modal.classList.remove('open');
    cartOverlay.classList.add('open');
});

btnBuyNow.addEventListener('click', () => {
    if (!productoActual || !varianteColorActual || !tallaSeleccionada) return;
    if (stockDeVarianteYTalla(varianteColorActual, tallaSeleccionada) <= 0) return;

    const precioFinal = obtenerPrecioEfectivo(productoActual);
    const mensaje = encodeURIComponent(
        `¡Hola! Quiero comprar este artículo:\n\n` +
        `• *${productoActual.nombre}* (${productoActual.subcategoria})\n` +
        `• Color: ${varianteColorActual.color}\n` +
        `• Talla: ${tallaSeleccionada}\n` +
        `• Precio: ${precioFinal.toFixed(2)} €\n` +
        `• Ref: ${productoActual.id}\n\n` +
        `¿Está disponible?`
    );
    window.open(`https://wa.me/${numWhatsApp}?text=${mensaje}`, '_blank');
});

function guardarYActualizarCarrito() {
    localStorage.setItem('moda_studio_cart', JSON.stringify(carrito));
    actualizarVistaCarrito();
}

function actualizarVistaCarrito() {
    cartCount.textContent = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    cartItemsContainer.innerHTML = "";
    
    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = "<p class='empty-cart'>Tu cesta está vacía.</p>";
        document.getElementById('cart-subtotal').textContent = "0,00 €";
        document.getElementById('cart-shipping').textContent = "0,00 €";
        document.getElementById('cart-taxes').textContent = "0,00 €";
        cartTotal.textContent = "0,00 €";
        return;
    }

    let subtotal = 0;
    carrito.forEach((item, index) => {
        const sub = item.precio * item.cantidad;
        subtotal += sub;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.imagen}" alt="${item.nombre}">
            <div class="cart-item-info">
                <h4>${item.nombre}</h4>
                <p>Color: <strong>${item.color}</strong> | Talla: <strong>${item.talla}</strong></p>
                <p class="cart-item-price">${formatearEuros(item.precio)} x ${item.cantidad} = <strong>${formatearEuros(sub)}</strong></p>
                <div class="cart-qty-controls">
                    <button class="qty-btn" data-idx="${index}" data-op="-1">-</button>
                    <span>${item.cantidad}</span>
                    <button class="qty-btn" data-idx="${index}" data-op="1">+</button>
                    <button class="remove-btn" data-idx="${index}">Eliminar</button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    // Cálculos del resumen
    const transporte = subtotal >= envioGratisMinConfig ? 0 : costoEnvioConfig;
    const total = subtotal + transporte;
    const impuestos = subtotal - (subtotal / 1.21); // Calculando base imponible del 21% IVA español

    document.getElementById('cart-subtotal').textContent = formatearEuros(subtotal);
    document.getElementById('cart-shipping').textContent = transporte === 0 ? "GRATIS" : formatearEuros(transporte);
    document.getElementById('cart-taxes').textContent = formatearEuros(impuestos);
    cartTotal.textContent = formatearEuros(total);

    cartItemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.idx);
            const op = Number(btn.dataset.op);
            const item = carrito[idx];
            if (op > 0 && item.maxStock && item.cantidad + op > item.maxStock) {
                alert(`No hay más unidades en stock (${item.maxStock} máx.).`);
                return;
            }
            item.cantidad += op;
            if (item.cantidad <= 0) carrito.splice(idx, 1);
            guardarYActualizarCarrito();
        });
    });

    cartItemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            carrito.splice(Number(btn.dataset.idx), 1);
            guardarYActualizarCarrito();
        });
    });
}

document.getElementById('btn-checkout-wa').addEventListener('click', () => {
    if (carrito.length === 0) return alert("Tu cesta está vacía.");
    
    let subtotal = 0;
    let lineas = `¡Hola! Me gustaría realizar el siguiente pedido:\n\n`;
    
    carrito.forEach((item, i) => {
        const sub = item.precio * item.cantidad;
        subtotal += sub;
        lineas += `${i + 1}. *${item.nombre}*\n   • Color: ${item.color} | Talla: ${item.talla}\n   • Cantidad: ${item.cantidad} x ${formatearEuros(item.precio)} = ${formatearEuros(sub)}\n\n`;
    });

    const transporte = subtotal >= envioGratisMinConfig ? 0 : costoEnvioConfig;
    const total = subtotal + transporte;

    lineas += `*SUBTOTAL:* ${formatearEuros(subtotal)}\n`;
    lineas += `*TRANSPORTE:* ${transporte === 0 ? 'GRATIS' : formatearEuros(transporte)}\n`;
    lineas += `*TOTAL DEL PEDIDO: ${formatearEuros(total)}*\n\n¿Me confirmáis disponibilidad para proceder?`;
    
    window.open(`https://wa.me/${numWhatsApp}?text=${encodeURIComponent(lineas)}`, '_blank');
});

document.getElementById('btn-abrir-carrito').addEventListener('click', () => cartOverlay.classList.add('open'));
document.getElementById('cerrar-carrito').addEventListener('click', () => cartOverlay.classList.remove('open'));
cartOverlay.addEventListener('click', (e) => { if (e.target === cartOverlay) cartOverlay.classList.remove('open'); });
document.getElementById('btn-vaciar-carrito').addEventListener('click', () => { carrito = []; guardarYActualizarCarrito(); });

document.getElementById('btn-checkout-wa').addEventListener('click', () => {
    if (carrito.length === 0) return alert("Tu cesta está vacía.");
    let lineas = `¡Hola! Me gustaría realizar el siguiente pedido:\n\n`;
    let total = 0;
    carrito.forEach((item, i) => {
        const sub = item.precio * item.cantidad;
        total += sub;
        lineas += `${i + 1}. *${item.nombre}*\n   • Color: ${item.color} | Talla: ${item.talla}\n   • Cantidad: ${item.cantidad} x ${item.precio.toFixed(2)}€ = ${sub.toFixed(2)}€\n\n`;
    });
    lineas += `*TOTAL DEL PEDIDO: ${total.toFixed(2)} €*\n\n¿Me confirmáis disponibilidad?`;
    window.open(`https://wa.me/${numWhatsApp}?text=${encodeURIComponent(lineas)}`, '_blank');
});

inicializarMenusCategorias();
cargarProductos();