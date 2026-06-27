const path = require('path');
const db = require('../Config/db');

/**
 * -------------------------------------------------------------------
 * 1. CONTROLADORES DE VISTAS (PÁGINAS HTML)
 * -------------------------------------------------------------------
 */
exports.renderindex = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'index.html'));
exports.renderPagina2 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina2.html'));
exports.renderPagina3 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina3.html'));
exports.renderPagina4 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina4.html'));
exports.renderPagina5 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina5.html'));
exports.renderPagina6 = (req, res) => res.sendFile(path.resolve(__dirname, '..', 'Views', 'pagina6.html'));

/**
 * -------------------------------------------------------------------
 * 2. ENDPOINTS DE LA API (LÓGICA DE NEGOCIO REFACTORIZADA)
 * -------------------------------------------------------------------
 */

exports.getProductosFormateados = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM productos ORDER BY id DESC;');
        const productosFinales = rows.map(p => ({
            id: p.id,
            nombre: p.nombre,
            categoria: p.categoria,
            stock: p.stock,
            precioRaw: p.precio,
            precioFormateado: `$${p.precio.toLocaleString('es-CL')}`
        }));
        res.json(productosFinales);
    } catch (error) {
        res.status(500).json({ error: 'Fallo al sincronizar el catálogo corporativo.' });
    }
};

exports.agregarInventario = async (req, res) => {
    const { producto_id, cantidad } = req.body;
    try {
        await db.query('INSERT INTO movimientos_stock (producto_id, usuario_id, cantidad) VALUES (?, 1, ?);', [producto_id, cantidad]);
        await db.query('UPDATE productos SET stock = stock + ? WHERE id = ?;', [cantidad, producto_id]);
        res.json({ success: true, message: 'Inventario actualizado con éxito.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar movimiento de stock.' });
    }
};

exports.procesarVenta = async (req, res) => {
    const { items, total } = req.body;
    try {
        const [resultVenta] = await db.query('INSERT INTO ventas (usuario_id, total) VALUES (3, ?);', [total]);
        const nuevaVentaId = resultVenta.insertId;
        for (const item of items) {
            await db.query('INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?);', [nuevaVentaId, item.id, item.cantidad, item.precioRaw]);
            await db.query('UPDATE productos SET stock = stock - ? WHERE id = ?;', [item.cantidad, item.id]);
        }
        res.json({ success: true, message: `Venta procesada con éxito. Folio: #${nuevaVentaId}` });
    } catch (error) {
        res.status(500).json({ error: 'Fallo crítico al asentar la venta.' });
    }
};

