import { db, auth } from "./firebase-config.js";
import { ESTRUCTURA_CATEGORIAS } from "./categorias-data.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, addDoc, getDocs, getDoc, setDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const loginSec = document.getElementById('login-section');
const crudSec = document.getElementById('crud-section');
const btnLogout = document.getElementById('btn-logout');
const form = document.getElementById('form-producto');
const lista = document.getElementById('lista-productos');
const btnCancelar = document.getElementById('btn-cancelar-edicion');
const contenedorColores = document.getElementById('contenedor-variantes-color');
const btnAgregarColor = document.getElementById('btn-agregar-color');
const selectCat = document.getElementById('prod-categoria');
const selectSubcat = document.getElementById('prod-subcategoria');
const checkRebajas = document.getElementById('prod-rebajas');
const contenedorPrecioRebaja = document.getElementById('contenedor-precio-rebaja');
const inputPrecioRebaja = document.getElementById('prod-precio-rebaja');
const inputTallas = document.getElementById('prod-tallas');
const inputUmbral = document.getElementById('umbral-pocas-unidades');
const btnGuardarUmbral = document.getElementById('btn-guardar-umbral');

let inventarioCache = {};

// Mostrar u ocultar el input de precio de rebaja
checkRebajas.addEventListener('change', () => {
    contenedorPrecioRebaja.style.display = checkRebajas.checked ? 'block' : 'none';
    inputPrecioRebaja.required = checkRebajas.checked;
    if (!checkRebajas.checked) inputPrecioRebaja.value = '';
});

function obtenerListaTallasFormulario() {
    const arr = inputTallas.value.split(',').map(s => s.trim()).filter(Boolean);
    return arr.length > 0 ? arr : ['Única'];
}

// Actualizar las casillas de stock por talla en cada bloque de color cuando cambian las tallas
function sincronizarInputsStockEnBloques() {
    const tallas = obtenerListaTallasFormulario();
    contenedorColores.querySelectorAll('.color-variant-block').forEach(bloque => {
        const gridStock = bloque.querySelector('.stock-tallas-grid');
        // Conservar valores que el usuario ya haya escrito en este bloque
        const valoresActuales = {};
        gridStock.querySelectorAll('.input-stock-talla').forEach(inp => {
            valoresActuales[inp.dataset.talla] = inp.value;
        });

        gridStock.innerHTML = "";
        tallas.forEach(talla => {
            const val = valoresActuales[talla] !== undefined ? valoresActuales[talla] : 5;
            const item = document.createElement('div');
            item.className = 'stock-talla-item';
            item.innerHTML = `
                <label>Talla ${talla}</label>
                <input type="number" min="0" class="input-stock-talla" data-talla="${talla}" value="${val}" required>
            `;
            gridStock.appendChild(item);
        });
    });
}

inputTallas.addEventListener('input', sincronizarInputsStockEnBloques);

// Poblar el selector de Subcategorías según la Categoría Principal elegida
function actualizarSubcategoriasAdmin(catSeleccionada, subcatPreseleccionada = null) {
    selectSubcat.innerHTML = "";
    const infoCat = ESTRUCTURA_CATEGORIAS[catSeleccionada];
    if (!infoCat) return;

    infoCat.grupos.forEach(grupo => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = grupo.titulo;
        grupo.items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item.replace('CONFORT - ', '');
            if (subcatPreseleccionada && subcatPreseleccionada.toUpperCase() === item.toUpperCase()) {
                option.selected = true;
            }
            optgroup.appendChild(option);
        });
        selectSubcat.appendChild(optgroup);
    });
}

selectCat.addEventListener('change', () => actualizarSubcategoriasAdmin(selectCat.value));
actualizarSubcategoriasAdmin(selectCat.value);

function agregarBloqueColor(nombreColor = '', listaImagenes = [], stockPorTalla = {}) {
    const tallas = obtenerListaTallasFormulario();
    const div = document.createElement('div');
    div.className = 'color-variant-block';

    const inputsStockHtml = tallas.map(talla => {
        const cant = stockPorTalla && stockPorTalla[talla] !== undefined ? stockPorTalla[talla] : 5;
        return `
            <div class="stock-talla-item">
                <label>Talla ${talla}</label>
                <input type="number" min="0" class="input-stock-talla" data-talla="${talla}" value="${cant}" required>
            </div>
        `;
    }).join('');

    div.innerHTML = `
        <div class="color-variant-top">
            <div style="flex:1;">
                <label class="admin-label">Nombre del Color</label>
                <input type="text" class="input-color-nombre" placeholder="Ej. Blanco, Negro, Camel..." value="${nombreColor}" required style="margin-bottom:0;">
            </div>
            <button type="button" class="btn-remove-variant">&times; Quitar color</button>
        </div>
        <label class="admin-label" style="margin-top:0.75rem;">URLs de fotos para este color (1 por línea)</label>
        <textarea class="input-color-imagenes" rows="3" placeholder="https://images.unsplash.com/foto-1...\nhttps://images.unsplash.com/foto-2..." required style="margin-bottom:0.75rem;">${listaImagenes.join('\n')}</textarea>
        <label class="admin-label">Stock disponible por talla en este color</label>
        <div class="stock-tallas-grid">${inputsStockHtml}</div>
    `;

    div.querySelector('.btn-remove-variant').addEventListener('click', () => {
        if (contenedorColores.querySelectorAll('.color-variant-block').length > 1) {
            div.remove();
        } else {
            alert("El artículo debe tener al menos un color.");
        }
    });

    contenedorColores.appendChild(div);
}

