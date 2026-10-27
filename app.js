import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const numWhatsApp = ""; // Dejar vacío por ahora, luego pones formato: 34600000000
const catalogo = document.getElementById('catalogo');

async function cargarProductos() {
    const querySnapshot = await getDocs(collection(db, "productos"));
    catalogo.innerHTML = "";
    
    querySnapshot.forEach((doc) => {
        const p = doc.data();
        const id = doc.id;
        // Generar mensaje prellenado para WhatsApp
        const mensaje = encodeURIComponent(`Hola, me interesa: ${p.nombre} (Color: ${p.color}, Talla: ${p.talla}). ¿Sigue disponible?`);
        const urlWa = `https://wa.me/${numWhatsApp}?text=${mensaje}`;

        catalogo.innerHTML += `
            <div class="card">
                <img src="${p.imagen}" alt="${p.nombre}">
                <div class="card-body">
                    <h3 class="card-title">${p.nombre}</h3>
                    <p class="card-price">$${p.precio}</p>
                    <p class="card-tags">Tipo: ${p.tipo} | Talla: ${p.talla} | Color: ${p.color}</p>
                    <p>${p.descripcion}</p>
                    <a href="${urlWa}" target="_blank" class="btn-wa">Comprar por WhatsApp</a>
                </div>
            </div>
        `;
    });
}

cargarProductos();