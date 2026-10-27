import { db, auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Elementos UI
const loginSec = document.getElementById('login-section');
const crudSec = document.getElementById('crud-section');
const btnLogout = document.getElementById('btn-logout');
const form = document.getElementById('form-producto');
const lista = document.getElementById('lista-productos');

// Autenticación
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Error al iniciar sesión: " + error.message);
    }
});

btnLogout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSec.style.display = 'none';
        crudSec.style.display = 'block';
        btnLogout.style.display = 'block';
        leerProductos();
    } else {
        loginSec.style.display = 'block';
        crudSec.style.display = 'none';
        btnLogout.style.display = 'none';
    }
});

// CRUD - Crear / Actualizar
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const producto = {
        nombre: document.getElementById('prod-nombre').value,
        precio: parseFloat(document.getElementById('prod-precio').value),
        talla: document.getElementById('prod-talla').value,
        color: document.getElementById('prod-color').value,
        tipo: document.getElementById('prod-tipo').value,
        imagen: document.getElementById('prod-imagen').value,
        descripcion: document.getElementById('prod-desc').value
    };

    try {
        if (id) {
            await updateDoc(doc(db, "productos", id), producto);
        } else {
            await addDoc(collection(db, "productos"), producto);
        }
        form.reset();
        document.getElementById('prod-id').value = '';
        leerProductos();
    } catch (error) {
        alert("Error al guardar: " + error.message);
    }
});

// CRUD - Leer
async function leerProductos() {
    const querySnapshot = await getDocs(collection(db, "productos"));
    lista.innerHTML = "";
    querySnapshot.forEach((doc) => {
        const p = doc.data();
        lista.innerHTML += `
            <tr>
                <td><img src="${p.imagen}"></td>
                <td>${p.nombre}</td>
                <td>$${p.precio}</td>
                <td>${p.talla} / ${p.color}</td>
                <td>
                    <button class="btn-small" onclick="editar('${doc.id}', '${p.nombre}', ${p.precio}, '${p.talla}', '${p.color}', '${p.tipo}', '${p.imagen}', '${p.descripcion}')">Editar</button>
                    <button class="btn-small btn-rojo" onclick="borrar('${doc.id}')">Borrar</button>
                </td>
            </tr>
        `;
    });
}

// Funciones globales para botones dinámicos
window.borrar = async (id) => {
    if (confirm("¿Seguro que deseas borrar este producto?")) {
        await deleteDoc(doc(db, "productos", id));
        leerProductos();
    }
};

window.editar = (id, nombre, precio, talla, color, tipo, imagen, desc) => {
    document.getElementById('prod-id').value = id;
    document.getElementById('prod-nombre').value = nombre;
    document.getElementById('prod-precio').value = precio;
    document.getElementById('prod-talla').value = talla;
    document.getElementById('prod-color').value = color;
    document.getElementById('prod-tipo').value = tipo;
    document.getElementById('prod-imagen').value = imagen;
    document.getElementById('prod-desc').value = desc;
    window.scrollTo(0,0);
};