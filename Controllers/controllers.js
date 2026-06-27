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
 * 2. CONTROLADORES DE LÓGICA Y DATOS (API)
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
        res.status(500).json({ error: 'Fallo al sincronizar el catálogo.' });
    }
};

exports.agregarInventario = async (req, res) => {
    const { producto_id, cantidad } = req.body;
    const usuario_id = 1;
    try {
        await db.query('INSERT INTO movimientos_stock (producto_id, usuario_id, cantidad) VALUES (?, ?, ?);', [producto_id, usuario_id, cantidad]);
        await db.query('UPDATE productos SET stock = stock + ? WHERE id = ?;', [cantidad, producto_id]);
        res.json({ success: true, message: '¡Inventario actualizado con éxito!' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno al procesar stock.' });
    }
};

exports.procesarVenta = async (req, res) => {
    const { items, total } = req.body;
    const usuario_id = 3;
    try {
        const [resultVenta] = await db.query('INSERT INTO ventas (usuario_id, total) VALUES (?, ?);', [usuario_id, total]);
        const nuevaVentaId = resultVenta.insertId;
        for (const item of items) {
            await db.query('INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?);', [nuevaVentaId, item.id, item.cantidad, item.precioRaw]);
            await db.query('UPDATE productos SET stock = stock - ? WHERE id = ?;', [item.cantidad, item.id]);
        }
        res.json({ success: true, message: `Venta procesada. Folio: #${nuevaVentaId}` });
    } catch (error) {
        res.status(500).json({ error: 'Fallo crítico en la venta.' });
    }
};

// EMISIÓN TRANSACCIONAL Y VALIDACIÓN
exports.validarDatosCotizacion = async (req, res) => {
    const { nombre, email, telefono, neto, iva, total, items } = req.body;

    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,100}$/;
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const regexTelefono = /^(\+?56)?9\d{8}$/;

    if (!nombre || !regexNombre.test(nombre.trim())) {
        return res.status(400).json({ success: false, message: "El nombre debe ser válido (mínimo 3 caracteres)." });
    }
    if (!email || !regexEmail.test(email.trim())) {
        return res.status(400).json({ success: false, message: "El formato del correo electrónico no es válido." });
    }
    if (!telefono || !regexTelefono.test(telefono.trim())) {
        return res.status(400).json({ success: false, message: "El teléfono debe ser un celular válido en Chile." });
    }
    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: "No se pueden procesar cotizaciones vacías." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const item of items) {
            const [prodRows] = await connection.query('SELECT stock, nombre FROM productos WHERE id = ?', [item.id]);
            if (prodRows.length === 0) throw new Error(`El componente con ID ${item.id} no existe.`);
            if (prodRows[0].stock < item.cantidad) {
                throw new Error(`Stock insuficiente para "${prodRows[0].nombre}".`);
            }
        }

        const finalNeto = neto || 0;
        const finalIva = iva || Math.round(finalNeto * 0.19);
        const finalTotal = total || (finalNeto + finalIva);

        // Almacenamos provisionalmente el nombre en el campo de texto si no tienes la columna alterada en BD
        const [resultadoCabecera] = await connection.query(
            `INSERT INTO cotizaciones (numero_documento, cliente_email, cliente_telefono, monto_neto, monto_iva, total_general, fecha_emision)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`, 
            ['PENDIENTE', email.trim(), telefono.trim(), finalNeto, finalIva, finalTotal]
        );
        
        const cotizacionId = resultadoCabecera.insertId;
        const numeroDocFormat = `#000${cotizacionId}`;
        
        await connection.query('UPDATE cotizaciones SET numero_documento = ? WHERE id = ?', [numeroDocFormat, cotizacionId]);

        for (const item of items) {
            const subtotalItem = item.precioRaw * item.cantidad;
            await connection.query(
                `INSERT INTO detalle_cotizaciones (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`,
                [cotizacionId, item.id, item.cantidad, item.precioRaw, subtotalItem]
            );
            await connection.query(`UPDATE productos SET stock = stock - ? WHERE id = ?`, [item.cantidad, item.id]);
        }

        await connection.commit();
        return res.json({ success: true, idReal: cotizacionId, numeroDoc: numeroDocFormat });

    } catch (error) {
        await connection.rollback();
        return res.status(500).json({ success: false, message: error.message || "Error interno de base de datos." });
    } finally {
        connection.release();
    }
};

exports.obtenerHistorialCotizaciones = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cotizaciones ORDER BY id DESC;');
        return res.json({ success: true, cotizaciones: rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error al consultar el historial." });
    }
};

