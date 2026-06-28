const path = require('path');
const db = require('../Config/db');

// ==========================================
// 1. DEVOLVER LOS ARCHIVOS HTML AL NAVEGADOR
// ==========================================
exports.renderindex = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'index.html'));
exports.renderPagina2 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina2.html'));
exports.renderPagina3 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina3.html'));
exports.renderPagina4 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina4.html'));
exports.renderPagina5 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina5.html'));
exports.renderPagina6 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina6.html'));


// ==========================================
// 2. LÓGICA DE LAS ACCIONES (API)
// ==========================================

// Trae los productos ordenados por el último agregado
exports.getProductosFormateados = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM productos ORDER BY id DESC;');
        
        const formateados = rows.map(p => ({
            id: p.id,
            nombre: p.nombre,
            categoria: p.categoria || 'Sin Categoría',
            precioRaw: p.precio,
            stock: p.stock
        }));

        res.json(formateados);
    } catch (error) {
        console.error("Fallo al leer catálogo:", error);
        res.status(500).json({ error: "No se pudo recuperar la lista de hardware." });
    }
};

// Cuando el administrador suma stock y actualiza categoría desde la consola de carga
exports.agregarInventario = async (req, res) => {
    const { producto_id, cantidad, categoria } = req.body;

    if (!producto_id || !cantidad || !categoria) {
        return res.status(400).json({ success: false, message: "Faltan parámetros requeridos (ID, Cantidad o Categoría)." });
    }

    try {
        const sql = 'UPDATE productos SET stock = stock + ?, categoria = ? WHERE id = ?';
        const [result] = await db.query(sql, [parseInt(cantidad), categoria, parseInt(producto_id)]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "El stock y la categoría han sido actualizados correctamente." });
        } else {
            res.status(404).json({ success: false, message: "El componente seleccionado no existe en el sistema." });
        }
    } catch (error) {
        console.error("Error al actualizar inventario:", error);
        res.status(500).json({ success: false, message: "Fallo crítico al interactuar con MySQL." });
    }
};

// Inserta un producto completamente nuevo en el catálogo de hardware de la base de datos
exports.crearNuevoProducto = async (req, res) => {
    const { nombre, precioRaw, stock } = req.body;

    if (!nombre || precioRaw === undefined || stock === undefined) {
        return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
    }

    try {
        const querySQL = 'INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)';
        await db.query(querySQL, [nombre, parseInt(precioRaw), parseInt(stock)]);

        res.json({ success: true, message: `El producto "${nombre}" ha sido registrado con éxito.` });
    } catch (error) {
        console.error("Error al insertar producto:", error);
        res.status(500).json({ success: false, message: "Fallo al registrar el ítem en la base de datos." });
    }
};

// Cuando se hace una venta directa y hay que restar del stock
exports.procesarVenta = async (req, res) => {
    const { carro } = req.body;
    if (!carro || carro.length === 0) return res.status(400).json({ success: false, message: "Carro vacío" });

    try {
        for (const item of carro) {
            await db.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.id]);
        }
        res.json({ success: true, message: "Stock rebajado con éxito." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al descontar inventario." });
    }
};