btnAgregarColor.addEventListener('click', () => agregarBloqueColor());

// Cargar y guardar el umbral global de pocas unidades
async function cargarConfiguracionTienda() {
    try {
        const snap = await getDoc(doc(db, "productos", "config_tienda_global"));
        if (snap.exists() && snap.data().umbralPocasUnidades !== undefined) {
            inputUmbral.value = snap.data().umbralPocasUnidades;
        }
    } catch (e) {
        console.error(e);
    }
}

btnGuardarUmbral.addEventListener('click', async () => {
    const val = Math.max(1, parseInt(inputUmbral.value, 10) || 3);
    try {
        await setDoc(doc(db, "productos", "config_tienda_global"), {
            esConfiguracion: true,
            umbralPocasUnidades: val
        }, { merge: true });
        alert(`Alerta configurada: se avisará cuando queden ${val} unidades o menos.`);
    } catch (error) {
        alert("Error al guardar el umbral: " + error.message);
    }
});

document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Acceso denegado: credenciales incorrectas.");
    }
});

btnLogout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSec.style.display = 'none';
        crudSec.style.display = 'block';
        btnLogout.style.display = 'block';
        if (contenedorColores.children.length === 0) agregarBloqueColor();
        cargarConfiguracionTienda();
        leerProductos();
    } else {
        loginSec.style.display = 'block';
        crudSec.style.display = 'none';
        btnLogout.style.display = 'none';
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const tallasArr = obtenerListaTallasFormulario();

    const bloques = contenedorColores.querySelectorAll('.color-variant-block');
    const variantesColor = [];

    bloques.forEach(b => {
        const color = b.querySelector('.input-color-nombre').value.trim();
        const imagenes = b.querySelector('.input-color-imagenes').value.split('\n').map(s => s.trim()).filter(Boolean);
        const stockPorTalla = {};
        b.querySelectorAll('.input-stock-talla').forEach(inp => {
            stockPorTalla[inp.dataset.talla] = Math.max(0, parseInt(inp.value, 10) || 0);
        });

        if (color && imagenes.length > 0) {
            variantesColor.push({ color, imagenes, stockPorTalla });
        }
    });

    if (variantesColor.length === 0) {
        alert("Agrega al menos un color con su respectiva foto.");
        return;
    }

    const categoriaPrincipal = selectCat.value;
    const subcategoria = selectSubcat.value;
    const enRebajas = checkRebajas.checked;
    const precioRebajaVal = (enRebajas && inputPrecioRebaja.value) ? parseFloat(inputPrecioRebaja.value) : null;
    const coloresNombres = variantesColor.map(v => v.color);
    const todasLasImagenes = variantesColor.flatMap(v => v.imagenes);

    const producto = {
        nombre: document.getElementById('prod-nombre').value.trim(),
        precio: parseFloat(document.getElementById('prod-precio').value),
        precioRebaja: precioRebajaVal,
        categoria: categoriaPrincipal,
        subcategoria: subcategoria,
        tipo: subcategoria,
        enRebajas: enRebajas,
        tallas: tallasArr,
        variantesColor: variantesColor,
        colores: coloresNombres,
        imagenes: todasLasImagenes,
        talla: tallasArr.join(', '),
        color: coloresNombres.join(', '),
        imagen: todasLasImagenes[0] || '',
        descripcion: document.getElementById('prod-desc').value.trim()
    };

    try {
        if (id) {
            await updateDoc(doc(db, "productos", id), producto);
        } else {
            await addDoc(collection(db, "productos"), producto);
        }
        limpiarFormulario();
        leerProductos();
    } catch (error) {
        alert("Error al guardar: " + error.message);
    }
});

function limpiarFormulario() {
    form.reset();
    document.getElementById('prod-id').value = '';
    inputTallas.value = "S, M, L";
    selectCat.value = "ROPA";
    actualizarSubcategoriasAdmin("ROPA");
    checkRebajas.checked = false;
    contenedorPrecioRebaja.style.display = 'none';
    inputPrecioRebaja.required = false;
    inputPrecioRebaja.value = '';
    contenedorColores.innerHTML = '';
    agregarBloqueColor();
    btnCancelar.style.display = 'none';
    document.getElementById('btn-guardar').textContent = 'Guardar Artículo';
}

btnCancelar.addEventListener('click', limpiarFormulario);

