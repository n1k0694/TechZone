// public/js/cotizaciones.js

let catalogoProductos = [];
let carrito = [];
let totalNeto = 0;

document.addEventListener("DOMContentLoaded", () => {
    // Establecer fecha de emisión de forma automática
    const hoy = new Date();
    const pdfFechaElement = document.getElementById('pdfFecha');
    if (pdfFechaElement) pdfFechaElement.innerText = hoy.toLocaleDateString('es-CL');

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
    
    // ADICIÓN: Captura del campo Nombre desde el formulario HTML
    const nombre = document.getElementById('nombreCliente').value;
    const email = document.getElementById('email').value;
    const telefono = document.getElementById('telefono').value;
    const alertBox = document.getElementById('mensajeVenta');

    if (carrito.length === 0) {
        alertBox.className = "alert alert-warning mt-3 py-2 text-center small fw-bold";
        alertBox.innerText = "Error: El presupuesto debe contener al menos un componente.";
        alertBox.classList.remove('d-none');
        return;
    }

    // Petición de validación Regex al Controlador del Backend (Estructura MVC estricta)
    fetch('/api/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, telefono })
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        return data;
    })
    .then(data => {
        if (data.success) {
            alertBox.classList.add('d-none');

            // 1. Establecer fechas dinámicas en el PDF
            const hoy = new Date();
            const validez = new Date();
            const numUnico = Date.now().toString().slice(-3);

            document.getElementById('pdfNumeroDoc').innerText = `#000${numUnico}`;
            validez.setDate(hoy.getDate() + 15); // Suma los 15 días reglamentarios

            document.getElementById('pdfFecha').innerText = hoy.toLocaleDateString('es-CL');
            document.getElementById('pdfValidez').innerText = validez.toLocaleDateString('es-CL');

            // 2. Sincronizar identificadores del cliente (ADICIÓN: Se incluye la carga del Nombre)
            document.getElementById('lblPdfNombre').innerText = nombre.trim();
            document.getElementById('lblPdfEmail').innerText = email.trim();
            document.getElementById('lblPdfTelefono').innerText = telefono.trim();

            // 3. Poblar filas de componentes y computar valores financieros
            const tablaPdfBody = document.getElementById('tabla-pdf-body');
            if (tablaPdfBody) {
                tablaPdfBody.innerHTML = '';
                
                let netoAcumulado = 0;
                
                carrito.forEach((item, index) => {
                    const subtotalItem = item.precioRaw * item.cantidad;
                    netoAcumulado += subtotalItem;

                    tablaPdfBody.innerHTML += `
                        <tr style="color: #555;">
                            <td class="text-muted font-monospace" style="font-size: 0.85rem;">ID-${item.id || index + 1}</td>
                            <td class="fw-semibold text-dark">${item.nombre}</td>
                            <td class="text-center">${item.cantidad} u.</td>
                            <td class="text-end">$${item.precioRaw.toLocaleString('es-CL')}</td>
                            <td class="text-end fw-semibold text-dark">$${subtotalItem.toLocaleString('es-CL')}</td>
                        </tr>`;
                });

                // 4. Calcular desglose financiero de Chile (Neto, IVA 19%, Total)
                const ivaCalculado = Math.round(netoAcumulado * 0.19);
                const totalGeneralCalculado = netoAcumulado + ivaCalculado;

                document.getElementById('pdfMontoNeto').innerText = `$${netoAcumulado.toLocaleString('es-CL')}`;
                document.getElementById('pdfMontoIva').innerText = `$${ivaCalculado.toLocaleString('es-CL')}`;
                document.getElementById('pdfTotalGeneral').innerText = `$${totalGeneralCalculado.toLocaleString('es-CL')}`;
            }

            // 5. Configurar opciones de captura y descargar el archivo binario
            const elementoPDF = document.getElementById('bloque-pdf');
            if (elementoPDF) {
                elementoPDF.style.display = 'block'; // Visibilidad transitoria para html2canvas

                const opciones = {
                    margin:       [10,5,10,5],
                    filename:     `Cotizacion_TechZone_SpA_${numUnico}.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 5, useCORS: true, letterRendering: true },
                    jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' } // Formato Carta establecido
                };

                // Ejecución asíncrona del empaquetado PDF
                html2pdf().set(opciones).from(elementoPDF).save().then(() => {
                    elementoPDF.style.display = 'none'; // Reocultar bloque al terminar descarga
                });
            } else {
                // Si usas el comportamiento nativo de impresión por CSS @media print
                window.print();
            }
        }
    })
    .catch(err => {
        alertBox.className = "alert alert-danger mt-3 py-2 text-center small fw-semibold";
        alertBox.innerText = err.message || "Error al procesar la validación.";
        alertBox.classList.remove('d-none');
    });
}