// PERSISTENCIA COMPLETA DEL NOMBRE EN LA INSERCIÓN TRANSACCIONAL
exports.validarDatosCotizacion = async (req, res) => {
    const { nombre, email, telefono, neto, iva, total, items } = req.body;

    if (!nombre || nombre.trim().length < 3) {
        return res.status(400).json({ success: false, message: "Nombre del solicitante no válido." });
    }
    if (!email || !/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
        return res.status(400).json({ success: false, message: "Formato de correo electrónico inválido." });
    }
    if (!telefono || !/^(\+?56)?9\d{8}$/.test(telefono.trim())) {
        return res.status(400).json({ success: false, message: "Teléfono celular inválido." });
    }
    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: "El carrito se encuentra vacío." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Control estricto de Stock
        for (const item of items) {
            const [prodRows] = await connection.query('SELECT stock FROM productos WHERE id = ?', [item.id]);
            if (prodRows.length === 0 || prodRows[0].stock < item.cantidad) {
                throw new Error(`Stock insuficiente para procesar la orden.`);
            }
        }

        // Inserción en cabecera incluyendo la nueva columna 'cliente_nombre'
        const [resultadoCabecera] = await connection.query(
            `INSERT INTO cotizaciones (numero_documento, cliente_nombre, cliente_email, cliente_telefono, monto_neto, monto_iva, total_general, fecha_emision)
             VALUES ('PENDIENTE', ?, ?, ?, ?, ?, ?, NOW())`, 
            [nombre.trim(), email.trim(), telefono.trim(), neto, iva, total]
        );
        
        const cotizacionId = resultadoCabecera.insertId;
        const numeroDocFormat = `#000${cotizacionId}`;
        
        // Actualizar el folio oficial consecutivo
        await connection.query('UPDATE cotizaciones SET numero_documento = ? WHERE id = ?', [numeroDocFormat, cotizacionId]);

        // Inserción de detalles y rebaja automatizada de stock técnico
        for (const item of items) {
            await connection.query(
                `INSERT INTO detalle_cotizaciones (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`,
                [cotizacionId, item.id, item.cantidad, item.precioRaw, (item.precioRaw * item.cantidad)]
            );
            await connection.query(`UPDATE productos SET stock = stock - ? WHERE id = ?`, [item.cantidad, item.id]);
        }

        await connection.commit();
        return res.json({ success: true, idReal: cotizacionId, numeroDoc: numeroDocFormat });

    } catch (error) {
        await connection.rollback();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.obtenerHistorialCotizaciones = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cotizaciones ORDER BY id DESC;');
        return res.json({ success: true, cotizaciones: rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Fallo al consultar el historial de documentos." });
    }
};

// VISOR PDF TOTALMENTE PERSISTENTE CON LA NUEVA ESTRUCTURA DB
exports.renderizarCotizacionAlVuelo = async (req, res) => {
    const { id } = req.params;
    try {
        const [cotizacionRows] = await db.query('SELECT * FROM cotizaciones WHERE id = ?', [id]);
        if (cotizacionRows.length === 0) return res.status(404).send("La cotización no existe.");
        const cotizacion = cotizacionRows[0];

        const [detalleRows] = await db.query(
            `SELECT d.*, p.nombre FROM detalle_cotizaciones d 
             JOIN productos p ON d.producto_id = p.id WHERE d.cotizacion_id = ?`, [id]
        );

        const hoy = new Date(cotizacion.fecha_emision);
        const validez = new Date(cotizacion.fecha_emision);
        validez.setDate(hoy.getDate() + 15);

        let filasTabla = '';
        detalleRows.forEach(item => {
            filasTabla += `
                <tr style="color: #555;">
                    <td style="padding: 8px; border-bottom: 1px solid #dee2e6; font-family: monospace;">ID-${item.producto_id}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #212529;">${item.nombre}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: center;">${item.cantidad} u.</td>
                    <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: right;">$${item.precio_unitario.toLocaleString('es-CL')}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: right; font-weight: 600; color: #212529;">$${item.subtotal.toLocaleString('es-CL')}</td>
                </tr>`;
        });

        res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="/bootstrap-5.3.8-dist/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
            <title>Cotización_${cotizacion.numero_documento}</title>
            <style>
                body { background-color: #f8f9fa; padding: 30px; }
                .contenedor-impresion { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
                @media print { body { background: white; padding: 0; } .contenedor-impresion { box-shadow: none; padding: 0; max-width: 100%; } .no-print { display: none !important; } }
            </style>
        </head>
        <body>
            <div class="no-print text-center mb-4">
                <button onclick="window.print()" class="btn btn-danger btn-lg fw-bold px-5 shadow-sm"><i class="bi bi-printer-fill me-2"></i> Imprimir / Guardar PDF</button>
            </div>
            <div class="contenedor-impresion">
                <div class="row align-items-center border-bottom pb-3 mb-4">
                    <div class="col-7">
                        <h2 class="text-primary fw-bold mb-1"><i class="bi bi-hdd-network-fill"></i> TechZone SpA</h2>
                        <p class="text-muted mb-0 small fw-semibold">Soluciones de Infraestructura & Componentes TI</p>
                    </div>
                    <div class="col-5 text-end text-muted small" style="font-size: 0.82rem;">
                        <strong>R.U.T.:</strong> 76.248.931-K<br><strong>Dirección:</strong> Av. Providencia 1245, Santiago<br><strong>Contacto:</strong> ventas@techzone.cl
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-6"><h4 class="fw-bold text-dark mb-0">COTIZACIÓN</h4></div>
                    <div class="col-6 text-end text-muted small">
                        <strong>N° Documento:</strong> ${cotizacion.numero_documento}<br><strong>Fecha Emisión:</strong> ${hoy.toLocaleDateString('es-CL')}
                    </div>
                </div>
                <div class="card border mb-4 shadow-none" style="background-color: #fafafa;">
                    <div class="card-header py-2 bg-light border-bottom"><h6 class="fw-bold text-secondary mb-0 small">Datos del Destinatario</h6></div>
                    <div class="card-body p-3 small">
                        <div class="row">
                            <div class="col-6">
                                <strong>Señor(a):</strong> <span class="text-dark fw-bold">${cotizacion.cliente_nombre}</span><br>
                                <strong>Email:</strong> ${cotizacion.cliente_email}<br>
                                <strong>Válido hasta:</strong> ${validez.toLocaleDateString('es-CL')}
                            </div>
                            <div class="col-6"><strong>Teléfono:</strong> ${cotizacion.cliente_telefono}<br><strong>Moneda:</strong> Pesos Chilenos (CLP)</div>
                        </div>
                    </div>
                </div>
                <table class="table align-middle border small">
                    <thead class="table-light">
                        <tr class="text-secondary text-uppercase" style="font-size: 0.75rem;">
                            <th>ID</th><th>Descripción</th><th class="text-center">Cant.</th><th class="text-end">P. Unitario</th><th class="text-end">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${filasTabla}</tbody>
                </table>
                <div class="row justify-content-end mb-5">
                    <div class="col-5">
                        <table class="table table-sm table-borderless small">
                            <tr class="border-bottom"><td class="text-muted py-2">Monto Neto:</td><td class="text-end text-dark py-2">$${cotizacion.monto_neto.toLocaleString('es-CL')}</td></tr>
                            <tr class="border-bottom"><td class="text-muted py-2">IVA (19%):</td><td class="text-end text-dark py-2">$${cotizacion.monto_iva.toLocaleString('es-CL')}</td></tr>
                            <tr class="fs-5"><td class="fw-bold text-dark py-2">Total:</td><td class="text-end fw-bold text-success py-2">$${cotizacion.total_general.toLocaleString('es-CL')}</td></tr>
                        </table>
                    </div>
                </div>
            </div>
        </body>
        </html>`);
    } catch (error) {
        res.status(500).send("Error interno al compilar el visor.");
    }
};