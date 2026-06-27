const path = require('path');
const db = require('../Config/db'); // Asegúrate de que la carpeta se llame 'Config' con C mayúscula

/**
 * -------------------------------------------------------------------
 * 1. CONTROLADORES DE VISTAS (PÁGINAS HTML)
 * -------------------------------------------------------------------
 */

exports.renderindex = (req, res) => res.sendFile(path.resolve(__dirname), 'Views', 'index.html');
exports.renderPagina2 = (req, res) => res.sendFile(path.resolve(__dirname), 'Views', 'pagina2.html');
exports.renderPagina3 = (req, res) => res.sendFile(path.resolve(__dirname), 'Views', 'pagina3.html');
exports.renderPagina4 = (req, res) => res.sendFile(path.resolve(__dirname), 'Views', 'pagina4.html');
exports.renderPagina5 = (req, res) => res.sendFile(path.resolve(__dirname), 'Views', 'pagina5.html');

/**
 * -------------------------------------------------------------------
 * 2. CONTROLADORES DE LÓGICA Y DATOS (API)
 * -------------------------------------------------------------------
 */

// Obtener productos desde MySQL y procesar con JavaScript
exports.getProductosFormateados = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM productos ORDER BY id DESC;');

        const productosFinales = rows.map(p => {
            return {
                id: p.id,
                nombre: p.nombre,
                categoria: p.categoria,
                stock: p.stock,
                // Entregamos el valor bruto de la base de datos a ambos campos
                precioRaw: p.precio,
                precioFormateado: `$${p.precio.toLocaleString('es-CL')}`
            };
        });

        res.json(productosFinales);
    } catch (error) {
        console.error("Error en getProductosFormateados:", error);
        res.status(500).json({ error: 'Fallo al sincronizar el catálogo.' });
    }
};

// POST: El Administrador añade stock desde la Consola (Pagina 4)
exports.agregarInventario = async (req, res) => {
    const { producto_id, cantidad } = req.body;
    const usuario_id = 1; // ID ficticio de Nicolás Admin (mientras dejamos el login para el final)

    try {
        // 1. Registrar la auditoría del movimiento en la base de datos
        await db.query(
            'INSERT INTO movimientos_stock (producto_id, usuario_id, cantidad) VALUES (?, ?, ?);',
            [producto_id, usuario_id, cantidad]
        );

        // 2. Transacción: Sumar el stock al producto correspondiente
        await db.query(
            'UPDATE productos SET stock = stock + ? WHERE id = ?;',
            [cantidad, producto_id]
        );

        res.json({ success: true, message: '¡Inventario actualizado y registrado con éxito!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al procesar la carga de stock.' });
    }
};

