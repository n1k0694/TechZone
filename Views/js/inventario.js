let matrizInventario = [];

document.addEventListener("DOMContentLoaded", () => {
    obtenerCatalogo();

    document.getElementById('formCargaInventario').addEventListener('submit', guardarNuevoStock);

    const formNuevo = document.getElementById('formNuevoProducto');
    if (formNuevo) {
        formNuevo.addEventListener('submit', guardarNuevoProducto);
    }

    // Evento dinámico: Cuando seleccionen un producto para reabastecer,
    // autoseleccionamos la categoría que ya tiene registrada en el sistema.
    const selectProducto = document.getElementById('selectProducto');
    if (selectProducto) {
        selectProducto.addEventListener('change', (e) => {
            const prodId = parseInt(e.target.value);
            const productoEncontrado = matrizInventario.find(p => p.id === prodId);
            if (productoEncontrado) {
                document.getElementById('selectCategoriaActualizar').value = productoEncontrado.categoria;
            }
        });
    }
});

function obtenerCatalogo() {
    fetch('/api/productos')
        .then(res => res.json())
        .then(datos => {
            matrizInventario = datos;

            // 1. RELLENAR LA TABLA DE MONITOREO
            const tbody = document.getElementById('tablaInventario');
            tbody.innerHTML = '';

            matrizInventario.forEach(p => {
                let badgeColor = "bg-success";
                let badgeTexto = "Stock Óptimo";

                if (p.stock === 0) {
                    badgeColor = "bg-danger";
                    badgeTexto = "Quiebre de Stock";
                } else if (p.stock <= 5) {
                    badgeColor = "bg-warning text-dark";
                    badgeTexto = "Reponer Stock";
                }

                tbody.innerHTML += `
                    <tr>
                        <td class="py-3 ps-4 fw-bold text-secondary">#${p.id}</td>
                        <td class="py-3 text-dark fw-semibold">${p.nombre}</td>
                        <td class="py-3 text-muted fw-medium"><i class="bi bi-tag-fill me-1"></i>${p.categoria}</td>
                        <td class="py-3 text-end fw-bold text-dark">$${p.precioRaw.toLocaleString('es-CL')}</td>
                        <td class="py-3 text-center">
                            <span class="badge ${badgeColor} px-3 py-2 rounded-pill">${badgeTexto} (${p.stock} u.)</span>
                        </td>
                        <td class="py-3 text-center">
                            ${p.stock <= 5 ? '<i class="bi bi-exclamation-triangle-fill text-warning fs-5"></i>' : '<i class="bi bi-check-circle-fill text-success fs-5"></i>'}
                        </td>
                    </tr>`;
            });

            // 2. RELLENAR EL SELECTOR DE STOCK EXISTENTE
            const select = document.getElementById('selectProducto');
            if (select) {
                select.innerHTML = '<option value="" disabled selected>Selecciona el componente a reabastecer...</option>';
                matrizInventario.forEach(p => {
                    select.innerHTML += `<option value="${p.id}">${p.nombre} (Stock: ${p.stock} u.)</option>`;
                });
            }
        })
        .catch(err => {
            console.error("Error al poblar la interfaz de inventario desde MySQL:", err);
        });
}

function guardarNuevoStock(e) {
    e.preventDefault();

    const producto_id = document.getElementById('selectProducto').value;
    const categoria = document.getElementById('selectCategoriaActualizar').value;
    const cantidad = parseInt(document.getElementById('inputCantidad').value);
    const alertBox = document.getElementById('mensajeAdmin');

    if (!producto_id || !categoria || !cantidad || cantidad <= 0) {
        alert("Por favor, complete todos los campos de abastecimiento de forma correcta.");
        return;
    }

    fetch('/api/inventario/agregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id, cantidad, categoria })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alertBox.className = "alert alert-success mt-3 py-2 text-center fw-bold shadow-sm";
                alertBox.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> ${data.message}`;
                alertBox.classList.remove('d-none');

                document.getElementById('formCargaInventario').reset();
                obtenerCatalogo();
            } else {
                alertBox.className = "alert alert-danger mt-3 py-2 text-center fw-bold";
                alertBox.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i> ${data.message}`;
                alertBox.classList.remove('d-none');
            }
        })
        .catch(err => {
            alertBox.className = "alert alert-danger mt-3 py-2 text-center fw-bold";
            alertBox.innerText = "Error crítico de red al procesar el incremento.";
            alertBox.classList.remove('d-none');
        });
}

function guardarNuevoProducto(e) {
    e.preventDefault();

    const nombre = document.getElementById('nuevoNombre').value.trim();
    const categoria = document.getElementById('selectCategoriaNueva').value;
    const precioRaw = parseInt(document.getElementById('nuevoPrecio').value);
    const stock = parseInt(document.getElementById('nuevoStock').value);

    if (!nombre || !categoria || isNaN(precioRaw) || isNaN(stock) || precioRaw <= 0 || stock < 0) {
        alert("Por favor, complete todos los campos con valores válidos.");
        return;
    }

    fetch('/api/productos/nuevo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, categoria, precioRaw, stock })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(`¡Registro Exitoso!\n\n${data.message}`);
                document.getElementById('formNuevoProducto').reset();
                obtenerCatalogo();
            } else {
                alert(`Error en la carga: ${data.message}`);
            }
        })
        .catch(err => {
            console.error("Fallo de red al intentar crear el componente:", err);
            alert("Error crítico de conectividad al intentar dar de alta el producto.");
        });
}