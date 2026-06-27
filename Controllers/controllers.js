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


// Validación con expresiones regulares manteniendo la estructura MVC
exports.validarDatosCotizacion = (req, res) => {
    const { email, telefono } = req.body;

    // 1. EXPRESIONES REGULARES (Reglas de negocio)
    // Regex estándar para correos electrónicos
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Regex chileno: Acepta +569XXXXXXXX o 9XXXXXXXX (9 dígitos celulares)
    const regexTelefono = /^(\+?56)?9\d{8}$/;

    // 2. Evaluamos el Correo
    if (!email || !regexEmail.test(email.trim())) {
        return res.status(400).json({ 
            success: false, 
            message: "El formato del correo electrónico no es válido (ejemplo@correo.cl)." 
        });
    }

    // 3. Evaluamos el Teléfono
    if (!telefono || !regexTelefono.test(telefono.trim())) {
        return res.status(400).json({ 
            success: false, 
            message: "El teléfono debe ser un celular válido en Chile (+569XXXXXXXX o 9XXXXXXXX)." 
        });
    }

    // 4. Si pasa todas las reglas del negocio, respondemos con éxito
    return res.json({ 
        success: true, 
        message: "Datos validados correctamente por el Controlador." 
    });
};

exports.validarYRegistrarCotizacion = async (req, res) => {
    // 1. Recibir los datos estructurados desde el Frontend
    const { numeroDoc, nombre, email, telefono, neto, iva, total, items } = req.body;

    // == VALIDACIONES CON EXPRESIONES REGULARES ==
    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,100}$/;
    const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const regexTelefono = /^(\+?56)?9\d{8}$/; // Formato celular chileno

    if (!nombre || !regexNombre.test(nombre.trim())) {
        return res.status(400).json({ success: false, message: "El nombre debe ser válido y tener al menos 3 caracteres." });
    }
    if (!email || !regexEmail.test(email.trim())) {
        return res.status(400).json({ success: false, message: "El formato del correo electrónico no es válido." });
    }
    if (!telefono || !regexTelefono.test(telefono.trim())) {
        return res.status(400).json({ success: false, message: "El teléfono debe ser un celular válido en Chile (+569XXXXXXXX)." });
    }
    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: "No se pueden registrar cotizaciones sin componentes en el carrito." });
    }

    // Obtener una conexión del pool para manejar la Transacción (Garantiza consistencia absoluta)
    const connection = await db.getConnection();

    try {
        // Iniciar la transacción
        await connection.beginTransaction();

        // == A. VERIFICACIÓN PREVIA DE STOCK ==
        // Validamos que haya existencias suficientes de todos los productos antes de alterar nada
        for (const item of items) {
            const [prodRows] = await connection.query(
                'SELECT stock, nombre FROM productos WHERE id = ?',[item.id]
            );

            if (prodRows.length === 0) {
                throw new Error(`El producto con ID ${item.id} no existe en el catálogo.`);
            }

            const productoBD = prodRows[0];
            if (productoBD.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para "${productoBD.nombre}". Disponible: ${productoBD.stock} u., Solicitado: ${item.cantidad} u.`);
            }
        }

        // == B. INSERTAR CABECERA DE LA COTIZACIÓN ==
        const queryCabecera = `
            INSERT INTO cotizaciones (numero_documento, cliente_email, cliente_telefono, monto_neto, monto_iva, total_general, fecha_emision)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        const [resultadoCabecera] = await connection.query(queryCabecera, [
            numeroDoc, 
            email.trim(), 
            telefono.trim(), 
            neto, 
            iva, 
            total
        ]);
        
        const cotizacionId = resultadoCabecera.insertId;

        // == C. DETALLES Y REBAJA DE STOCK ==
        const queryDetalle = `INSERT INTO detalle_cotizaciones (cotizacion_id, producto_id, cantidad, precio_unitario, subtotal)
            VALUES (?, ?, ?, ?, ?)
        `;
        const queryActualizarStock = `
            UPDATE productos 
            SET stock = stock - ? 
            WHERE id = ?
        `;

        for (const item of items) {
            const subtotalItem = item.precioRaw * item.cantidad;

            // 1. Insertar el renglón del detalle
            await connection.query(queryDetalle, [
                cotizacionId, 
                item.id, 
                item.cantidad, 
                item.precioRaw, 
                subtotalItem
            ]);

            // 2. Rebajar físicamente el stock en la tabla productos
            await connection.query(queryActualizarStock, [
                item.cantidad, 
                item.id
            ]);
        }

        // Si todo anduvo perfecto, confirmamos los cambios de forma permanente en MySQL
        await connection.commit();

        return res.json({ 
            success: true, 
            message: `Cotización ${numeroDoc} guardada con éxito y stock actualizado.` 
        });

    } catch (error) {
        // Si algo falla (ej. se acaba el stock a mitad de camino), deshacemos todo para evitar datos corruptos
        await connection.rollback();
        console.error("Error en la transacción de cotización:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || "Error interno del servidor al procesar la cotización en la Base de Datos." 
        });
    } finally {
        // Liberamos la conexión de vuelta al pool
        connection.release();
    }
};