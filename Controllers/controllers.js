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
        
        // 1. AUDITORÍA CRÍTICA: Mira la consola de VS Code al cargar la página
        console.log("👉 ESTRUCTURA REAL DE UN REGISTRO EN MYSQL:", rows[0]);

        const productosFinales = rows.map(p => {
            // 2. Imprimimos el valor exacto para ver si viene como undefined
            console.log(`Producto ID ${p.id} - p.precio es:`, p.precio);
            
            return {
                id: p.id,
                nombre: p.nombre,
                categoria: p.categoria,
                stock: p.stock,
                // Usamos un operador de respaldo por si la columna se llama distinto
                precioFormateado: p.precio ? `$${p.precio.toLocaleString('es-CL')}` : '$0',
                precioRaw: p.precio || 0 // Si es undefined, lo forzamos a 0 para que no desaparezca del JSON
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


