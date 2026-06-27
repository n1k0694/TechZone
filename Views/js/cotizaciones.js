// public/js/cotizaciones.js

let catalogoProductos = [];
let carrito = [];
let totalNeto = 0;

document.addEventListener("DOMContentLoaded", () => {
    obtenerProductos();

    // Vinculación de eventos a los botones de la vista
    document.getElementById('btnAgregarCarrito').addEventListener('click', agregarAlCarrito);
    document.getElementById('formCheckout').addEventListener('submit', procesarCotizacionPDF);
});

function obtenerProductos() {
    fetch('/api/productos')
        .then(res => res.json())
        .then(datos => {
            catalogoProductos = datos.filter(p => p.stock > 0);
            const select = document.getElementById('selectVentaProducto');
            select.innerHTML = '<option value="" disabled selected>Selecciona un componente corporativo...</option>';
            
            catalogoProductos.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.nombre} ($${p.precioFormateado.toLocaleString('es-CL')} - Disp: ${p.stock} u.)</option>`;
            });
        });
}

function agregarAlCarrito() {
    const select = document.getElementById('selectVentaProducto');
    const productoId = parseInt(select.value);

    if (!productoId) return;

    const productoSeleccionado = catalogoProductos.find(p => p.id === productoId);
    const itemEnCarrito = carrito.find(item => item.id === productoId);

    if (itemEnCarrito) {
        if (itemEnCarrito.cantidad < productoSeleccionado.stock) {
            itemEnCarrito.cantidad++;
        } else {
            alert(`Máximo de existencias alcanzado para este artículo.`);
            return;
        }
    } else {
        carrito.push({
            id: productoSeleccionado.id,
            nombre: productoSeleccionado.nombre,
            precioRaw: productoSeleccionado.precioRaw,
            cantidad: 1
        });
    }
    renderizarCarrito();
}

function renderizarCarrito() {
    const cuerpo = document.getElementById('tabla-carrito-body');
    cuerpo.innerHTML = '';
    totalNeto = 0;

    if (carrito.length === 0) {
        cuerpo.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-muted small">No hay productos agregados.</td></tr>`;
        document.getElementById('txtTotalVenta').innerText = '$0';
        return;
    }

    carrito.forEach(item => {
        const subtotal = item.precioRaw * item.cantidad;
        totalNeto += subtotal;

        cuerpo.innerHTML += `
            <tr>
                <td class="small fw-bold">${item.nombre}</td>
                <td class="text-center"><span class="badge bg-light text-dark border">${item.cantidad}</span></td>
                <td class="text-end fw-semibold text-dark">$${subtotal.toLocaleString('es-CL')}</td>
            </tr>`;
    });

    document.getElementById('txtTotalVenta').innerText = `$${totalNeto.toLocaleString('es-CL')}`;
}

function procesarCotizacionPDF(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombreCliente') ? document.getElementById('nombreCliente').value : '';
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const alertBox = document.getElementById('mensajeVenta');

    if (carrito.length === 0) {
        alertBox.className = "alert alert-warning mt-3 py-2 text-center small fw-bold";
        alertBox.innerText = "Error: El presupuesto debe contener al menos un componente.";
        alertBox.classList.remove('d-none');
        return;
    }

    if (nombre.trim().length < 3) {
        alertBox.className = "alert alert-danger mt-3 py-2 text-center small fw-semibold";
        alertBox.innerText = "El nombre del solicitante es obligatorio.";
        alertBox.classList.remove('d-none');
        return;
    }

    let netoAcumulado = 0;
    carrito.forEach(item => { netoAcumulado += (item.precioRaw * item.cantidad); });
    const ivaCalculado = Math.round(netoAcumulado * 0.19);
    const totalGeneralCalculado = netoAcumulado + ivaCalculado;

    fetch('/api/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            nombre: nombre.trim(),
            email: email.trim(), 
            telefono: telefono.trim(),
            neto: netoAcumulado,
            iva: ivaCalculado,
            total: totalGeneralCalculado,
            items: carrito 
        })
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        return data;
    })
    .then(data => {
        if (data.success) {
            alertBox.classList.add('d-none');

            // 🚀 ACTUALIZACIÓN AQUÍ: Pasamos el nombre dinámico codificado en la URL
            window.open(`/cotizacion/ver/${data.idReal}?nombre=${encodeURIComponent(nombre.trim())}`, '_blank');

            // Limpieza estándar de la interfaz
            carrito = [];
            totalNeto = 0;
            renderizarCarrito();
            document.getElementById('formCheckout').reset();

            alert(`¡Cotización ${data.numeroDoc} procesada y guardada con éxito en la Base de Datos!`);
        }
    })
    .catch(err => {
        alertBox.className = "alert alert-danger mt-3 py-2 text-center small fw-semibold";
        alertBox.innerText = err.message || "Error al procesar la validación.";
        alertBox.classList.remove('d-none');
    });
}