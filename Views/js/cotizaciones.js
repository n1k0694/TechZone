// Variables globales para manejar el estado en el navegador
let catalogoProductos = []; // Lista de productos que nos de la base de datos
let carrito = [];           // Carro de compras temporal del usuario
let totalNeto = 0;          // Suma del valor de los productos (neto, sin IVA)

// Esperamos a que la página cargue completa para enlazar los botones y funciones
document.addEventListener("DOMContentLoaded", () => {
    obtenerProductos(); // Pedir los productos apenas abra la pantalla

    // Configurar los clicks e interacciones del formulario
    document.getElementById('btnAgregarCarrito').addEventListener('click', agregarAlCarrito);
    document.getElementById('formCheckout').addEventListener('submit', procesarCotizacionPDF);
});

// Trae los productos del servidor y rellena el selector desplegable
function obtenerProductos() {
    fetch('/api/productos')
        .then(res => res.json())
        .then(datos => {
            // Dejamos en el catálogo solo los productos que tengan stock disponible
            catalogoProductos = datos.filter(p => p.stock > 0);

            const select = document.getElementById('selectVentaProducto');
            // Reseteamos el selector con un mensaje por defecto
            select.innerHTML = '<option value="" disabled selected>Selecciona un componente corporativo...</option>';

            // Rellenamos el selector metiendo cada producto con su precio y stock disponible
            catalogoProductos.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.nombre} ($${p.precioRaw.toLocaleString('es-CL')} - Disp: ${p.stock} u.)</option>`;
            });
        });
}

// Mete el producto seleccionado al carro de compras
function agregarAlCarrito() {
    const select = document.getElementById('selectVentaProducto');
    const productoId = parseInt(select.value);
    if (!productoId) return; // Si no hay nada seleccionado, no hace nada

    // Buscamos los datos del producto en el catálogo y vemos si ya lo habíamos metido al carro antes
    const prod = catalogoProductos.find(p => p.id === productoId);
    const yaEnCarrito = carrito.find(item => item.id === productoId);

    if (yaEnCarrito) {
        // Si ya estaba en el carro, sumamos uno más, controlando no pasarnos del stock real
        if (yaEnCarrito.cantidad < prod.stock) {
            yaEnCarrito.cantidad++;
        } else {
            return alert("Límite de existencias alcanzado para este componente.");
        }
    } else {
        // Si es un producto nuevo en el carro, lo agregamos al arreglo con cantidad inicial 1
        carrito.push({
            id: prod.id,
            nombre: prod.nombre,
            precioRaw: prod.precioRaw,
            cantidad: 1
        });
    }

    renderizarCarrito(); // Redibujamos la tabla para que se vean los cambios en pantalla
}

// Saca un producto completo del carro usando su ID
function eliminarDelCarrito(id) {
    // Filtramos el arreglo dejando fuera al producto que el usuario quiere borrar
    carrito = carrito.filter(item => item.id !== id);
    renderizarCarrito(); // Volvemos a dibujar la lista del carro
}

// Dibuja la lista de productos del carro y calcula el total neto actual
function renderizarCarrito() {
    const tbody = document.getElementById('tabla-carrito-body');
    tbody.innerHTML = ''; // Limpiamos la tabla vieja
    totalNeto = 0; // Reiniciamos el contador del neto

    // Si no hay productos agregados, mostramos un aviso simple en la tabla
    if (carrito.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Carro vacío. Seleccione hardware arriba.</td></tr>`;
        document.getElementById('txtTotalVenta').innerText = '$0';
        return;
    }

    // Recorremos el carrito y agregamos una fila HTML por cada artículo
    carrito.forEach(item => {
        const subtotal = item.precioRaw * item.cantidad;
        totalNeto += subtotal; // Sumamos al monto neto global

        tbody.innerHTML += `
            <tr>
                <td class="align-middle text-dark fw-medium">${item.nombre}</td>
                <td class="text-center align-middle">${item.cantidad} u.</td>
                <td class="text-end align-middle">$${subtotal.toLocaleString('es-CL')}</td>
                <td class="text-center align-middle">
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarDelCarrito(${item.id})">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </td>
            </tr>`;
    });

    // Pintamos en pantalla el total neto acumulado formateado
    document.getElementById('txtTotalVenta').innerText = `$${totalNeto.toLocaleString('es-CL')}`;
}

// Toma los datos del formulario, calcula impuestos y envía la cotización al servidor
function procesarCotizacionPDF(e) {
    e.preventDefault(); // Evitamos que la página se recargue sola al enviar el formulario

    // Capturamos lo que escribió el cliente en las cajas de texto
    const nombre = document.getElementById('nombreCliente').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();

    // Validamos que el carrito no esté vacío
    if (carrito.length === 0) return alert("Por favor, agregue al menos un componente al carro.");

    // Sacamos las cuentas reglamentarias de Chile (IVA del 19%)
    const iva = Math.round(totalNeto * 0.19);
    const total = totalNeto + iva;

    // Mandamos el paquete de datos en formato JSON a nuestro backend mediante un método POST
    fetch('/api/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, telefono, neto: totalNeto, iva, total, items: carrito })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Si el servidor guardó todo bien, abre el diseño limpio en una pestaña nueva para imprimir
                window.open(`/cotizacion/ver/${data.idReal}`, '_blank');

                // Reseteamos el carro y el formulario para dejar la pantalla lista para otra cotización
                carrito = [];
                renderizarCarrito();
                document.getElementById('formCheckout').reset();
                alert(`¡Documento ${data.numeroDoc} emitido y guardado con éxito!`);
            } else {
                // Si el backend rechazó algún dato (por ejemplo, teléfono o correo inválido)
                alert(`Error en validación: ${data.message}`);
            }
        })
        .catch(err => {
            alert("Error crítico de conectividad al procesar el documento presupuestario.");
        });
}