// MOTOR MAESTRO RENDERIZADOR DINÁMICO AL VUELO (CON NOMBRE PERSONALIZADO)
exports.renderizarCotizacionAlVuelo = async (req, res) => {
    const { id } = req.params;
    // Capturamos el nombre desde los parámetros query opcionales (?nombre=...) enviado por el cliente
    const nombreClienteQuery = req.query.nombre || "Cliente Registrado";

    try {
        const [cotizacionRows] = await db.query('SELECT * FROM cotizaciones WHERE id = ?', [id]);
        if (cotizacionRows.length === 0) return res.status(404).send("La cotización solicitada no existe.");
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
                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-family: monospace;">ID-${item.producto_id}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #212529;">${item.nombre}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: center;">${item.cantidad} u.</td>
                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right;">$${item.precio_unitario.toLocaleString('es-CL')}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: right; font-weight: 600; color: #212529;">$${item.subtotal.toLocaleString('es-CL')}</td>
                </tr>`;
        });

        const plantillaHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <link rel="stylesheet" href="/bootstrap-5.3.8-dist/css/bootstrap.min.css">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
            <title>Cotización_${cotizacion.numero_documento}</title>
            <style>
                body { background-color: #f8f9fa; padding: 30px; }
                .contenedor-impresion { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.05); }
                @media print {
                    body { background: white; padding: 0; }
                    .contenedor-impresion { box-shadow: none; padding: 0; max-width: 100%; }
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div class="no-print text-center mb-4">
                <button onclick="window.print()" class="btn btn-danger btn-lg fw-bold px-5 shadow-sm">
                    <i class="bi bi-printer-fill me-2"></i> Imprimir o Guardar en PDF
                </button>
            </div>

            <div class="contenedor-impresion">
                <div class="row align-items-center border-bottom pb-3 mb-4">
                    <div class="col-7">
                        <h2 class="text-primary fw-bold mb-1"><i class="bi bi-hdd-network-fill"></i> TechZone SpA</h2>
                        <p class="text-muted mb-0 small fw-semibold">Soluciones de Infraestructura & Componentes TI</p>
                    </div>
                    <div class="col-5 text-end text-muted small" style="font-size: 0.82rem; line-height: 1.4;">
                        <strong>R.U.T.:</strong> 76.248.931-K<br>
                        <strong>Dirección:</strong> Av. Providencia 1245, Oficina 402, Santiago<br>
                        <strong>Fono:</strong> +56 2 2749 8300<br>
                        <strong>Contacto:</strong> ventas@techzone.cl
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-6 align-self-end">
                        <h4 class="fw-bold text-dark mb-0">COTIZACIÓN PRESUPUESTARIA</h4>
                    </div>
                    <div class="col-6 text-end text-muted small">
                        <p class="mb-1"><strong>N° Documento:</strong> ${cotizacion.numero_documento}</p>
                        <p class="mb-0"><strong>Fecha Emisión:</strong> ${hoy.toLocaleDateString('es-CL')}</p>
                    </div>
                </div>

                <div class="card border mb-4 shadow-none" style="background-color: #fafafa;">
                    <div class="card-header py-2 bg-light border-bottom">
                        <h6 class="fw-bold text-secondary mb-0" style="font-size: 0.9rem;">Datos del Destinatario / Cliente</h6>
                    </div>
                    <div class="card-body p-3">
                        <div class="row g-3 small">
                            <div class="col-6">
                                <p class="mb-2"><strong>Señor(a):</strong> <span class="text-dark fw-bold">${decodeURIComponent(nombreClienteQuery)}</span></p>
                                <p class="mb-2"><strong>Email:</strong> <span class="text-muted">${cotizacion.cliente_email}</span></p>
                                <p class="mb-0"><strong>Válido hasta:</strong> <span class="text-muted">${validez.toLocaleDateString('es-CL')}</span> (15 días)</p>
                            </div>
                            <div class="col-6">
                                <p class="mb-2"><strong>Teléfono:</strong> <span class="text-muted">${cotizacion.cliente_telefono}</span></p>
                                <p class="mb-0"><strong>Moneda:</strong> <span class="text-muted">Pesos Chilenos (CLP)</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <table class="table align-middle border" style="font-size: 0.9rem;">
                    <thead class="table-light border-bottom">
                        <tr class="text-secondary text-uppercase small" style="font-size: 0.75rem;">
                            <th style="width: 15%;">ID</th>
                            <th style="width: 45%;">Descripción del Componente Técnico</th>
                            <th class="text-center" style="width: 10%;">Cantidad</th>
                            <th class="text-end" style="width: 15%;">P. Unitario</th>
                            <th class="text-end" style="width: 15%;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasTabla}
                    </tbody>
                </table>

                <div class="row justify-content-end mb-5">
                    <div class="col-5">
                        <table class="table table-sm table-borderless small mb-0">
                            <tbody>
                                <tr class="border-bottom">
                                    <td class="text-muted fw-semibold py-2">Monto Neto:</td>
                                    <td class="text-end fw-semibold text-dark py-2">$${cotizacion.monto_neto.toLocaleString('es-CL')}</td>
                                </tr>
                                <tr class="border-bottom">
                                    <td class="text-muted fw-semibold py-2">IVA (19%):</td>
                                    <td class="text-end fw-semibold text-dark py-2">$${cotizacion.monto_iva.toLocaleString('es-CL')}</td>
                                </tr>
                                <tr style="font-size: 1.15rem;">
                                    <td class="fw-bold text-dark py-2">Total General:</td>
                                    <td class="text-end fw-bold text-success py-2">$${cotizacion.total_general.toLocaleString('es-CL')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="font-size: 0.75rem; line-height: 1.5; background-color: #fcfcfc;" class="p-3 border rounded text-muted">
                    <h6 class="fw-bold text-dark mb-2" style="font-size: 0.8rem;">Términos, Condiciones de Venta y Garantías:</h6>
                    <ol class="ps-3 mb-0">
                        <li class="mb-1">Los precios indicados no incluyen costos de despacho ni seguros de transporte externo.</li>
                        <li class="mb-1">El stock se reserva estrictamente por un plazo de 48 horas desde la emisión de este documento.</li>
                        <li class="mb-1">Todos los componentes de hardware comercializados cuentan con garantía legal de 6 meses directamente con TechZone SpA.</li>
                        <li class="mb-0">Las transacciones se realizan mediante transferencia bancaria electrónica.</li>
                    </ol>
                </div>
            </div>
        </body>
        </html>`;

        return res.send(plantillaHtml);
    } catch (error) {
        return res.status(500).send("Error crítico al compilar el visor del archivo gráfico.");
    }
};