// Guarda la cotización y los datos del cliente de forma segura en la base de datos
exports.validarDatosCotizacion = async (req, res) => {
    const { nombre, email, telephone, neto, iva, total, items } = req.body;
    const telefonoCliente = telephone || req.body.telefono;

    if (!nombre || !email || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Datos del cliente o artículos inválidos." });
    }

    try {
        const sqlCotizacion = `
            INSERT INTO cotizaciones (numero_documento, cliente_nombre, cliente_email, cliente_telefono, monto_neto, monto_iva, total_general) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        const [resultadoCotizacion] = await db.query(sqlCotizacion, [
            'TEMP', nombre, email, telefonoCliente, neto, iva, total
        ]);

        const cotizacionId = resultadoCotizacion.insertId;
        const numeroDocumentoGenerado = `COT-${String(cotizacionId).padStart(5, '0')}`;
        
        await db.query('UPDATE cotizaciones SET numero_documento = ? WHERE id = ?', [numeroDocumentoGenerado, cotizacionId]);

        const sqlDetalle = `
            INSERT INTO detalle_cotizaciones (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal) 
            VALUES (?, ?, ?, ?, ?)`;

        for (const item of items) {
            const subtotalItem = item.precioRaw * item.cantidad;
            await db.query(sqlDetalle, [cotizacionId, item.id, item.cantidad, item.precioRaw, subtotalItem]);
            await db.query('UPDATE productos SET stock = stock - ? WHERE id = ?', [item.cantidad, item.id]);
        }

        res.json({
            success: true,
            idReal: cotizacionId,
            numeroDoc: numeroDocumentoGenerado
        });

    } catch (error) {
        console.error("Error en la transacción de cotización:", error);
        res.status(500).json({ success: false, message: "Fallo interno en el servidor." });
    }
};

// Trae el historial de cotizaciones para la página 6
exports.obtenerHistorialCotizaciones = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cotizaciones ORDER BY id DESC;');
        res.json(rows);
    } catch (error) {
        console.error("Error al buscar historial:", error);
        res.status(500).json({ error: "No se pudo obtener el historial." });
    }
};

// Genera y muestra la plantilla de la cotización con descarga automática directa a PDF
exports.renderCotizacionVisual = async (req, res) => {
    const id = req.params.id;

    try {
        const [cotizaciones] = await db.query('SELECT * FROM cotizaciones WHERE id = ?', [id]);
        if (cotizaciones.length === 0) return res.status(404).send("Cotización no encontrada.");
        const cotizacion = cotizaciones[0];

        const [detalles] = await db.query(`
            SELECT dc.*, p.nombre 
            FROM detalle_cotizaciones dc
            JOIN productos p ON dc.producto_id = p.id
            WHERE dc.cotizacion_id = ?`, [id]);

        let filasTabla = "";
        detalles.forEach(d => {
            filasTabla += `
                <tr class="border-bottom">
                    <td class="py-3 text-dark fw-semibold">${d.nombre}</td>
                    <td class="py-3 text-center text-muted">${d.cantidad}</td>
                    <td class="py-3 text-end text-secondary">$${d.precio_unitario.toLocaleString('es-CL')}</td>
                    <td class="py-3 text-end fw-bold text-dark">$${d.subtotal.toLocaleString('es-CL')}</td>
                </tr>`;
        });

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="/bootstrap-5.3.8-dist/css/bootstrap.min.css">
            <title>Cotización ${cotizacion.numero_documento}</title>
            <style>
                @media print { .no-print { display: none !important; } }
                body { min-height: 100vh; display: flex; flex-direction: column; background-color: #f8f9fa; font-family: sans-serif; }
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            <script>
                function descargarPDFDirecto() {
                    // Seleccionamos el contenedor de la cotización excluyendo la barra de botones
                    const elemento = document.getElementById('area-cotizacion');
                    
                    const opciones = {
                        margin:       0.5,
                        filename:     '${cotizacion.numero_documento}_TechZone.pdf',
                        image:        { type: 'jpeg', quality: 0.98 },
                        html2canvas:  { scale: 2, useCORS: true },
                        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };

                    // Ejecuta la generación y descarga inmediata del archivo
                    html2pdf().set(opciones).from(elemento).save();
                }
            </script>
        </head>
        <body>
            <div class="container my-5" style="max-width: 850px;">
                <div class="d-flex justify-content-between align-items-center mb-4 no-print bg-white p-3 rounded shadow-sm border">
                    <span class="text-muted small">Guardar o imprimir su cotización</span>
                    <div class="d-flex gap-2">
                        <button onclick="descargarPDFDirecto()" class="btn btn-secondary fw-bold shadow-sm px-3">Generar PDF</button>
                        <button onclick="window.print()" class="btn btn-danger fw-bold shadow-sm px-3">Imprimir Documento</button>
                    </div>
                </div>
                
                <div id="area-cotizacion" class="bg-white p-5 rounded shadow-sm border">
                    <div class="row pb-4 mb-4">
                        <div class="col-6">
                            <h2 class="fw-bold text-dark mb-1">TECHZONE SPA</h2>
                            <p class="text-muted small mb-0">Soluciones Integrales en Redes e Infraestructura Ti</p>
                        </div>
                        <div class="col-6 text-end">
                            <h5 class="text-muted uppercase small mb-1">COTIZACIÓN NÚMERO</h5>
                            <h3 class="fw-bold text-danger">${cotizacion.numero_documento}</h3>
                        </div>
                    </div>
                    
                    <div class="row mb-5 border-top pt-4">
                        <div class="col-6">
                            <h6 class="fw-bold text-secondary mb-2">DATOS DE LA EMPRESA EMISORA:</h6>
                            <p class="small text-dark mb-1"><strong>Razón Social:</strong> TechZone SpA</p>
                            <p class="small text-dark mb-1"><strong>Casa Matriz:</strong> Santiago, Chile</p>
                            <p class="small text-dark mb-1"><strong>Contacto:</strong> soporte@techzone.cl</p>
                        </div>
                        <div class="col-6">
                            <h6 class="fw-bold text-secondary mb-2">PRESUPUESTO SOLICITADO POR:</h6>
                            <p class="small text-dark mb-1"><strong>Cliente:</strong> ${cotizacion.cliente_nombre}</p>
                            <p class="small text-dark mb-1"><strong>Email:</strong> ${cotizacion.cliente_email}</p>
                            <p class="small text-dark mb-1"><strong>Teléfono:</strong> ${cotizacion.cliente_telefono || 'No registrado'}</p>
                        </div>
                    </div>

                    <table class="table align-middle mb-4 small">
                        <thead class="table-light text-secondary">
                            <tr>
                                <th>Descripción del Hardware / Componente</th>
                                <th class="text-center">Cant.</th>
                                <th class="text-end">P. Unitario</th>
                                <th class="text-end">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${filasTabla}</tbody>
                    </table>
                    
                    <div class="row justify-content-end mb-4">
                        <div class="col-5">
                            <table class="table table-sm table-borderless small">
                                <tr class="border-bottom"><td class="text-muted py-2">Monto Neto:</td><td class="text-end text-dark py-2">$${cotizacion.monto_neto.toLocaleString('es-CL')}</td></tr>
                                <tr class="border-bottom"><td class="text-muted py-2">IVA (19%):</td><td class="text-end text-dark py-2">$${cotizacion.monto_iva.toLocaleString('es-CL')}</td></tr>
                                <tr class="fs-5"><td class="fw-bold text-dark py-2">Total General:</td><td class="text-end fw-bold text-success py-2">$${cotizacion.total_general.toLocaleString('es-CL')}</td></tr>
                            </table>
                        </div>
                    </div>
                    
                    <div style="font-size: 0.75rem; line-height: 1.5;" class="p-3 bg-light border rounded text-muted">
                        <strong>Garantía:</strong> 6 meses de respaldo directo por fallas de hardware en TechZone SpA.
                    </div>
                </div>
            </div>
        </body>
        </html>`);
    } catch (error) {
        console.error("Error al compilar la cotización visual:", error);
        res.status(500).send("Fallo crítico al compilar la plantilla visual.");
    }
};