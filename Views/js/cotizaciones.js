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

    // MAPEO INTEGRAL MVC: Enviamos exclusivamente los IDs y cantidades requeridas
    const itemsSimplificados = carrito.map(item => ({ id: item.id, cantidad: item.cantidad }));

    fetch('/api/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            nombre: nombre,
            email: email, 
            telefono: telefono,
            items: itemsSimplificados 
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

            const hoy = new Date();
            const validez = new Date();
            validez.setDate(hoy.getDate() + 15);

            // RENDERIZADO EN EL DOM: Asignamos valores numéricos validados por el servidor
            document.getElementById('pdfNumeroDoc').innerText = data.numeroDoc;
            document.getElementById('pdfFecha').innerText = hoy.toLocaleDateString('es-CL');
            document.getElementById('pdfValidez').innerText = validez.toLocaleDateString('es-CL');

            if(document.getElementById('lblPdfNombre')) {
                document.getElementById('lblPdfNombre').innerText = nombre.trim();
            }
            document.getElementById('lblPdfEmail').innerText = email.trim();
            document.getElementById('lblPdfTelefono').innerText = telefono.trim();

            // Población dinámica de la tabla del PDF con los subtotales calculados por el backend
            const tablaPdfBody = document.getElementById('tabla-pdf-body');
            tablaPdfBody.innerHTML = '';
            
            data.detalles.forEach(item => {
                tablaPdfBody.innerHTML += `
                    <tr style="color: #555;">
                        <td class="text-muted font-monospace" style="font-size: 0.85rem;">ID-${item.id}</td>
                        <td class="fw-semibold text-dark">${item.nombre}</td>
                        <td class="text-center">${item.cantidad} u.</td>
                        <td class="text-end">$${item.precioUnitario.toLocaleString('es-CL')}</td>
                        <td class="text-end fw-semibold text-dark">$${item.subtotal.toLocaleString('es-CL')}</td>
                    </tr>`;
            });

            // Seteamos los totales financieros inalterables devueltos por el controlador
            document.getElementById('pdfMontoNeto').innerText = `$${data.neto.toLocaleString('es-CL')}`;
            document.getElementById('pdfMontoIva').innerText = `$${data.iva.toLocaleString('es-CL')}`;
            document.getElementById('pdfTotalGeneral').innerText = `$${data.total.toLocaleString('es-CL')}`;

            // Manipulación de vista y guardado del archivo PDF (Tamaño Carta)
            const elementoPDF = document.getElementById('bloque-pdf');
            elementoPDF.style.display = 'block';

            const opciones = {
                margin:       [10, 5, 10, 5],
                filename:     `Cotizacion_TechZone_${data.numeroDoc.replace('#', '')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 3, useCORS: true, letterRendering: true },
                jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
            };

            html2pdf().set(opciones).from(elementoPDF).save().then(() => {
                elementoPDF.style.display = 'none';
                carrito = []; // Limpiamos la memoria del carrito local
                renderizarCarrito(); // Re-renderizamos la vista de la grilla vacía
                alert(`¡Cotización ${data.numeroDoc} procesada y guardada con éxito en la Base de Datos!`);
            });
        }
    })
    .catch(err => {
        alertBox.className = "alert alert-danger mt-3 py-2 text-center small fw-semibold";
        alertBox.innerText = err.message || "Error al procesar la validación.";
        alertBox.classList.remove('d-none');
    });
}