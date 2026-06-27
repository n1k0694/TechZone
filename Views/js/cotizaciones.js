let catalogoProductos = [];
let carrito = [];
let totalNeto = 0;

document.addEventListener("DOMContentLoaded", () => {
    obtenerProductos();
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
                select.innerHTML += `<option value="${p.id}">${p.nombre} ($${p.precioRaw.toLocaleString('es-CL')} - Disp: ${p.stock} u.)</option>`;
            });
        });
}

function agregarAlCarrito() {
    const select = document.getElementById('selectVentaProducto');
    const productoId = parseInt(select.value);
    if (!productoId) return;

    const prod = catalogoProductos.find(p => p.id === productoId);
    const yaEnCarrito = carrito.find(item => item.id === productoId);

    if (yaEnCarrito) {
        if (yaEnCarrito.cantidad < prod.stock) yaEnCarrito.cantidad++;
        else return alert("Límite de stock máximo alcanzado.");
    } else {
        carrito.push({ id: prod.id, nombre: prod.nombre, precioRaw: prod.precioRaw, cantidad: 1 });
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
                <td class="text-end fw-semibold">$${subtotal.toLocaleString('es-CL')}</td>
            </tr>`;
    });
    document.getElementById('txtTotalVenta').innerText = `$${totalNeto.toLocaleString('es-CL')}`;
}

function procesarCotizacionPDF(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombreCliente').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();

    if (carrito.length === 0) return alert("Por favor, agregue al menos un componente al carro.");

    const iva = Math.round(totalNeto * 0.19);
    const total = totalNeto + iva;

    fetch('/api/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, telefono, neto: totalNeto, iva, total, items: carrito })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // El backend ya guardó el nombre; abrimos la pestaña limpia de impresión nativa
            window.open(`/cotizacion/ver/${data.idReal}`, '_blank');
            carrito = [];
            renderizarCarrito();
            document.getElementById('formCheckout').reset();
            alert(`¡Documento ${data.numeroDoc} emitido y guardado con éxito!`);
        } else {
            alert(data.message);
        }
    })
    .catch(() => alert("Error al procesar la cotización en el servidor central."));
}