// POST: El Cliente ejecuta la compra desde el Cotizador (Pagina 5)
exports.procesarVenta = async (req, res) => {
    const { items, total } = req.body; // "items" será un array de productos seleccionados
    const usuario_id = 3; // ID ficticio de Juan Cliente (hasta que hagamos las sesiones)

    try {
        // 1. Crear la cabecera de la venta
        const [resultVenta] = await db.query(
            'INSERT INTO ventas (usuario_id, total) VALUES (?, ?);',
            [usuario_id, total]
        );
        const nuevaVentaId = resultVenta.insertId;

        // 2. Recorrer los productos comprados para descontar stock e insertar detalles
        for (const item of items) {
            // Insertar detalle de venta
            await db.query(
                'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?);',
                [nuevaVentaId, item.id, item.cantidad, item.precioRaw]
            );

            // Rebajar el stock físico en la tabla maestra
            await db.query(
                'UPDATE productos SET stock = stock - ? WHERE id = ?;',
                [item.cantidad, item.id]
            );
        }

        res.json({ success: true, message: `Venta procesada con éxito. Folio generado: #${nuevaVentaId}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fallo crítico al descontar stock o registrar la venta.' });
    }
};


exports.validarDatosCotizacion = async (req, res) => {
    // El cliente ya no envía cálculos, solo los datos del formulario y el carrito básico
    const { nombre, email, telefono, items } = req.body;

    // == 1. CAPA DE VALIDACIÓN CON EXPRESIONES REGULARES ==
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

        let netoAcumulado = 0;
        const detallesCalculados = [];

        // == 2. VERIFICACIÓN DE EXISTENCIAS Y CÁLCULOS EN EL SERVIDOR ==
        for (const item of items) {
            const [prodRows] = await connection.query('SELECT precio, stock, nombre FROM productos WHERE id = ?', [item.id]);
            if (prodRows.length === 0) throw new Error(`El componente con ID ${item.id} no existe.`);

            const productoBD = prodRows[0];
            if (productoBD.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para "${productoBD.nombre}". Disponible: ${productoBD.stock} u.`);
            }

            // Calculamos el subtotal usando el precio verídico e inalterable de la BD
            const subtotalItem = productoBD.precio * item.cantidad;
            netoAcumulado += subtotalItem;

            // Almacenamos el desglose para devolverlo estructurado al frontend
            detallesCalculados.push({
                id: item.id,
                nombre: productoBD.nombre,
                cantidad: item.cantidad,
                precioUnitario: productoBD.precio,
                subtotal: subtotalItem
            });
        }

        const ivaCalculado = Math.round(netoAcumulado * 0.19);
        const totalGeneral = netoAcumulado + ivaCalculado;

        // == 3. PERSISTENCIA DE LA TRANSACCIÓN EN MYSQL ==
        const queryCabecera = `
            INSERT INTO cotizaciones (numero_documento, cliente_email, cliente_telefono, monto_neto, monto_iva, total_general, fecha_emision)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const [resultadoCabecera] = await connection.query(queryCabecera, ['PENDIENTE', email.trim(), telefono.trim(), netoAcumulado, ivaCalculado, totalGeneral]);

        const cotizacionId = resultadoCabecera.insertId;
        const numeroDocFormat = `#000${cotizacionId}`;

        // Sincronizamos la fila con su número de documento real basado en el ID correlativo
        await connection.query('UPDATE cotizaciones SET numero_documento = ? WHERE id = ?', [numeroDocFormat, cotizacionId]);

        const queryDetalle = `
            INSERT INTO detalle_cotizaciones (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal)
            VALUES (?, ?, ?, ?, ?)
        `;
        const queryActualizarStock = `UPDATE productos SET stock = stock - ? WHERE id = ?`;

        for (const detalle of detallesCalculados) {
            await connection.query(queryDetalle, [cotizacionId, detalle.id, detalle.cantidad, detalle.precioUnitario, detalle.subtotal]);
            await connection.query(queryActualizarStock, [detalle.cantidad, detalle.id]);
        }

        await connection.commit();

        // RETORNAMOS TODA LA INFORMACIÓN CALCULADA OFICIAL Y EL ID CORRELATIVO
        return res.json({
            success: true,
            message: "Cotización registrada con éxito.",
            numeroDoc: numeroDocFormat,
            neto: netoAcumulado,
            iva: ivaCalculado,
            total: totalGeneral,
            detalles: detallesCalculados // Enviamos el array listo para mapear en el PDF
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        return res.status(500).json({ success: false, message: error.message || "Error interno del servidor." });
    } finally {
        connection.release();
    }
};

// 1. NUEVO MÉTODO: Trae el listado histórico de cotizaciones para el visor
exports.obtenerHistorialCotizaciones = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cotizaciones ORDER BY id DESC;');
        return res.json({ success: true, cotizaciones: rows });
    } catch (error) {
        console.error("Error al obtener historial:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};

// 2. NUEVO MÉTODO: Genera "al vuelo" el documento imprimible al pulsar el ícono
exports.renderizarCotizacionAlVuelo = async (req, res) => {
    const { id } = req.params; // Capturamos el ID desde la URL (ej: /cotizacion/ver/5)

    try {
        // A. Buscamos la cabecera de la cotización
        const [cotizacionRows] = await db.query('SELECT * FROM cotizaciones WHERE id = ?', [id]);
        if (cotizacionRows.length === 0) return res.status(404).send("La cotización solicitada no existe.");
        const cotizacion = cotizacionRows[0];

        // B. Buscamos el desglose uniendo (JOIN) con la tabla productos para obtener los nombres reales
        const [detalleRows] = await db.query(
            `SELECT d.*, p.nombre FROM detalle_cotizaciones d JOIN productos p ON d.producto_id = p.id WHERE d.cotizacion_id = ?`, [id]
        );

        // C. Construimos una plantilla HTML limpia y optimizada para impresión (Tamaño Carta)
        let filasTabla = '';
        detalleRows.forEach(d => {
            filasTabla += `
                <tr style="color: #444;">
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">ID-${d.producto_id}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: 600;">${d.nombre}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${d.cantidad} u.</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${d.precio_unitario.toLocaleString('es-CL')}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: 600;">$${d.subtotal.toLocaleString('es-CL')}</td>
                </tr>`;
        });

        const plantillaHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Cotización Oficial ${cotizacion.numero_documento}</title>
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #2b3e50; padding-bottom: 20px; }
                .header h1 { margin: 0; color: #2b3e50; font-size: 26px; }
                .info-block { margin-top: 30px; margin-bottom: 30px; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background-color: #2b3e50; color: white; padding: 12px; text-align: left; font-size: 14px; }
                .totales { text-align: right; margin-top: 30px; font-size: 15px; }
                .totales p { margin: 5px 0; }
                .btn-print { background-color: #e74c3c; color: white; border: none; padding: 12px 25px; font-size: 15px; font-weight: bold; border-radius: 5px; cursor: pointer; margin-top: 40px; }
                @media print { .no-print { display: none; } body { padding: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>TECHZONE SpA</h1>
                <div style="text-align: right;">
                    <h3 style="margin: 0; color: #e74c3c;">COTIZACIÓN</h3>
                    <p style="margin: 5px 0 0 0; font-weight: bold;">${cotizacion.numero_documento}</p>
                </div>
            </div>
            
            <div class="info-block">
                <p>
                    <strong>Destinatario / Email:</strong> ${cotizacion.cliente_email}<br>
                    <strong>Teléfono de Contacto:</strong> ${cotizacion.cliente_telefono}<br>
                    <strong>Fecha de Emisión:</strong> ${new Date(cotizacion.fecha_emision).toLocaleDateString('es-CL')}
                </p>
            </div>           
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">Código</th>
                        <th style="width: 45%;">Componente Técnico</th>
                        <th style="width: 10%; text-align: center;">Cant.</th>
                        <th style="width: 15%; text-align: right;">P. Unitario</th>
                        <th style="width: 15%; text-align: right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasTabla}
                </tbody>
            </table>
            <div class="totales">
                <p>Neto Acumulado: <strong>$${cotizacion.monto_neto.toLocaleString('es-CL')}</strong></p>
                <p>IVA (19%): <strong>$${cotizacion.monto_iva.toLocaleString('es-CL')}</strong></p>
                <p style="font-size: 20px; color: #2b3e50; margin-top: 10px;">Total General: <strong>$${cotizacion.total_general.toLocaleString('es-CL')}</strong></p>
            </div>
            <div style="text-center: center; text-align: center;" class="no-print">
                <button onclick="window.print()" class="btn-print">Imprimir / Guardar en PDF</button>
            </div>
        </body>
        </html>`;
        // Enviamos el HTML directo al navegador para que se visualice
        return res.send(plantillaHtml);

    } catch (error) {
        console.error("Error al generar vista de cotización:", error);
        return res.status(500).send("Error interno al renderizar el documento técnico.");
    }
};