async function leerProductos() {
    const querySnapshot = await getDocs(collection(db, "productos"));
    lista.innerHTML = "";
    inventarioCache = {};

    querySnapshot.forEach((docSnap) => {
        if (docSnap.id === "config_tienda_global" || docSnap.data().esConfiguracion) return;

        const p = docSnap.data();
        const id = docSnap.id;
        inventarioCache[id] = p;

        const tallas = Array.isArray(p.tallas) && p.tallas.length ? p.tallas : (p.talla ? p.talla.split(',').map(s => s.trim()) : ['Única']);
        const variantes = obtenerVariantesNormalizadas(p, tallas);
        const imgPortada = variantes[0]?.imagenes[0] || '';
        const cat = p.categoria || 'ROPA';
        const sub = p.subcategoria || p.tipo || '';
        const tagRebajas = p.enRebajas ? `<span style="color:#c1121f; font-weight:600; font-size:0.7rem;"> [REBAJAS]</span>` : '';

        const precioMostrado = (p.enRebajas && p.precioRebaja)
            ? `<strong>${Number(p.precioRebaja).toFixed(2)} €</strong> <span style="text-decoration:line-through; color:#888; font-size:0.8rem;">${Number(p.precio).toFixed(2)} €</span>`
            : `${Number(p.precio).toFixed(2)} €`;

        const resumenStockHtml = variantes.map(v => {
            const desglose = tallas.map(t => {
                const u = v.stockPorTalla?.[t] ?? 0;
                return `<span style="${u === 0 ? 'color:#c1121f; text-decoration:line-through;' : ''}">${t}:${u}</span>`;
            }).join(' · ');
            return `<div><strong>${v.color}:</strong> <small>${desglose}</small></div>`;
        }).join('');

        lista.innerHTML += `
            <tr>
                <td><img src="${imgPortada}" alt="${p.nombre}"></td>
                <td>
                    <strong>${p.nombre}</strong>${tagRebajas}<br>
                    <small style="color:#757575;">${cat} &rsaquo; ${sub}</small>
                </td>
                <td>${precioMostrado}</td>
                <td>${resumenStockHtml}</td>
                <td>
                    <button class="btn-small" onclick="editar('${id}')">Editar</button>
                    <button class="btn-small btn-rojo" onclick="borrar('${id}')">Borrar</button>
                </td>
            </tr>
        `;
    });
}

function obtenerVariantesNormalizadas(p, tallas) {
    if (Array.isArray(p.variantesColor) && p.variantesColor.length > 0) {
        return p.variantesColor.map(v => {
            const stockPorTalla = {};
            tallas.forEach(t => {
                stockPorTalla[t] = (v.stockPorTalla && v.stockPorTalla[t] !== undefined) ? Number(v.stockPorTalla[t]) : 5;
            });
            return { ...v, stockPorTalla };
        });
    }
    const imgs = Array.isArray(p.imagenes) && p.imagenes.length ? p.imagenes : (p.imagen ? [p.imagen] : []);
    const cols = Array.isArray(p.colores) && p.colores.length ? p.colores : (p.color ? p.color.split(',').map(s => s.trim()) : ['Único']);
    return cols.map(c => {
        const stockPorTalla = {};
        tallas.forEach(t => { stockPorTalla[t] = 5; });
        return { color: c, imagenes: imgs, stockPorTalla };
    });
}

window.borrar = async (id) => {
    if (confirm("¿Seguro que deseas eliminar este artículo?")) {
        await deleteDoc(doc(db, "productos", id));
        leerProductos();
    }
};

window.editar = (id) => {
    const p = inventarioCache[id];
    if (!p) return;

    const cat = p.categoria || 'ROPA';
    const sub = p.subcategoria || p.tipo || '';
    const tallasArr = Array.isArray(p.tallas) && p.tallas.length ? p.tallas : (p.talla ? p.talla.split(',').map(s => s.trim()) : ['Única']);
    const variantes = obtenerVariantesNormalizadas(p, tallasArr);

    document.getElementById('prod-id').value = id;
    document.getElementById('prod-nombre').value = p.nombre || '';
    document.getElementById('prod-precio').value = p.precio || '';
    selectCat.value = cat;
    actualizarSubcategoriasAdmin(cat, sub);
    checkRebajas.checked = Boolean(p.enRebajas);
    contenedorPrecioRebaja.style.display = checkRebajas.checked ? 'block' : 'none';
    inputPrecioRebaja.required = checkRebajas.checked;
    inputPrecioRebaja.value = p.precioRebaja || '';
    inputTallas.value = tallasArr.join(', ');
    document.getElementById('prod-desc').value = p.descripcion || '';

    contenedorColores.innerHTML = '';
    variantes.forEach(v => agregarBloqueColor(v.color, v.imagenes, v.stockPorTalla));

    document.getElementById('btn-guardar').textContent = 'Actualizar Artículo';
    btnCancelar.style.display = 'inline-flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};