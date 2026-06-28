// Esperamos a que la página cargue completa para enlazar las funciones
document.addEventListener("DOMContentLoaded", () => {
    cargarHistorialCotizaciones();
});

// Trae todas las cotizaciones guardadas en la base de datos
function cargarHistorialCotizaciones() {
    // CORRECCIÓN: Apuntamos a la ruta oficial del backend de la API
    fetch('/api/cotizaciones')
        .then(res => {
            if (!res.ok) throw new Error("Error en la respuesta del servidor");
            return res.json();
        })
        .then(datos => {
            renderizarTablaVisor(datos);
        })
        .catch(err => {
            console.error("Error al recuperar el historial:", err);
            const cuerpo = document.getElementById('tabla-cotizaciones-body');
            if (cuerpo) {
                cuerpo.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger fw-bold">Error crítico al conectar con la base de datos de auditoría.</td></tr>`;
            }
        });
}

// Inyecta dinámicamente las filas de las cotizaciones en el HTML
function renderizarTablaVisor(coleccion) {
    // CORRECCIÓN: Usamos el ID exacto que tiene el tbody en el HTML
    const cuerpo = document.getElementById('tabla-cotizaciones-body');
    if (!cuerpo) return;
    
    cuerpo.innerHTML = '';

    if (coleccion.length === 0) {
        cuerpo.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted small">No se encontraron cotizaciones registradas en el sistema</td></tr>`;
        return;
    }

    coleccion.forEach(c => {
        // Formateamos la fecha al estilo chileno (DD/MM/AAAA)
        const fechaFormateada = new Date(c.fecha_emision).toLocaleDateString('es-CL');
        
        cuerpo.innerHTML += `
            <tr>
                <td class="text-center">
                    <a href="/cotizacion/ver/${c.id}" target="_blank" class="btn btn-link link-danger p-0 fs-4" title="Ver Documento">
                        <i class="bi bi-file-earmark-pdf-fill"></i>
                    </a>
                </td>
                <td><span class="badge bg-secondary px-2 py-1 font-monospace">${c.numero_documento}</span></td>
                <td class="text-dark fw-medium">${fechaFormateada}</td>
                <td class="text-muted small">${c.cliente_email}</td>
                <td class="text-end fw-bold text-dark">$${c.total_general.toLocaleString('es-CL')}</td>
            </tr>`;
    });
}